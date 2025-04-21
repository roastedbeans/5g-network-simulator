import { v4 as uuidv4 } from 'uuid';
import { Connection, ProtocolType } from '@/types/network';
import ConnectionModel from '@/models/Connection';
import NetworkFunctionModel from '@/models/NetworkFunction';

/**
 * Create a new connection between two network functions
 */
export async function createConnection(
	sourceId: string,
	targetId: string,
	protocol: ProtocolType,
	latency?: number,
	bandwidth?: number
): Promise<Connection> {
	// Validate that both network functions exist
	const [source, target] = await Promise.all([
		NetworkFunctionModel.findOne({ id: sourceId }),
		NetworkFunctionModel.findOne({ id: targetId }),
	]);

	if (!source || !target) {
		throw new Error('Source or target network function not found');
	}

	const connection = await ConnectionModel.create({
		id: uuidv4(),
		source: sourceId,
		target: targetId,
		protocol,
		status: 'inactive',
		latency,
		bandwidth,
	});

	// Update the connections array in both network functions
	await Promise.all([
		NetworkFunctionModel.findOneAndUpdate({ id: sourceId }, { $push: { connections: connection.id } }),
		NetworkFunctionModel.findOneAndUpdate({ id: targetId }, { $push: { connections: connection.id } }),
	]);

	return connection;
}

/**
 * Get all connections
 */
export async function getConnections(): Promise<Connection[]> {
	return ConnectionModel.find({});
}

/**
 * Get connection by ID
 */
export async function getConnectionById(id: string): Promise<Connection | null> {
	return ConnectionModel.findOne({ id });
}

/**
 * Update a connection
 */
export async function updateConnection(id: string, data: Partial<Connection>): Promise<Connection | null> {
	return ConnectionModel.findOneAndUpdate({ id }, data, { new: true });
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
		NetworkFunctionModel.findOneAndUpdate({ id: source }, { $pull: { connections: id } }),
		NetworkFunctionModel.findOneAndUpdate({ id: target }, { $pull: { connections: id } }),
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
	};

	return (
		protocolInfo[protocol] || {
			description: `${protocol} Interface`,
			usedFor: 'Communication between network functions',
		}
	);
}
