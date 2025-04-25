import NetworkFunctionModel, { NetworkFunctionDocument } from '@/models/NetworkFunction';
import ConnectionModel from '@/models/Connection';
import MessageModel from '@/models/Message'; // Fixed casing to match project conventions
import { PLMN, NetworkFunction, Connection, ProtocolType, NetworkFunctionType, NetworkRole } from '@/types/network';
import dbConnect from '@/lib/mongodb';
// Assume dbConnect is utility to connect to MongoDB
// import dbConnect from '@/lib/dbConnect';
import { slugify } from '@/utils/slugify';

// --- Define PLMNs ---
const HPLMN: PLMN = { id: '001-001', name: 'Home PLMN', role: 'home' };
const VPLMN: PLMN = { id: '070-999', name: 'Visited PLMN', role: 'visited' };

// --- Define Network Functions ---
type PartialNetworkFunction = Omit<NetworkFunction, 'id' | 'connections' | 'messages'>;

// Improved function positions for better visualization
// Using grid-like positioning for clearer structure
const functionsData: PartialNetworkFunction[] = [
	// VPLMN Functions - Left side of the diagram
	{
		name: 'UE',
		slug: 'ue',
		type: 'UE',
		plmn: VPLMN,
		status: 'active',
		position: { x: 100, y: 300 },
		ipAddress: '', // IP assigned later
	},
	{
		name: 'V-gNodeB',
		slug: 'v-gnodeb',
		type: 'gNodeB',
		plmn: VPLMN,
		status: 'active',
		position: { x: 250, y: 300 },
		ipAddress: 'gnb.packetrusher.org',
	},
	{
		name: 'V-AMF',
		slug: 'v-amf',
		type: 'AMF',
		plmn: VPLMN,
		status: 'active',
		position: { x: 250, y: 150 },
		ipAddress: 'amf.5gc.mnc070.mcc999.3gppnetwork.org:80',
	},
	{
		name: 'V-SMF',
		slug: 'v-smf',
		type: 'SMF',
		plmn: VPLMN,
		status: 'active',
		position: { x: 400, y: 150 },
		ipAddress: 'smf.5gc.mnc070.mcc999.3gppnetwork.org:80',
	},
	{
		name: 'V-UPF-LBO', // Local Breakout UPF
		slug: 'v-upf-lbo',
		type: 'UPF',
		plmn: VPLMN,
		status: 'active',
		position: { x: 250, y: 450 },
		ipAddress: 'upf.5gc.mnc070.mcc999.3gppnetwork.org:80',
	},
	{
		name: 'V-UPF-HR', // Home Routed UPF
		slug: 'v-upf-hr',
		type: 'UPF',
		plmn: VPLMN,
		status: 'active',
		position: { x: 400, y: 450 },
		ipAddress: 'upf.5gc.mnc070.mcc999.3gppnetwork.org:80',
	},
	{
		name: 'V-NRF',
		slug: 'v-nrf',
		type: 'NRF',
		plmn: VPLMN,
		status: 'active',
		position: { x: 400, y: 300 },
		ipAddress: 'nrf.5gc.mnc070.mcc999.3gppnetwork.org:80',
	},
	{
		name: 'V-SEPP',
		slug: 'v-sepp',
		type: 'SEPP',
		plmn: VPLMN,
		status: 'active',
		position: { x: 550, y: 300 },
		ipAddress: 'sepp.5gc.mnc070.mcc999.3gppnetwork.org:80',
	},

	// HPLMN Functions - Right side of the diagram
	{
		name: 'H-SEPP',
		slug: 'h-sepp',
		type: 'SEPP',
		plmn: HPLMN,
		status: 'active',
		position: { x: 700, y: 300 },
		ipAddress: 'sepp.5gc.mnc001.mcc001.3gppnetwork.org:80',
	},
	{
		name: 'H-AMF',
		slug: 'h-amf',
		type: 'AMF',
		plmn: HPLMN,
		status: 'active',
		position: { x: 850, y: 150 },
		ipAddress: 'amf.5gc.mnc001.mcc001.3gppnetwork.org:80',
	},
	{
		name: 'H-SMF',
		slug: 'h-smf',
		type: 'SMF',
		plmn: HPLMN,
		status: 'active',
		position: { x: 1000, y: 150 },
		ipAddress: 'smf.5gc.mnc001.mcc001.3gppnetwork.org:80',
	},
	{
		name: 'H-UPF',
		slug: 'h-upf',
		type: 'UPF',
		plmn: HPLMN,
		status: 'active',
		position: { x: 1000, y: 450 },
		ipAddress: 'upf.5gc.mnc001.mcc001.3gppnetwork.org:80',
	},
	{
		name: 'H-AUSF',
		slug: 'h-ausf',
		type: 'AUSF',
		plmn: HPLMN,
		status: 'active',
		position: { x: 850, y: 300 },
		ipAddress: 'ausf.5gc.mnc001.mcc001.3gppnetwork.org:80',
	},
	{
		name: 'H-UDM',
		slug: 'h-udm',
		type: 'UDM',
		plmn: HPLMN,
		status: 'active',
		position: { x: 1000, y: 300 },
		ipAddress: 'udm.5gc.mnc001.mcc001.3gppnetwork.org:80',
	},
	{
		name: 'H-NRF',
		slug: 'h-nrf',
		type: 'NRF',
		plmn: HPLMN,
		status: 'active',
		position: { x: 850, y: 450 },
		ipAddress: 'nrf.5gc.mnc001.mcc001.3gppnetwork.org:80',
	},
];

// --- Define Connections ---
// Structure: [sourceName, targetName, protocol]
type ConnectionTuple = [string, string, ProtocolType];

// Comprehensive connections for 5G roaming
const connectionsData: ConnectionTuple[] = [
	// VPLMN Access Network
	['UE', 'V-gNodeB', 'N1'], // N1 simplified (actually goes to AMF through gNB as tunnel)
	['V-gNodeB', 'V-AMF', 'N2'], // RAN to AMF control plane
	['V-gNodeB', 'V-UPF-LBO', 'N3'], // RAN to UPF user plane (Local Breakout)
	['V-gNodeB', 'V-UPF-HR', 'N3'], // RAN to UPF user plane (Home Routed)

	// SEPP to SEPP (Inter-PLMN Security)
	['V-SEPP', 'H-SEPP', 'N32'], // Secure connection between SEPPs

	// VPLMN Core Network - Control Plane
	['V-AMF', 'V-SMF', 'N11'], // Session management in visited network
	['V-AMF', 'V-NRF', 'N8'], // AMF discovers services through NRF
	['V-SMF', 'V-NRF', 'N10'], // SMF discovers services through NRF

	// VPLMN Core Network - User Plane
	['V-SMF', 'V-UPF-LBO', 'N4'], // SMF controls Local Breakout UPF
	['V-SMF', 'V-UPF-HR', 'N4'], // SMF controls Home Routed UPF

	// VPLMN Control Plane to SEPP
	['V-AMF', 'V-SEPP', 'N14'], // V-AMF to V-SEPP for inter-PLMN AMF comms
	['V-SMF', 'V-SEPP', 'N10'], // V-SMF to V-SEPP for session management

	// HPLMN SEPP to Core Network
	['H-SEPP', 'H-AMF', 'N14'], // H-SEPP to H-AMF for mobility management
	['H-SEPP', 'H-SMF', 'N10'], // H-SEPP to H-SMF for session management

	// HPLMN Core Network - Control Plane
	['H-AMF', 'H-SMF', 'N11'], // AMF to SMF for session management
	['H-AMF', 'H-AUSF', 'N12'], // AMF to AUSF for authentication
	['H-AMF', 'H-UDM', 'N8'], // AMF to UDM for subscription data
	['H-AUSF', 'H-UDM', 'N13'], // AUSF to UDM for auth data
	['H-SMF', 'H-UDM', 'N10'], // SMF to UDM for subscription data
	['H-SMF', 'H-NRF', 'N10'], // SMF discovers services through NRF
	['H-AMF', 'H-NRF', 'N8'], // AMF discovers services through NRF

	// HPLMN Core Network - User Plane
	['H-SMF', 'H-UPF', 'N4'], // SMF controls UPF

	// Inter-PLMN Data Path (User Plane)
	['V-UPF-HR', 'H-UPF', 'N9'], // Data path for Home Routed
];

/**
 * Debug utility to check consistency of IDs and connections
 */
async function debugNetworkTopology() {
	console.log('======= DEBUG NETWORK TOPOLOGY =======');

	// Get all network functions
	const functions = await NetworkFunctionModel.find({}).lean();
	console.log(`Found ${functions.length} network functions`);

	if (functions.length > 0) {
		// Log a sample function
		console.log('Sample function:');
		console.log(JSON.stringify(functions[0], null, 2));

		// Check ID formats
		const idFormats = functions.map((f) => ({
			name: f.name,
			id: f.id,
			_id: f._id ? f._id.toString() : 'undefined',
		}));
		console.log('ID formats:');
		console.log(JSON.stringify(idFormats.slice(0, 3), null, 2));
	}

	// Get all connections
	const connections = await ConnectionModel.find({}).lean();
	console.log(`Found ${connections.length} connections`);

	if (connections.length > 0) {
		// Log a sample connection
		console.log('Sample connection:');
		console.log(JSON.stringify(connections[0], null, 2));

		// Check connection source/target formats
		const connectionFormats = connections.map((c) => ({
			id: c.id,
			_id: c._id ? c._id.toString() : 'undefined',
			source: c.source
				? typeof c.source === 'object' && c.source !== null
					? String(c.source)
					: String(c.source)
				: 'undefined',
			source_type: typeof c.source,
			target: c.target
				? typeof c.target === 'object' && c.target !== null
					? String(c.target)
					: String(c.target)
				: 'undefined',
			target_type: typeof c.target,
		}));
		console.log('Connection formats:');
		console.log(JSON.stringify(connectionFormats.slice(0, 3), null, 2));
	}

	console.log('======= END DEBUG =======');
}

/**
 * Utility function to verify that connection source/target IDs match network function IDs
 */
async function verifyConnectionIds(): Promise<void> {
	console.log('==== VERIFYING CONNECTION IDs ====');

	// Get all network functions
	const functions = await NetworkFunctionModel.find({}).lean();
	const functionIds = new Set<string>();

	// Collect both id and _id values from functions
	functions.forEach((func) => {
		if (func.id) functionIds.add(func.id);
		if (func._id) functionIds.add(func._id.toString());
	});

	console.log(`Found ${functions.length} network functions with ${functionIds.size} unique IDs`);

	// Get all connections
	const connections = await ConnectionModel.find({}).lean();
	console.log(`Found ${connections.length} connections`);

	// Check connections against function IDs
	const invalidConnections = connections.filter((conn) => {
		const sourceValid = functionIds.has(conn.source);
		const targetValid = functionIds.has(conn.target);
		return !sourceValid || !targetValid;
	});

	if (invalidConnections.length > 0) {
		console.error(`Found ${invalidConnections.length} connections with invalid source/target IDs`);

		// Log the first few invalid connections
		invalidConnections.slice(0, 3).forEach((conn) => {
			const sourceValid = functionIds.has(conn.source);
			const targetValid = functionIds.has(conn.target);

			console.error(`Connection ${conn._id}:`);
			if (!sourceValid) console.error(`  - Invalid source: ${conn.source}`);
			if (!targetValid) console.error(`  - Invalid target: ${conn.target}`);
		});

		// Attempt to fix these connections
		console.log('Attempting to fix invalid connections...');

		// Create a map from function name to ID
		const functionNameToId = new Map<string, string>();
		functions.forEach((func) => {
			if (func.name && func.id) {
				functionNameToId.set(func.name, func.id);
			}
		});

		// Try to fix connections by matching function names
		let fixedCount = 0;
		for (const conn of invalidConnections) {
			// Skip if we can't determine the connection
			if (!conn._id) continue;

			// First try using stored sourceName and targetName if available
			let sourceId, targetId;
			// Use type assertion since these are custom properties
			const connAny = conn as any;
			if (connAny.sourceName && connAny.targetName) {
				sourceId = functionNameToId.get(connAny.sourceName);
				targetId = functionNameToId.get(connAny.targetName);

				if (sourceId && targetId) {
					await ConnectionModel.updateOne({ _id: conn._id }, { $set: { source: sourceId, target: targetId } });
					fixedCount++;
					console.log(`Fixed connection using stored names: ${connAny.sourceName} -> ${connAny.targetName}`);
					continue;
				}
			}

			// Fall back to trying to extract names from IDs
			const sourceName = conn.source.split('/').pop();
			const targetName = conn.target.split('/').pop();

			if (sourceName && targetName) {
				sourceId = functionNameToId.get(sourceName);
				targetId = functionNameToId.get(targetName);

				if (sourceId && targetId) {
					await ConnectionModel.updateOne({ _id: conn._id }, { $set: { source: sourceId, target: targetId } });
					fixedCount++;
					console.log(`Fixed connection using extracted names: ${sourceName} -> ${targetName}`);
				}
			}
		}

		console.log(`Fixed ${fixedCount} connections`);
	} else {
		console.log('All connections have valid source/target IDs');
	}

	// Create lookup map for function IDs to names
	const idToFunctionName = new Map<string, string>();
	functions.forEach((func) => {
		if (func.id && func.name) {
			idToFunctionName.set(func.id, func.name);
		}
		if (func._id) {
			idToFunctionName.set(func._id.toString(), func.name);
		}
	});

	// Check for connections missing sourceName/targetName and add them
	const connectionsWithoutNames = connections.filter((conn) => {
		const anyConn = conn as any;
		return !anyConn.sourceName || !anyConn.targetName;
	});

	if (connectionsWithoutNames.length > 0) {
		console.log(`Found ${connectionsWithoutNames.length} connections missing source/target names`);

		// Update these connections with names
		let namedCount = 0;
		for (const conn of connectionsWithoutNames) {
			if (!conn._id) continue;

			const sourceName = idToFunctionName.get(conn.source);
			const targetName = idToFunctionName.get(conn.target);

			if (sourceName && targetName) {
				await ConnectionModel.updateOne({ _id: conn._id }, { $set: { sourceName, targetName } });
				namedCount++;
			}
		}

		console.log(`Added names to ${namedCount} connections`);
	}

	console.log('==== CONNECTION VERIFICATION COMPLETE ====');
}

/**
 * Clears existing network data and sets up the initial 5G roaming scenario.
 */
export async function setupRoamingScenario(): Promise<void> {
	await dbConnect(); // Ensure DB connection

	// Delete existing data to start fresh
	console.log('Clearing existing network data...');
	await Promise.all([NetworkFunctionModel.deleteMany({}), ConnectionModel.deleteMany({}), MessageModel.deleteMany({})]);

	console.log('Creating network functions...');

	// Create functions and store their IDs for connection setup
	const createdFunctions = await NetworkFunctionModel.insertMany(functionsData as any);

	// Create a map of function names to their MongoDB IDs and slugs
	const functionMap = new Map<string, { id: string; slug: string; name: string }>();
	createdFunctions.forEach((func: any) => {
		if (func._id) {
			// Always use the id field rather than _id for connections
			const id = func.id || func._id.toString();
			const slug = func.slug || slugify(func.name, { lower: true, strict: true });
			functionMap.set(func.name, {
				id,
				slug,
				name: func.name,
			});
			console.log(`Network function created: ${func.name} with ID ${id} and slug ${slug}`);
		}
	});

	console.log('Creating connections...');
	const connectionDocs = connectionsData
		.map(([sourceName, targetName, protocol]) => {
			const sourceFunc = functionMap.get(sourceName);
			const targetFunc = functionMap.get(targetName);

			if (!sourceFunc || !targetFunc) {
				console.warn(`Skipping connection: Could not find IDs for ${sourceName} or ${targetName}`);
				return null;
			}

			// Use the slug property for connections
			const sourceSlug = sourceFunc.slug;
			const targetSlug = targetFunc.slug;

			console.log(`Creating connection: ${sourceName}(${sourceSlug}) -> ${targetName}(${targetSlug}) via ${protocol}`);

			// Store the name reference too for easier debugging
			return {
				source: sourceSlug,
				target: targetSlug,
				protocol: protocol,
				status: 'active', // Default to active
				sourceName: sourceName,
				targetName: targetName,
			};
		})
		.filter((conn): conn is Exclude<typeof conn, null> => conn !== null);

	// Finally insert all connections in one batch
	if (connectionDocs.length > 0) {
		await ConnectionModel.insertMany(connectionDocs as any);
		console.log(`Created ${connectionDocs.length} connections`);
	}

	// Now update each network function with its connections
	console.log('Updating network functions with their connections...');
	const connections = await ConnectionModel.find().lean();

	// Group connections by network function
	const functionConnections = new Map<string, string[]>();

	connections.forEach((conn: any) => {
		// Use source and target as the slugs
		const { source, target, id } = conn;

		if (!functionConnections.has(source)) {
			functionConnections.set(source, []);
		}
		functionConnections.get(source)?.push(id);

		if (!functionConnections.has(target)) {
			functionConnections.set(target, []);
		}
		functionConnections.get(target)?.push(id);
	});

	// Update each function with its connections
	const updatePromises = Array.from(functionConnections.entries()).map(([slug, connectionIds]) => {
		return NetworkFunctionModel.findOneAndUpdate({ slug }, { $set: { connections: connectionIds } });
	});

	await Promise.all(updatePromises);
	console.log('Roaming scenario setup complete');
}

/**
 * Fetches the current network topology (functions and connections).
 */
export async function getRoamingNetworkTopology(): Promise<{
	networkFunctions: NetworkFunction[];
	connections: Connection[];
}> {
	try {
		// Fetch network functions and connections from the database
		const networkFunctions = await NetworkFunctionModel.find({}).lean();

		// Fetch connections with select to control what fields are returned
		const connections = await ConnectionModel.find({})
			.select('id source target protocol status sourceName targetName')
			.lean();

		console.log(`Retrieved ${networkFunctions.length} network functions from the database`);
		console.log(`Retrieved ${connections.length} connections from the database`);

		// If sourceName or targetName is missing, try to add them
		if (connections.length > 0) {
			// Create a map of function IDs to names for quick lookup
			const functionIdToNameMap = new Map<string, string>();
			networkFunctions.forEach((nf) => {
				functionIdToNameMap.set(nf.id, nf.name);
			});

			// Update connections with missing names
			for (let i = 0; i < connections.length; i++) {
				const conn = connections[i];

				// If sourceName is missing but we have source ID
				if (!conn.sourceName && conn.source) {
					conn.sourceName = functionIdToNameMap.get(conn.source) || 'Unknown';
				}

				// If targetName is missing but we have target ID
				if (!conn.targetName && conn.target) {
					conn.targetName = functionIdToNameMap.get(conn.target) || 'Unknown';
				}
			}

			console.log('Updated connection names where needed');
		}

		return {
			networkFunctions: networkFunctions as unknown as NetworkFunction[],
			connections: connections as unknown as Connection[],
		};
	} catch (error) {
		console.error('Error fetching network topology:', error);
		throw error;
	}
}

export async function getRoamingDemoData() {
	// For server-side data retrieval
	if (typeof window === 'undefined') {
		try {
			// Connect to the database
			await dbConnect();

			// Get data from MongoDB
			const functions = await NetworkFunctionModel.find().lean();
			const connections = await ConnectionModel.find().lean();

			// Convert MongoDB documents to expected types
			const transformedFunctions = functions.map((func: any) => ({
				id: func.id,
				slug: func.slug,
				name: func.name,
				type: func.type,
				plmn: func.plmn,
				status: func.status || 'inactive',
				connections: [], // Will be populated from the connections
				position: func.position,
				messages: [],
				ipAddress: func.ipAddress,
				description: func.description,
			}));

			// Convert Connections
			const transformedConnections = connections.map((conn: any) => ({
				id: conn.id,
				source: conn.source,
				target: conn.target,
				protocol: conn.protocol,
				status: conn.status || 'inactive',
				sourceName: conn.sourceName,
				targetName: conn.targetName,
				label: conn.label,
			}));

			return {
				functions: transformedFunctions,
				connections: transformedConnections,
			};
		} catch (error) {
			console.error('Error retrieving roaming data from database:', error);
			throw error;
		}
	} else {
		// For client-side, return a simulated set from our data arrays
		// ⚠️ Note: In production, you would call an API endpoint to get this data
		return {
			functions: functionsData.map((f) => ({
				...f,
				id: f.name.toLowerCase().replace(/\s+/g, '-'),
				connections: [],
				messages: [],
			})) as any,
			connections: connectionsData.map(([source, target, protocol]) => ({
				id: `${source}-${target}`,
				source: slugify(source, { lower: true, strict: true }),
				target: slugify(target, { lower: true, strict: true }),
				protocol,
				status: 'active',
				sourceName: source,
				targetName: target,
			})),
		};
	}
}
