import dbConnect from '@/lib/mongodb-subscriber';
import mongoose from 'mongoose';

// Default values for subscribers
export const DEFAULT_KEY = '465B5CE8B199B49FAA5F0A2EE238A6BC';
export const DEFAULT_OPC = 'E8ED289DEBA952E4283B54E88E6183CA';

// Types
export interface Subscriber {
	id?: string;
	imsi: string;
	msisdn?: string;
	k: string;
	opc: string;
	amf: string;
	sqn: string;
	slice?: NetworkSlice[];
	security?: SecurityContext;
	access_restriction_data?: number;
	subscriber_status?: number;
	network_access_mode?: number;
	subscribed_rau_tau_timer?: number;
	operator_determined_barring?: number;
	created_at?: string;
	updated_at?: string;
	status: 'active' | 'inactive' | 'suspended';
}

interface NetworkSlice {
	sst: number;
	sd?: string;
	default_indicator?: boolean;
	session?: Session[];
}

interface Session {
	name: string;
	type: number;
	pcc_rule?: PccRule[];
	ambr?: {
		uplink: { value: number; unit: string };
		downlink: { value: number; unit: string };
	};
	qos?: {
		index: number;
		arp: {
			priority_level: number;
			pre_emption_capability: number;
			pre_emption_vulnerability: number;
		};
	};
}

interface PccRule {
	qos_id: number;
	priority?: number;
	flow?: Flow[];
}

interface Flow {
	description: string;
	direction: number;
}

interface SecurityContext {
	k: string;
	amf: string;
	op?: string;
	opc?: string;
	sqn: string;
}

interface GetSubscribersParams {
	page?: number;
	limit?: number;
	search?: string;
	status?: string;
	sortBy?: string;
	sortOrder?: 'asc' | 'desc';
}

interface BatchSubscriberParams {
	imsi_start: string;
	imsi_end: string;
	msisdn_start?: string;
	k: string;
	opc: string;
	amf: string;
	sqn: string;
	status: 'active' | 'inactive' | 'suspended';
	subscriber_status?: number;
	operator_determined_barring?: number;
	slice?: NetworkSlice[];
}

// Define Mongoose schema for Subscriber
const SubscriberSchema = new mongoose.Schema(
	{
		imsi: { type: String, required: true, unique: true },
		msisdn: { type: String },
		k: { type: String, required: true },
		opc: { type: String, required: true },
		amf: { type: String, required: true },
		sqn: { type: String, required: true },
		slice: [
			{
				sst: { type: Number },
				sd: { type: String },
				default_indicator: { type: Boolean },
				session: [
					{
						name: { type: String },
						type: { type: Number },
						pcc_rule: [
							{
								qos_id: { type: Number },
								priority: { type: Number },
								flow: [
									{
										description: { type: String },
										direction: { type: Number },
									},
								],
							},
						],
						ambr: {
							uplink: {
								value: { type: Number },
								unit: { type: String },
							},
							downlink: {
								value: { type: Number },
								unit: { type: String },
							},
						},
						qos: {
							index: { type: Number },
							arp: {
								priority_level: { type: Number },
								pre_emption_capability: { type: Number },
								pre_emption_vulnerability: { type: Number },
							},
						},
					},
				],
			},
		],
		security: {
			k: { type: String },
			amf: { type: String },
			op: { type: String },
			opc: { type: String },
			sqn: { type: String },
		},
		access_restriction_data: { type: Number },
		subscriber_status: { type: Number },
		network_access_mode: { type: Number },
		subscribed_rau_tau_timer: { type: Number },
		operator_determined_barring: { type: Number },
		status: {
			type: String,
			enum: ['active', 'inactive', 'suspended'],
			default: 'active',
		},
	},
	{ timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } }
);

// Helper function to get the Subscriber model
const getSubscriberModel = () => {
	// Check if the model is already defined
	return mongoose.models.Subscriber || mongoose.model('Subscriber', SubscriberSchema, 'subscribers');
};

// Helper function to convert Mongoose document to Subscriber
const formatSubscriber = (doc: any): Subscriber => {
	const docObj = doc.toObject ? doc.toObject() : doc;

	return {
		id: docObj._id.toString(),
		imsi: docObj.imsi,
		msisdn: docObj.msisdn,
		k: docObj.k,
		opc: docObj.opc,
		amf: docObj.amf,
		sqn: docObj.sqn,
		slice: docObj.slice,
		security: docObj.security,
		access_restriction_data: docObj.access_restriction_data,
		subscriber_status: docObj.subscriber_status,
		network_access_mode: docObj.network_access_mode,
		subscribed_rau_tau_timer: docObj.subscribed_rau_tau_timer,
		operator_determined_barring: docObj.operator_determined_barring,
		created_at: docObj.created_at?.toISOString(),
		updated_at: docObj.updated_at?.toISOString(),
		status: docObj.status,
	};
};

export async function getSubscribers({
	page = 1,
	limit = 10,
	search = '',
	status = 'all',
	sortBy = 'imsi',
	sortOrder = 'asc',
}: GetSubscribersParams) {
	console.log('Fetching subscribers with params:', { page, limit, search, status, sortBy, sortOrder });

	try {
		await dbConnect();
		console.log('MongoDB connected successfully');

		// Build query
		const queryFilter: any = {};

		if (search) {
			queryFilter.$or = [{ imsi: { $regex: search, $options: 'i' } }, { msisdn: { $regex: search, $options: 'i' } }];
		}

		if (status !== 'all') {
			queryFilter.status = status;
		}

		console.log('Executing query:', JSON.stringify(queryFilter));

		// Build sort object
		const sortObject: any = {};
		if (sortBy) {
			sortObject[sortBy] = sortOrder === 'desc' ? -1 : 1;
		} else {
			sortObject.imsi = 1; // Default sort by IMSI ascending
		}

		// Execute query with pagination and sorting
		const skip = (page - 1) * limit;
		const SubscriberModel = getSubscriberModel();
		console.log('Collection name:', SubscriberModel.collection.name);
		console.log('Sort object:', sortObject);

		try {
			// First, let's check if the collection exists and has data
			const collectionCount = await SubscriberModel.collection.countDocuments({}).catch(() => 0);
			console.log('Total documents in collection:', collectionCount);

			const [subscribers, total] = await Promise.all([
				SubscriberModel.find(queryFilter).sort(sortObject).skip(skip).limit(limit).lean(),
				SubscriberModel.countDocuments(queryFilter),
			]);

			console.log(`Found ${subscribers.length} subscribers out of ${total} total`);
			console.log(
				'Sample subscriber data:',
				subscribers[0] ? JSON.stringify(subscribers[0], null, 2) : 'No subscribers found'
			);

			// Return empty result if no subscribers found
			if (subscribers.length === 0 && total === 0) {
				console.log('No subscribers found in database');
			}

			return {
				subscribers: subscribers.map(formatSubscriber),
				pagination: {
					total,
					page,
					limit,
					pages: Math.ceil(total / limit),
				},
			};
		} catch (queryError) {
			console.error('Error executing query:', queryError);
			throw queryError;
		}
	} catch (error) {
		console.error('Error fetching subscribers:', error);
		// Return empty result instead of throwing to avoid breaking the UI
		return {
			subscribers: [],
			pagination: {
				total: 0,
				page,
				limit,
				pages: 0,
			},
		};
	}
}

export async function getSubscriberById(id: string) {
	await dbConnect();

	// Try to find by ObjectId or IMSI
	let subscriber;

	try {
		if (mongoose.Types.ObjectId.isValid(id)) {
			subscriber = await getSubscriberModel().findById(id).lean();
		}
	} catch (error) {
		console.error('Error finding by ID:', error);
	}

	if (!subscriber) {
		subscriber = await getSubscriberModel().findOne({ imsi: id }).lean();
	}

	return subscriber ? formatSubscriber(subscriber) : null;
}

export async function createSubscriber(data: Partial<Subscriber>) {
	console.log('Creating/updating subscriber with data:', data);

	try {
		await dbConnect();

		// Ensure required fields
		if (!data.imsi || !data.k || !data.opc) {
			console.error('Missing required fields for subscriber creation');
			throw new Error('Missing required fields: IMSI, K, and OPc are required');
		}

		const SubscriberModel = getSubscriberModel();

		// Check if subscriber already exists
		const existingSubscriber = await SubscriberModel.findOne({ imsi: data.imsi }).lean();
		const isUpdate = !!existingSubscriber;

		// Use findOneAndUpdate with upsert to create or update
		const subscriber = await SubscriberModel.findOneAndUpdate(
			{ imsi: data.imsi }, // Find by IMSI
			{ $set: data }, // Update with new data
			{
				new: true, // Return the updated document
				upsert: true, // Create if doesn't exist
				lean: true, // Return plain object instead of Mongoose document
			}
		);

		if (!subscriber) {
			throw new Error('Failed to create/update subscriber');
		}

		console.log(`Subscriber ${isUpdate ? 'updated' : 'created'} successfully:`, (subscriber as any)._id);

		return {
			subscriber: formatSubscriber(subscriber),
			isUpdate,
		};
	} catch (error) {
		console.error('Error creating/updating subscriber:', error);
		throw error;
	}
}

export async function updateSubscriber(id: string, data: Partial<Subscriber>) {
	console.log('Updating subscriber:', id, 'with data:', data);

	try {
		await dbConnect();

		let subscriber;
		const SubscriberModel = getSubscriberModel();

		// Try to find by ObjectId or IMSI
		if (mongoose.Types.ObjectId.isValid(id)) {
			subscriber = await SubscriberModel.findByIdAndUpdate(id, { $set: data }, { new: true }).lean();
		} else {
			subscriber = await SubscriberModel.findOneAndUpdate({ imsi: id }, { $set: data }, { new: true }).lean();
		}

		if (!subscriber) {
			console.warn(`Subscriber with ID/IMSI ${id} not found for update`);
			return null;
		}

		console.log('Subscriber updated successfully:', id);
		return formatSubscriber(subscriber);
	} catch (error) {
		console.error('Error updating subscriber:', error);
		throw error;
	}
}

export async function deleteSubscriber(id: string) {
	console.log('Deleting subscriber:', id);

	try {
		await dbConnect();

		let result;
		const SubscriberModel = getSubscriberModel();

		// Try to delete by ObjectId or IMSI
		if (mongoose.Types.ObjectId.isValid(id)) {
			result = await SubscriberModel.findByIdAndDelete(id);
		} else {
			result = await SubscriberModel.findOneAndDelete({ imsi: id });
		}

		if (!result) {
			console.warn(`Subscriber with ID/IMSI ${id} not found for deletion`);
			return false;
		}

		console.log('Subscriber deleted successfully:', id);
		return true;
	} catch (error) {
		console.error('Error deleting subscriber:', error);
		throw error;
	}
}

export async function createBatchSubscribers(params: BatchSubscriberParams) {
	await dbConnect();

	const {
		imsi_start,
		imsi_end,
		msisdn_start,
		k,
		opc,
		amf,
		sqn,
		status,
		subscriber_status,
		operator_determined_barring,
		slice,
	} = params;

	// Convert to BigInt for proper numerical handling while preserving leading zeros
	const startImsi = BigInt(imsi_start);
	const endImsi = BigInt(imsi_end);

	// Calculate range size
	const rangeSize = Number(endImsi - startImsi) + 1;

	// Check for existing IMSIs in the range
	const existingImsis = await getSubscriberModel()
		.find(
			{
				imsi: {
					$gte: imsi_start,
					$lte: imsi_end,
				},
			},
			'imsi'
		)
		.lean();

	const existingImsiSet = new Set(existingImsis.map((doc) => doc.imsi));

	let msisdnCounter = msisdn_start ? BigInt(msisdn_start) : null;
	const operations = [];
	let createdCount = 0;
	let updatedCount = 0;

	// Process each IMSI in the range
	for (let i = 0; i < rangeSize; i++) {
		// Preserve leading zeros by padding to 15 digits
		const currentImsi = (startImsi + BigInt(i)).toString().padStart(15, '0');
		const isUpdate = existingImsiSet.has(currentImsi);

		const subscriberData: any = {
			imsi: currentImsi,
			k,
			opc,
			amf,
			sqn,
			status,
			subscriber_status: subscriber_status ?? 0,
			operator_determined_barring: operator_determined_barring ?? 0,
		};

		// Add slice configuration if provided
		if (slice && slice.length > 0) {
			subscriberData.slice = slice;
		}

		// Assign sequential MSISDN if msisdn_start was provided
		if (msisdnCounter) {
			// Preserve original MSISDN length by padding with zeros if needed
			const originalLength = msisdn_start?.length || 10;
			subscriberData.msisdn = msisdnCounter.toString().padStart(originalLength, '0');
			msisdnCounter = msisdnCounter + BigInt(1);
		}

		// Use upsert operation (update if exists, create if not)
		operations.push({
			updateOne: {
				filter: { imsi: currentImsi },
				update: { $set: subscriberData },
				upsert: true,
			},
		});

		if (isUpdate) {
			updatedCount++;
		} else {
			createdCount++;
		}
	}

	// Execute bulk upsert operations
	const processedSubscribers = [];
	if (operations.length > 0) {
		await getSubscriberModel().bulkWrite(operations);

		// Fetch the updated/created subscribers
		const subscriberResults = await getSubscriberModel()
			.find({
				imsi: {
					$gte: imsi_start,
					$lte: imsi_end,
				},
			})
			.lean();

		processedSubscribers.push(...subscriberResults.map(formatSubscriber));
	}

	return {
		subscribers: processedSubscribers,
		createdCount,
		updatedCount,
		totalProcessed: createdCount + updatedCount,
	};
}

export async function deleteAllSubscribers() {
	console.log('Deleting all subscribers');

	try {
		await dbConnect();

		const SubscriberModel = getSubscriberModel();

		// Get count before deletion for logging
		const countBefore = await SubscriberModel.countDocuments({});
		console.log(`Found ${countBefore} subscribers to delete`);

		// Delete all subscribers
		const result = await SubscriberModel.deleteMany({});

		console.log(`Successfully deleted ${result.deletedCount} subscribers`);

		return {
			deletedCount: result.deletedCount,
			success: true,
		};
	} catch (error) {
		console.error('Error deleting all subscribers:', error);
		throw error;
	}
}
