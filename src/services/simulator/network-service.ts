import { v4 as uuidv4 } from 'uuid';
import { NetworkFunction, NetworkFunctionType, Vector2D } from '@/types/network';
import NetworkFunctionModel from '@/models/NetworkFunction';
import ConnectionModel from '@/models/Connection';
import dbConnect from '@/lib/mongodb';

// Check if we're on the server side before using mongoose
const isServer = typeof window === 'undefined';

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
	if (!isServer) {
		// We're on the client side - this should be handled through an API call
		console.warn('Attempting to create a network function on the client side');
		// Return a mock object that looks like a network function
		return {
			id: uuidv4(),
			name,
			type,
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
		name,
		type,
		status: 'inactive',
		connections: [],
		position,
		messages: [],
		description,
		ipAddress,
	});

	return networkFunction;
}

/**
 * Get all network functions
 */
export async function getNetworkFunctions(): Promise<NetworkFunction[]> {
	if (!isServer) {
		// Client-side mock
		console.warn('Attempting to fetch network functions on the client side');
		return [];
	}

	await dbConnect();
	return NetworkFunctionModel.find({}).lean();
}

/**
 * Get a network function by ID
 */
export async function getNetworkFunctionById(id: string): Promise<NetworkFunction | null> {
	return NetworkFunctionModel.findOne({ id }).lean();
}

/**
 * Update a network function
 */
export async function updateNetworkFunction(
	id: string,
	data: Partial<NetworkFunction>
): Promise<NetworkFunction | null> {
	return NetworkFunctionModel.findOneAndUpdate({ id }, data, { new: true }).lean();
}

/**
 * Delete a network function
 */
export async function deleteNetworkFunction(id: string): Promise<boolean> {
	const result = await NetworkFunctionModel.deleteOne({ id });
	if (result.deletedCount === 0) {
		return false;
	}

	// Delete associated connections
	await ConnectionModel.deleteMany({
		$or: [{ source: id }, { target: id }],
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
	return NetworkFunctionModel.findOneAndUpdate({ id }, { status }, { new: true }).lean();
}

/**
 * Get connections for a network function
 */
export async function getNetworkFunctionConnections(id: string) {
	return ConnectionModel.find({
		$or: [{ source: id }, { target: id }],
	}).lean();
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
		'5GC': {
			description: '5G Core Network',
			capabilities: ['Network Slicing', 'Service-Based Architecture', 'Edge Computing Support'],
		},
		RAN: {
			description: 'Radio Access Network',
			capabilities: ['Radio Resource Management', 'Mobility Management', 'Radio Bearer Control'],
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
