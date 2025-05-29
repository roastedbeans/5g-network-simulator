import { v4 as uuidv4 } from 'uuid';
import slugify from 'slugify';
import { NetworkFunction, NetworkFunctionType, Vector2D, Connection } from '@/types/network';
import NetworkFunctionModel, { NetworkFunctionDocument } from '@/models/NetworkFunction';
import ConnectionModel from '@/models/Connection';
import dbConnect from '@/lib/mongodb';

// Check if we're on the server side before using mongoose
const isServer = typeof window === 'undefined';

/**
 * Transform a MongoDB document to a NetworkFunction type
 * This ensures the types match regardless of how MongoDB returns the document
 */
function documentToNetworkFunction(doc: any): NetworkFunction {
	if (!doc) return null as unknown as NetworkFunction;

	return {
		id: doc.id || (doc._id ? doc._id.toString() : ''),
		slug: doc.slug || '',
		name: doc.name || '',
		type: doc.type as NetworkFunctionType,
		plmn: doc.plmn,
		status: doc.status || 'inactive',
		connections: [], // Empty array by default, populated separately if needed
		position: doc.position,
		messages: Array.isArray(doc.messages) ? doc.messages : [],
		ipAddress: doc.ipAddress,
		description: doc.description,
	};
}

/**
 * Create a new network function
 */
export async function createNetworkFunction(
	name: string,
	type: NetworkFunctionType,
	position: Vector2D,
	description?: string,
	ipAddress?: string
): Promise<NetworkFunction> {
	// Generate slug from name
	const slug = slugify(name, { lower: true, strict: true });

	if (!isServer) {
		// We're on the client side - this should be handled through an API call
		console.warn('Attempting to create a network function on the client side');
		// Return a mock object that looks like a network function
		return {
			id: uuidv4(),
			slug,
			name,
			type,
			plmn: {
				id: '070-999',
				name: 'VPLMN',
				role: 'visited',
			},
			status: 'inactive',
			connections: [],
			position,
			messages: [],
			description,
			ipAddress,
		};
	}

	// Server-side code
	await dbConnect();

	const networkFunction = await NetworkFunctionModel.create({
		id: uuidv4(),
		slug,
		name,
		type,
		plmn: {
			id: '070-999',
			name: 'VPLMN',
			role: 'visited',
		},
		status: 'inactive',
		connections: [],
		position,
		messages: [],
		description,
		ipAddress,
	});

	return documentToNetworkFunction(networkFunction);
}

/**
 * Get all network functions
 */
export async function getNetworkFunctions() {
	if (!isServer) {
		console.warn('Attempted to get network functions on client side');
		return [];
	}

	await dbConnect();
	const docs = await NetworkFunctionModel.find().lean();
	return docs.map((doc) => documentToNetworkFunction(doc as any)) as any;
}

/**
 * Get a single network function by ID
 */
export async function getNetworkFunction(id: string) {
	if (!isServer) {
		console.warn('Attempted to get network function on client side');
		return null;
	}

	await dbConnect();
	const doc = await NetworkFunctionModel.findOne({ id }).lean();
	return doc ? (documentToNetworkFunction(doc as any) as any) : null;
}

/**
 * Get a single network function by slug
 */
export async function getNetworkFunctionBySlug(slug: string) {
	if (!isServer) {
		console.warn('Attempted to get network function on client side');
		return null;
	}

	await dbConnect();
	const doc = await NetworkFunctionModel.findOne({ slug }).lean();
	return doc ? (documentToNetworkFunction(doc as any) as any) : null;
}

/**
 * Update a network function
 */
export async function updateNetworkFunction(
	id: string,
	data: Partial<NetworkFunction>
): Promise<NetworkFunction | null> {
	const updated = await NetworkFunctionModel.findOneAndUpdate({ id }, data, { new: true }).lean();
	return updated ? documentToNetworkFunction(updated) : null;
}

/**
 * Delete a network function
 */
export async function deleteNetworkFunction(id: string): Promise<boolean> {
	// Find the network function to get its slug
	const networkFunction = await NetworkFunctionModel.findOne({ id });
	if (!networkFunction) {
		return false;
	}

	const slug = networkFunction.slug;

	// Delete the network function
	const result = await NetworkFunctionModel.deleteOne({ id });
	if (result.deletedCount === 0) {
		return false;
	}

	// Delete associated connections
	await ConnectionModel.deleteMany({
		$or: [{ source: slug }, { target: slug }],
	});

	return true;
}

/**
 * Change network function status
 */
export async function changeNetworkFunctionStatus(
	id: string,
	status: 'active' | 'inactive' | 'error'
): Promise<NetworkFunction | null> {
	const updated = await NetworkFunctionModel.findOneAndUpdate({ id }, { status }, { new: true }).lean();
	return updated ? documentToNetworkFunction(updated) : null;
}

/**
 * Convert MongoDB connection document to Connection type
 */
function documentToConnection(conn: any): Connection {
	if (!conn) return null as unknown as Connection;

	return {
		id: conn.id || (conn._id ? conn._id.toString() : ''),
		source: conn.source || '',
		target: conn.target || '',
		protocol: conn.protocol,
		status: conn.status || 'inactive',
		sourceName: conn.sourceName,
		targetName: conn.targetName,
		label: conn.label,
		sourceHandle: conn.sourceHandle,
		targetHandle: conn.targetHandle,
	};
}

/**
 * Get connections for a network function
 */
export async function getNetworkFunctionConnections(id: string): Promise<Connection[]> {
	// Find the network function to get its slug
	const networkFunction = await NetworkFunctionModel.findOne({ id });
	if (!networkFunction) {
		return [];
	}

	const slug = networkFunction.slug;

	// Get connections and transform them
	const connections = await ConnectionModel.find({
		$or: [{ source: slug }, { target: slug }],
	}).lean();

	return connections.map(documentToConnection);
}

/**
 * Get predefined network function template by type
 */
export function getNetworkFunctionTemplate(type: NetworkFunctionType) {
	// This function doesn't require database access, so it can run on client or server
	const templates: Record<NetworkFunctionType, { description: string; capabilities: string[] }> = {
		AMF: {
			description: 'Access and Mobility Management Function',
			capabilities: ['Authentication', 'Authorization', 'Mobility Management'],
		},
		SMF: {
			description: 'Session Management Function',
			capabilities: ['Session Establishment', 'Session Modification', 'Session Release'],
		},
		UPF: {
			description: 'User Plane Function',
			capabilities: ['Packet Routing', 'QoS Enforcement', 'Traffic Measurement'],
		},
		AUSF: {
			description: 'Authentication Server Function',
			capabilities: ['Authentication', 'Security Key Generation', 'SIM Authentication'],
		},
		UDM: {
			description: 'Unified Data Management',
			capabilities: ['Subscriber Data', 'Authentication Data', 'Access Authorization'],
		},
		SCP: {
			description: 'Service Capability Proxy',
			capabilities: ['Service Capability Discovery', 'Service Capability Selection', 'Service Capability Notification'],
		},
		NRF: {
			description: 'Network Repository Function',
			capabilities: ['Service Registration', 'Service Discovery', 'NF Profile Management'],
		},
		SEPP: {
			description: 'Security Edge Protection Proxy',
			capabilities: ['Inter-PLMN Security', 'Message Filtering', 'Protocol Translation'],
		},
		PCF: {
			description: 'Policy Control Function',
			capabilities: ['Policy Rules', 'Charging Control', 'QoS Management'],
		},
		NSSF: {
			description: 'Network Slice Selection Function',
			capabilities: ['Slice Selection', 'Slice Instance Selection', 'Network Slice Management'],
		},
		NEF: {
			description: 'Network Exposure Function',
			capabilities: ['API Exposure', 'Event Monitoring', 'Service Capability Exposure'],
		},
		gNodeB: {
			description: '5G Base Station',
			capabilities: ['Radio Access', 'User Equipment Connection', 'Radio Resource Management'],
		},
		UE: {
			description: 'User Equipment',
			capabilities: ['Connection Management', 'Application Processing', 'Mobility'],
		},
	};

	return (
		templates[type] || {
			description: `${type} Network Function`,
			capabilities: [],
		}
	);
}
