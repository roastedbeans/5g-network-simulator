import { v4 as uuidv4 } from 'uuid';
import { Simulation } from '@/types/network';
import SimulationModel from '@/models/Simulation';
import NetworkFunctionModel from '@/models/NetworkFunction';
import ConnectionModel from '@/models/Connection';
import MessageModel from '@/models/Message';

/**
 * Create a new simulation
 */
export async function createSimulation(name: string, description?: string): Promise<Simulation> {
	const simulation = await SimulationModel.create({
		id: uuidv4(),
		name,
		description,
		networkFunctions: [],
		connections: [],
		messages: [],
		status: 'stopped',
	});

	return simulation;
}

/**
 * Get all simulations
 */
export async function getSimulations(): Promise<Simulation[]> {
	return SimulationModel.find({});
}

/**
 * Get simulation by ID
 */
export async function getSimulationById(id: string): Promise<Simulation | null> {
	return SimulationModel.findOne({ id });
}

/**
 * Update simulation
 */
export async function updateSimulation(id: string, data: Partial<Simulation>): Promise<Simulation | null> {
	return SimulationModel.findOneAndUpdate({ id }, data, { new: true });
}

/**
 * Delete simulation
 */
export async function deleteSimulation(id: string): Promise<boolean> {
	const result = await SimulationModel.deleteOne({ id });
	return result.deletedCount > 0;
}

/**
 * Add a network function to a simulation
 */
export async function addNetworkFunctionToSimulation(
	simulationId: string,
	networkFunctionId: string
): Promise<Simulation | null> {
	return SimulationModel.findOneAndUpdate(
		{ id: simulationId },
		{ $addToSet: { networkFunctions: networkFunctionId } },
		{ new: true }
	);
}

/**
 * Remove a network function from a simulation
 */
export async function removeNetworkFunctionFromSimulation(
	simulationId: string,
	networkFunctionId: string
): Promise<Simulation | null> {
	const simulation = await SimulationModel.findOne({ id: simulationId });
	if (!simulation) {
		return null;
	}

	// Remove connections that involve this network function
	const connections = await ConnectionModel.find({
		$or: [{ source: networkFunctionId }, { target: networkFunctionId }],
	});

	const connectionIds = connections.map((conn) => conn.id);

	// Update the simulation by removing the network function and its connections
	return SimulationModel.findOneAndUpdate(
		{ id: simulationId },
		{
			$pull: {
				networkFunctions: networkFunctionId,
				connections: { $in: connectionIds },
			},
		},
		{ new: true }
	);
}

/**
 * Add a connection to a simulation
 */
export async function addConnectionToSimulation(
	simulationId: string,
	connectionId: string
): Promise<Simulation | null> {
	return SimulationModel.findOneAndUpdate(
		{ id: simulationId },
		{ $addToSet: { connections: connectionId } },
		{ new: true }
	);
}

/**
 * Start a simulation
 */
export async function startSimulation(id: string): Promise<Simulation | null> {
	const simulation = await SimulationModel.findOne({ id });
	if (!simulation) {
		return null;
	}

	// Activate all network functions in the simulation
	await NetworkFunctionModel.updateMany({ id: { $in: simulation.networkFunctions } }, { status: 'active' });

	// Activate all connections in the simulation
	await ConnectionModel.updateMany({ id: { $in: simulation.connections } }, { status: 'active' });

	return SimulationModel.findOneAndUpdate(
		{ id },
		{
			status: 'running',
			startTime: new Date(),
			endTime: null,
		},
		{ new: true }
	);
}

/**
 * Stop a simulation
 */
export async function stopSimulation(id: string): Promise<Simulation | null> {
	const simulation = await SimulationModel.findOne({ id });
	if (!simulation) {
		return null;
	}

	// Set all network functions to inactive
	await NetworkFunctionModel.updateMany({ id: { $in: simulation.networkFunctions } }, { status: 'inactive' });

	// Set all connections to inactive
	await ConnectionModel.updateMany({ id: { $in: simulation.connections } }, { status: 'inactive' });

	return SimulationModel.findOneAndUpdate(
		{ id },
		{
			status: 'stopped',
			endTime: new Date(),
		},
		{ new: true }
	);
}

/**
 * Pause a simulation
 */
export async function pauseSimulation(id: string): Promise<Simulation | null> {
	return SimulationModel.findOneAndUpdate({ id }, { status: 'paused' }, { new: true });
}

/**
 * Reset a simulation (clear all messages)
 */
export async function resetSimulation(id: string): Promise<Simulation | null> {
	const simulation = await SimulationModel.findOne({ id });
	if (!simulation) {
		return null;
	}

	// Delete all messages associated with this simulation
	await MessageModel.deleteMany({
		$or: [{ source: { $in: simulation.networkFunctions } }, { destination: { $in: simulation.networkFunctions } }],
	});

	// Remove messages from network functions
	await NetworkFunctionModel.updateMany({ id: { $in: simulation.networkFunctions } }, { messages: [] });

	// Update simulation with empty messages array
	return SimulationModel.findOneAndUpdate(
		{ id },
		{
			messages: [],
			status: 'stopped',
			endTime: null,
			startTime: null,
		},
		{ new: true }
	);
}

/**
 * Get statistics for a simulation
 */
export async function getSimulationStats(id: string) {
	const simulation = await SimulationModel.findOne({ id });
	if (!simulation) {
		return null;
	}

	const [networkFunctions, connections, messages] = await Promise.all([
		NetworkFunctionModel.find({ id: { $in: simulation.networkFunctions } }),
		ConnectionModel.find({ id: { $in: simulation.connections } }),
		MessageModel.find({
			$or: [{ source: { $in: simulation.networkFunctions } }, { destination: { $in: simulation.networkFunctions } }],
		}),
	]);

	const messageTypes = messages.reduce((acc, msg) => {
		acc[msg.type] = (acc[msg.type] || 0) + 1;
		return acc;
	}, {} as Record<string, number>);

	const protocolUsage = messages.reduce((acc, msg) => {
		if (msg.protocol) {
			acc[msg.protocol] = (acc[msg.protocol] || 0) + 1;
		}
		return acc;
	}, {} as Record<string, number>);

	return {
		networkFunctionCount: networkFunctions.length,
		connectionCount: connections.length,
		messageCount: messages.length,
		networkFunctionTypes: networkFunctions.reduce((acc, nf) => {
			acc[nf.type] = (acc[nf.type] || 0) + 1;
			return acc;
		}, {} as Record<string, number>),
		messageTypes,
		protocolUsage,
		runningTime:
			simulation.startTime && simulation.endTime
				? (simulation.endTime.getTime() - simulation.startTime.getTime()) / 1000
				: null,
	};
}
