import mongoose, { Schema, Document, Model } from 'mongoose';
import { NetworkFunction as INetworkFunction, NetworkFunctionType, PLMN, Vector2D } from '@/types/network';
import slugify from 'slugify';

// Define PLMN Schema separately for embedding
const PlmnSchema = new Schema<PLMN>(
	{
		id: { type: String, required: true }, // MCC-MNC
		name: { type: String, required: true },
		role: { type: String, enum: ['home', 'visited'], required: true },
	},
	{ _id: false }
); // No separate _id for embedded PLMN

// Define Vector2D Schema for embedding
const Vector2DSchema = new Schema<Vector2D>(
	{
		x: { type: Number, required: true },
		y: { type: Number, required: true },
	},
	{ _id: false }
); // No separate _id for embedded Vector2D

// Define interface for document with MongoDB-specific fields
export interface NetworkFunctionDocument extends Document {
	id: string;
	slug: string;
	name: string;
	type: NetworkFunctionType;
	plmn: PLMN;
	status: 'active' | 'inactive' | 'error';
	connections: string[];
	position: Vector2D;
	messages?: mongoose.Types.ObjectId[];
	ipAddress?: string;
	description?: string;
}

// Define main NetworkFunction Schema
const NetworkFunctionSchema = new Schema<NetworkFunctionDocument>(
	{
		id: {
			type: String,
			default: function (this: any) {
				return this._id ? this._id.toString() : null;
			},
		},
		slug: {
			type: String,
			unique: true,
			index: true,
		},
		type: {
			type: String,
			enum: ['AMF', 'SMF', 'UPF', 'AUSF', 'UDM', 'NRF', 'SEPP', 'PCF', 'NSSF', 'NEF', 'gNodeB', 'UE', 'SCP'],
			required: true,
		},
		name: { type: String, required: true, index: true },
		plmn: { type: PlmnSchema, required: true },
		status: {
			type: String,
			enum: ['active', 'inactive', 'error'],
			default: 'inactive',
		},
		connections: [{ type: String, ref: 'Connection' }], // Store connection IDs as strings
		position: { type: Vector2DSchema, required: true },
		messages: [{ type: Schema.Types.ObjectId, ref: 'Message' }], // Reference messages
		ipAddress: { type: String },
		description: { type: String },
	},
	{ timestamps: true }
);

// Pre-save middleware to generate slug from name
NetworkFunctionSchema.pre('save', function (next) {
	if (!this.slug && this.name) {
		this.slug = slugify(this.name, { lower: true, strict: true });
	}
	next();
});

// Fix for client components in Next.js
let NetworkFunctionModel: Model<NetworkFunctionDocument>;

// Only create the model on the server side
if (typeof window === 'undefined') {
	// We're on the server
	NetworkFunctionModel =
		mongoose.models.NetworkFunction ||
		mongoose.model<NetworkFunctionDocument>('NetworkFunction', NetworkFunctionSchema);
} else {
	// We're on the client - provide a minimal implementation
	NetworkFunctionModel = {} as Model<NetworkFunctionDocument>;
}

export default NetworkFunctionModel;
