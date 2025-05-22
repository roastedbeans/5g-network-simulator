import { v4 as uuidv4 } from 'uuid';
import { Connection, ProtocolType } from '@/types/network';
import ConnectionModel from '@/models/Connection';
import NetworkFunctionModel from '@/models/NetworkFunction';

/**
 * Create a new connection between two network functions
 */
export async function createConnection(
	sourceSlug: string,
	targetSlug: string,
	protocol: ProtocolType,
	latency?: number,
	bandwidth?: number
): Promise<Connection> {
	// Validate that both network functions exist
	const [source, target] = await Promise.all([
		NetworkFunctionModel.findOne({ slug: sourceSlug }),
		NetworkFunctionModel.findOne({ slug: targetSlug }),
	]);

	if (!source || !target) {
		throw new Error('Source or target network function not found');
	}

	const connection = await ConnectionModel.create({
		id: uuidv4(),
		source: sourceSlug,
		target: targetSlug,
		sourceName: source.name,
		targetName: target.name,
		protocol,
		status: 'inactive',
		latency,
		bandwidth,
	});

	// Get the string ID of the connection
	const connectionId = connection._id?.toString() || connection.id;
	console.log(`Created connection ${connectionId} between ${sourceSlug} and ${targetSlug}`);

	// Update the connections array in both network functions
	const updateSourcePromise = NetworkFunctionModel.findOneAndUpdate(
		{ slug: sourceSlug },
		{ $addToSet: { connections: connectionId } }
	);

	const updateTargetPromise = NetworkFunctionModel.findOneAndUpdate(
		{ slug: targetSlug },
		{ $addToSet: { connections: connectionId } }
	);

	await Promise.all([updateSourcePromise, updateTargetPromise]);

	console.log(`Updated network functions with connection reference: ${connectionId}`);

	return connection;
}

/**
 * Get all connections
 */
export async function getConnections(): Promise<Connection[]> {
	return ConnectionModel.find().lean();
}

/**
 * Get a connection by ID
 */
export async function getConnection(id: string): Promise<Connection | null> {
	return ConnectionModel.findOne({ id }).lean();
}

/**
 * Update a connection
 */
export async function updateConnection(id: string, updates: Partial<Connection>): Promise<Connection | null> {
	return ConnectionModel.findOneAndUpdate({ id }, updates, { new: true }).lean();
}

/**
 * Delete a connection
 */
export async function deleteConnection(id: string): Promise<boolean> {
	const connection = await ConnectionModel.findOne({ id });
	if (!connection) {
		return false;
	}

	const { source, target } = connection;

	await Promise.all([
		NetworkFunctionModel.findOneAndUpdate({ slug: source }, { $pull: { connections: id } }),
		NetworkFunctionModel.findOneAndUpdate({ slug: target }, { $pull: { connections: id } }),
	]);

	const result = await ConnectionModel.deleteOne({ id });
	return result.deletedCount > 0;
}

/**
 * Change connection status
 */
export async function changeConnectionStatus(
	id: string,
	status: 'active' | 'inactive' | 'error'
): Promise<Connection | null> {
	return ConnectionModel.findOneAndUpdate({ id }, { status }, { new: true });
}

/**
 * Get all connections for a simulation
 */
export async function getConnectionsForSimulation(simulationId: string): Promise<Connection[]> {
	const simulation = await import('@/models/Simulation').then((module) => module.default.findOne({ id: simulationId }));

	if (!simulation) {
		return [];
	}

	return ConnectionModel.find({
		id: { $in: simulation.connections },
	});
}

/**
 * Get protocol description and characteristics
 */
export function getProtocolInfo(protocol: ProtocolType) {
	const protocolInfo: Record<ProtocolType, { description: string; usedFor: string }> = {
		N1: {
			description: 'Interface between UE and AMF',
			usedFor: 'Registration, Authentication, NAS signaling',
		},
		N2: {
			description: 'Interface between RAN and AMF',
			usedFor: 'RAN-Core control signaling',
		},
		N3: {
			description: 'Interface between RAN and UPF',
			usedFor: 'User plane traffic',
		},
		N4: {
			description: 'Interface between SMF and UPF',
			usedFor: 'UPF control and configuration',
		},
		N6: {
			description: 'Interface between UPF and Data Network',
			usedFor: 'User traffic to external networks',
		},
		N8: {
			description: 'Interface between UDM and AMF',
			usedFor: 'Registration, access authentication',
		},
		N11: {
			description: 'Interface between AMF and SMF',
			usedFor: 'Session management',
		},
		N9: {
			description: 'Interface between UPFs',
			usedFor: 'User plane data transfer between V-UPF and H-UPF',
		},
		N10: {
			description: 'Interface between UDM and SMF',
			usedFor: 'Subscription data retrieval for session management',
		},
		N12: {
			description: 'Interface between AMF and AUSF',
			usedFor: 'UE authentication',
		},
		N13: {
			description: 'Interface between UDM and AUSF',
			usedFor: 'Authentication credential exchange',
		},
		N14: {
			description: 'Interface between AMFs',
			usedFor: 'AMF mobility and handover between PLMNs',
		},
		N15: {
			description: 'Interface between AMF and PCF',
			usedFor: 'Policy control',
		},
		N27: {
			description: 'Interface between SCPs',
			usedFor: 'Service discovery and routing',
		},
		N32: {
			description: 'Interface between SEPPs',
			usedFor: 'Secure inter-PLMN message exchange',
		},
		SBI: {
			description: 'Interface between network functions',
			usedFor: 'Service discovery and routing',
		},
	};

	return (
		protocolInfo[protocol] || {
			description: `${protocol} Interface`,
			usedFor: 'Communication between network functions',
		}
	);
}
