import { NextRequest, NextResponse } from 'next/server';
import { getRoamingNetworkTopology } from '@/services/simulator/roaming-scenario-service';
import { Connection, NetworkFunction } from '@/types/network';
import dbConnect from '@/lib/mongodb';

export async function GET(req: NextRequest) {
	try {
		await dbConnect();

		const topology = await getRoamingNetworkTopology();

		// Validate the topology data before returning it
		if (!topology.networkFunctions || !Array.isArray(topology.networkFunctions)) {
			console.error('Invalid functions data in topology response');
			return NextResponse.json(
				{
					success: false,
					message: 'Failed to fetch valid network functions',
				},
				{ status: 500 }
			);
		}

		if (!topology.connections || !Array.isArray(topology.connections)) {
			console.error('Invalid connections data in topology response');
			return NextResponse.json(
				{
					success: false,
					message: 'Failed to fetch valid connections',
				},
				{ status: 500 }
			);
		}

		// Ensure all connections have valid source and target IDs
		const functionIds = new Set(topology.networkFunctions.map((func: NetworkFunction) => func.slug));

		// Log some debug info about function IDs
		console.log(`API: Total function IDs: ${functionIds.size}`);
		if (functionIds.size > 0) {
			console.log(`API: Sample function IDs: ${Array.from(functionIds).slice(0, 3).join(', ')}`);
		}

		// Check connections against function IDs
		const validConnections = topology.connections.filter((conn: Connection) => {
			const sourceValid = functionIds.has(conn.source);
			const targetValid = functionIds.has(conn.target);

			if (!sourceValid) {
				console.warn(`API: Connection ${conn.id} has invalid source: ${conn.source}`);
			}

			if (!targetValid) {
				console.warn(`API: Connection ${conn.id} has invalid target: ${conn.target}`);
			}

			return sourceValid && targetValid;
		});

		if (validConnections.length !== topology.connections.length) {
			console.warn(`Filtered out ${topology.connections.length - validConnections.length} invalid connections`);
		}

		// Log some debug information
		console.log(`API returning ${topology.networkFunctions.length} functions`);
		console.log(`API returning ${validConnections.length} valid connections`);
		if (topology.networkFunctions.length > 0) {
			console.log(`Sample function connections: ${topology.networkFunctions[0].connections.length}`);
		}

		console.log('validConnections', topology.connections, validConnections);

		const networkFunctionsData = topology.networkFunctions.map((nf) => ({
			...nf,
			id: nf.slug,
		}));

		return NextResponse.json(
			{
				success: true,
				data: {
					networkFunctions: networkFunctionsData,
					connections: validConnections,
				},
			},
			{ status: 200 }
		);
	} catch (error) {
		console.error('Error fetching network topology:', error);
		return NextResponse.json(
			{
				success: false,
				message: 'Failed to fetch network topology',
				error: (error as Error).message,
			},
			{ status: 500 }
		);
	}
}
