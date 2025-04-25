'use client';

import { useState, useEffect, useCallback } from 'react';
import { NetworkVisualizer } from '@/components/network/NetworkVisualizer';
import { NetworkFunction, Connection, Message } from '@/types/network';
import { Button, Card, CardHeader, CardBody, CardFooter, Badge } from '@heroui/react';
import { type Edge, ReactFlowProvider, type Node } from '@xyflow/react';

// Mock data generator for testing when API fails
const generateMockNetworkData = () => {
	// Create mock MongoDB-style IDs
	const generateMockId = () => {
		return Math.random().toString(16).substring(2, 15) + Math.random().toString(16).substring(2, 15);
	};

	// Create IDs for the network functions
	const ueId = generateMockId();
	const gnbId = generateMockId();
	const amfId = generateMockId();
	const smfId = generateMockId();

	// Define some network functions
	const networkFunctions: NetworkFunction[] = [
		{
			id: ueId,
			slug: 'ue',
			name: 'UE',
			type: 'UE',
			plmn: { id: '208-093', name: 'Visited PLMN', role: 'visited' },
			status: 'active',
			connections: [],
			position: { x: 100, y: 250 },
		},
		{
			id: gnbId,
			slug: 'gnb',
			name: 'gNodeB',
			type: 'gNodeB',
			plmn: { id: '208-093', name: 'Visited PLMN', role: 'visited' },
			status: 'active',
			connections: [],
			position: { x: 250, y: 250 },
		},
		{
			id: amfId,
			slug: 'amf',
			name: 'AMF',
			type: 'AMF',
			plmn: { id: '208-093', name: 'Visited PLMN', role: 'visited' },
			status: 'active',
			connections: [],
			position: { x: 400, y: 100 },
		},
		{
			id: smfId,
			slug: 'smf',
			name: 'SMF',
			type: 'SMF',
			plmn: { id: '208-093', name: 'Visited PLMN', role: 'visited' },
			status: 'active',
			connections: [],
			position: { x: 400, y: 400 },
		},
	];

	// Define connections between functions
	const connections: Connection[] = [
		{
			id: generateMockId(),
			source: ueId,
			target: gnbId,
			protocol: 'N1',
			status: 'active',
		},
		{
			id: generateMockId(),
			source: gnbId,
			target: amfId,
			protocol: 'N2',
			status: 'active',
		},
		{
			id: generateMockId(),
			source: amfId,
			target: smfId,
			protocol: 'N11',
			status: 'active',
		},
	];

	// Add connections to the network functions
	connections.forEach((conn) => {
		// Find source network function and add connection
		const sourceNF = networkFunctions.find((nf) => nf.id === conn.source);
		if (sourceNF) {
			sourceNF.connections.push(conn);
		}

		// Find target network function and add connection
		const targetNF = networkFunctions.find((nf) => nf.id === conn.target);
		if (targetNF) {
			targetNF.connections.push(conn);
		}
	});

	return { functions: networkFunctions, connections };
};

export default function SimulatorPage() {
	const [networkFunctions, setNetworkFunctions] = useState<NetworkFunction[]>([]);
	const [connections, setConnections] = useState<Connection[]>([]);
	const [messages, setMessages] = useState<Message[]>([]);
	const [selectedId, setSelectedId] = useState<string | undefined>(undefined);
	const [isLoading, setIsLoading] = useState(false);
	const [useMockData, setUseMockData] = useState(false);
	const [statusMessage, setStatusMessage] = useState<{ text: string; type: 'info' | 'success' | 'error' | null }>({
		text: '',
		type: null,
	});

	// Try to load the network topology on initial render
	useEffect(() => {
		async function loadTopology() {
			setIsLoading(true);
			try {
				console.log('Fetching topology from API...');
				const response = await fetch('/api/simulator/topology');
				console.log('API response status:', response.status);

				if (response.ok) {
					const topologyData = await response.json();
					console.log('API response data:', topologyData);

					if (topologyData.success && topologyData.data) {
						// Check if data is properly structured
						if (
							topologyData.data.networkFunctions &&
							Array.isArray(topologyData.data.networkFunctions) &&
							topologyData.data.networkFunctions.length > 0
						) {
							console.log('Setting network functions:', topologyData.data.networkFunctions.length);
							// Check if network functions have connections
							const functionWithConnections = topologyData.data.networkFunctions.filter(
								(func: NetworkFunction) => func.connections && func.connections.length > 0
							);
							console.log(
								`Functions with connections: ${functionWithConnections.length}/${topologyData.data.networkFunctions.length}`
							);

							if (functionWithConnections.length > 0) {
								console.log(
									'Sample function connections:',
									JSON.stringify(functionWithConnections[0].connections.slice(0, 2))
								);
							}

							setNetworkFunctions(topologyData.data.networkFunctions);

							if (topologyData.data.connections && Array.isArray(topologyData.data.connections)) {
								console.log('Setting connections:', topologyData.data.connections.length);
								if (topologyData.data.connections.length > 0) {
									console.log('Sample connection data:', JSON.stringify(topologyData.data.connections[0]));
								}
								setConnections(topologyData.data.connections);
							} else {
								console.error('Invalid or empty connections array in API response');
								setConnections([]);
							}
						} else {
							console.warn('No network functions from API, using mock data');
							const mockData = generateMockNetworkData();
							setNetworkFunctions(mockData.functions);
							setConnections(mockData.connections);
							setUseMockData(true);
						}
					} else {
						console.error('API response not successful or missing data, using mock data');
						const mockData = generateMockNetworkData();
						setNetworkFunctions(mockData.functions);
						setConnections(mockData.connections);
						setUseMockData(true);
					}
				} else {
					console.error('Failed to fetch topology, using mock data');
					const mockData = generateMockNetworkData();
					setNetworkFunctions(mockData.functions);
					setConnections(mockData.connections);
					setUseMockData(true);
				}
			} catch (error) {
				console.error('Error loading topology data:', error);
				console.log('Using mock data instead');
				const mockData = generateMockNetworkData();
				setNetworkFunctions(mockData.functions);
				setConnections(mockData.connections);
				setUseMockData(true);
			} finally {
				setIsLoading(false);
			}
		}

		loadTopology();
	}, []);

	console.log('topology data', networkFunctions, connections);

	// Setup 5G Roaming Scenario
	const setupRoamingScenario = async () => {
		setIsLoading(true);
		// Clear status after 5 seconds
		const clearStatus = () =>
			setTimeout(() => {
				setStatusMessage({ text: '', type: null });
			}, 5000);

		try {
			// Clear any previous state
			setSelectedId(undefined);
			setMessages([]);

			// Show status message
			setStatusMessage({
				text: 'Initializing network functions and connections...',
				type: 'info',
			});

			const response = await fetch('/api/simulator/setup-roaming', {
				method: 'POST',
			});

			if (!response.ok) {
				throw new Error(`Failed to set up roaming scenario: ${response.statusText}`);
			}

			// Fetch the updated network topology
			const topologyResponse = await fetch('/api/simulator/topology');

			if (!topologyResponse.ok) {
				throw new Error(`Failed to fetch network topology: ${topologyResponse.statusText}`);
			}

			const topologyData = await topologyResponse.json();
			console.log('Topology data received:', topologyData);

			if (topologyData.success && topologyData.data) {
				// Perform basic validation before setting state
				if (!topologyData.data.networkFunctions || !Array.isArray(topologyData.data.networkFunctions)) {
					throw new Error('Invalid or missing network functions in response');
				}

				if (!topologyData.data.connections || !Array.isArray(topologyData.data.connections)) {
					console.warn('No connections in topology response');
				}

				// Log connection details for debugging
				console.log(`Setting ${topologyData.data.networkFunctions.length} network functions`);
				console.log(`Setting ${topologyData.data.connections?.length || 0} connections`);

				if (topologyData.data.connections && topologyData.data.connections.length > 0) {
					console.log('Sample connection:', topologyData.data.connections[0]);
				}

				// Check if network functions have connections
				const functionsWithConnections = topologyData.data.networkFunctions.filter(
					(func: NetworkFunction) => func.connections && func.connections.length > 0
				);

				console.log(
					`Functions with connections: ${functionsWithConnections.length}/${topologyData.data.networkFunctions.length}`
				);

				if (functionsWithConnections.length > 0) {
					const sampleFunc = functionsWithConnections[0];
					console.log(`Sample function ${sampleFunc.name} has ${sampleFunc.connections.length} connections`);
					if (sampleFunc.connections.length > 0) {
						console.log('Sample function connections:', JSON.stringify(sampleFunc.connections.slice(0, 2)));
					}
				}

				setNetworkFunctions(topologyData.data.networkFunctions);
				setConnections(topologyData.data.connections);

				// Success message
				setStatusMessage({
					text: `Created ${topologyData.data.networkFunctions.length} network functions and ${
						topologyData.data.connections?.length || 0
					} connections`,
					type: 'success',
				});

				clearStatus();
			} else {
				throw new Error('Invalid response format from topology API');
			}
		} catch (error) {
			console.error('Error setting up roaming scenario:', error);

			// Error message
			setStatusMessage({
				text: error instanceof Error ? error.message : 'Unknown error occurred',
				type: 'error',
			});

			clearStatus();
		} finally {
			setIsLoading(false);
		}
	};

	// Handle network function selection
	const handleNetworkFunctionClick = (nf: NetworkFunction) => {
		setSelectedId(nf.id);
		console.log('Selected network function:', nf);
	};

	// Handle connection selection
	const handleConnectionClick = (conn: Connection) => {
		setSelectedId(conn.id);
		console.log('Selected connection:', conn);
	};

	// Process connections and networkFunctions for visualization
	// This function transforms the raw data into a format suitable for ReactFlow
	const processNetworkData = useCallback(() => {
		// Process network functions for visualization
		const processedNodes: Node[] = networkFunctions.map((nf) => {
			// Create a properly formatted node for ReactFlow
			return {
				id: nf.id,
				position: nf.position || { x: 0, y: 0 },
				type: 'networkFunction', // Use our custom node component
				data: {
					...nf,
					// These properties will be extracted in the NetworkFunctionNode component
				},
				// Additional ReactFlow node properties can be added here
			};
		});

		// Process connections for visualization
		const processedEdges: Edge[] = connections.map((conn) => {
			// Try to find which network functions this connection links
			const sourceNF = networkFunctions.find((nf) => nf.id === conn.source);
			const targetNF = networkFunctions.find((nf) => nf.id === conn.target);

			// Determine a meaningful connection label - store as string to avoid type conflicts
			const displayLabel: string = (() => {
				if (sourceNF && targetNF) {
					const sourceName = sourceNF.name || sourceNF.type;
					const targetName = targetNF.name || targetNF.type;
					return `${sourceName} → ${targetName}`;
				}
				return conn.protocol || 'Connection';
			})();

			// Determine appropriate source and target handles based on network function types
			// This helps position the edges correctly between nodes
			let sourceHandle = undefined;
			let targetHandle = undefined;

			if (sourceNF && targetNF) {
				// Determine relative positions to decide which handles to use
				// This is a simplified approach - you might need to adjust based on your layout
				if (sourceNF.position && targetNF.position) {
					const sourcePos = sourceNF.position;
					const targetPos = targetNF.position;

					// Horizontal positioning
					if (Math.abs(sourcePos.x - targetPos.x) > Math.abs(sourcePos.y - targetPos.y)) {
						// Nodes are more horizontally aligned than vertically
						if (sourcePos.x < targetPos.x) {
							// Source is to the left of target
							sourceHandle = `${conn.source}`;
							targetHandle = `${conn.target}`;
						} else {
							// Source is to the right of target
							sourceHandle = `${conn.source}`;
							targetHandle = `${conn.target}`;
						}
					} else {
						// Nodes are more vertically aligned than horizontally
						if (sourcePos.y < targetPos.y) {
							// Source is above target
							sourceHandle = `${conn.source}`;
							targetHandle = `${conn.target}`;
						} else {
							// Source is below target
							sourceHandle = `${conn.source}`;
							targetHandle = `${conn.target}`;
						}
					}
				}
			}

			// Create a properly formatted edge for ReactFlow
			return {
				id: conn.id,
				protocol: conn.protocol,
				status: conn.status,
				source: conn.source,
				target: conn.target,
				type: 'floating',
				displayLabel, // Use displayLabel property instead of label
				// Use calculated handles or fall back to any that might be in the data
				sourceHandle: sourceHandle || undefined,
				targetHandle: targetHandle || undefined,
				sourceName: sourceNF?.name,
				targetName: targetNF?.name,
			};
		});

		return { processedNodes, processedEdges };
	}, [networkFunctions, connections]);

	// Use the processed data for rendering
	const { processedNodes, processedEdges } = processNetworkData();

	// Helper function to provide protocol descriptions
	const getProtocolDescription = (protocol?: string) => {
		switch (protocol) {
			case 'N1':
				return 'UE to AMF interface for NAS signaling';
			case 'N2':
				return 'gNodeB to AMF interface for control plane messages';
			case 'N3':
				return 'gNodeB to UPF interface for user plane data';
			case 'N4':
				return 'SMF to UPF interface for user plane session management';
			case 'N6':
				return 'UPF to Data Network interface';
			case 'N8':
				return 'AMF to UDM interface for authentication and subscription data';
			case 'N9':
				return 'UPF to UPF interface in home-routed roaming scenarios';
			case 'N10':
				return 'SMF to SMF interface for session management in roaming';
			case 'N11':
				return 'AMF to SMF interface for session management requests';
			case 'N12':
				return 'AMF to AUSF interface for authentication';
			case 'N13':
				return 'UDM to AUSF interface for authentication data';
			case 'N14':
				return 'AMF to AMF interface in roaming scenarios';
			case 'N15':
				return 'AMF to PCF interface for policy control';
			case 'N32':
				return 'SEPP to SEPP interface for secure inter-PLMN communication';
			default:
				return 'Network interface between 5G core network functions';
		}
	};

	return (
		<div className='flex flex-col h-screen p-4 bg-gray-50 dark:bg-gray-900'>
			<div className='flex justify-between items-center mb-4'>
				<h1 className='text-2xl font-bold'>5G Network Simulator - Roaming</h1>
				<div className='flex space-x-2 items-center'>
					{statusMessage.type && (
						<div
							className={`px-3 py-1.5 text-sm rounded-md ${
								statusMessage.type === 'success'
									? 'bg-green-100 text-green-800'
									: statusMessage.type === 'error'
									? 'bg-red-100 text-red-800'
									: 'bg-blue-100 text-blue-800'
							}`}>
							{statusMessage.text}
						</div>
					)}
					<Button
						color='primary'
						onPress={setupRoamingScenario}
						disabled={isLoading}>
						{isLoading ? 'Setting up...' : 'Setup Roaming Scenario'}
					</Button>
					{useMockData && (
						<div className='px-3 py-1 text-xs bg-yellow-100 text-yellow-800 rounded-md flex items-center'>
							Using Mock Data (DB not connected)
						</div>
					)}
				</div>
			</div>

			<div className='flex-1 overflow-hidden rounded-lg border border-gray-200 dark:border-gray-700 w-full'>
				<ReactFlowProvider>
					<NetworkVisualizer
						networkFunctions={processedNodes}
						connections={processedEdges}
						messages={messages}
						onNetworkFunctionClick={handleNetworkFunctionClick}
						onConnectionClick={handleConnectionClick}
						selectedId={selectedId}
					/>
				</ReactFlowProvider>
			</div>
		</div>
	);
}
