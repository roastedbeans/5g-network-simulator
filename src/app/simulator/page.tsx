'use client';

import { useState, useEffect } from 'react';
import NetworkVisualizer from '@/components/network/NetworkVisualizer';
import { AuthenticationFlowDiagram, PDUSessionEstablishmentDiagram } from '@/components/protocol/ProtocolDiagram';
import { NetworkFunction, Connection, Message } from '@/types/network';
import { v4 as uuidv4 } from 'uuid';
import * as networkFunctionApi from '@/services/api/networkFunctionApi';
import {
	Button,
	Card,
	CardBody,
	CardHeader,
	Divider,
	Dropdown,
	DropdownItem,
	DropdownMenu,
	DropdownTrigger,
} from '@heroui/react';

// Mock data for demonstration
const initialNetworkFunctions: NetworkFunction[] = [
	{
		id: uuidv4(),
		name: 'User Equipment',
		type: 'UE',
		status: 'active',
		connections: [],
		position: { x: 100, y: 300 },
		messages: [],
	},
	{
		id: uuidv4(),
		name: 'gNodeB',
		type: 'RAN',
		status: 'active',
		connections: [],
		position: { x: 250, y: 300 },
		messages: [],
	},
	{
		id: uuidv4(),
		name: 'AMF-1',
		type: 'AMF',
		status: 'active',
		connections: [],
		position: { x: 400, y: 200 },
		messages: [],
	},
	{
		id: uuidv4(),
		name: 'SMF-1',
		type: 'SMF',
		status: 'active',
		connections: [],
		position: { x: 550, y: 200 },
		messages: [],
	},
	{
		id: uuidv4(),
		name: 'UPF-1',
		type: 'UPF',
		status: 'active',
		connections: [],
		position: { x: 550, y: 350 },
		messages: [],
	},
	{
		id: uuidv4(),
		name: 'AUSF-1',
		type: 'AUSF',
		status: 'active',
		connections: [],
		position: { x: 400, y: 100 },
		messages: [],
	},
	{
		id: uuidv4(),
		name: 'UDM-1',
		type: 'UDM',
		status: 'active',
		connections: [],
		position: { x: 550, y: 100 },
		messages: [],
	},
];

// Create initial connections
function setupInitialConnections(networkFunctions: NetworkFunction[]): Connection[] {
	// Find network functions by type
	const ue = networkFunctions.find((nf) => nf.type === 'UE');
	const ran = networkFunctions.find((nf) => nf.type === 'RAN');
	const amf = networkFunctions.find((nf) => nf.type === 'AMF');
	const smf = networkFunctions.find((nf) => nf.type === 'SMF');
	const upf = networkFunctions.find((nf) => nf.type === 'UPF');
	const ausf = networkFunctions.find((nf) => nf.type === 'AUSF');
	const udm = networkFunctions.find((nf) => nf.type === 'UDM');

	if (!ue || !ran || !amf || !smf || !upf || !ausf || !udm) return [];

	const connections: Connection[] = [
		{
			id: uuidv4(),
			source: ue.id,
			target: ran.id,
			protocol: 'N1',
			status: 'active',
		},
		{
			id: uuidv4(),
			source: ran.id,
			target: amf.id,
			protocol: 'N2',
			status: 'active',
		},
		{
			id: uuidv4(),
			source: ran.id,
			target: upf.id,
			protocol: 'N3',
			status: 'active',
		},
		{
			id: uuidv4(),
			source: amf.id,
			target: smf.id,
			protocol: 'N11',
			status: 'active',
		},
		{
			id: uuidv4(),
			source: smf.id,
			target: upf.id,
			protocol: 'N4',
			status: 'active',
		},
		{
			id: uuidv4(),
			source: amf.id,
			target: ausf.id,
			protocol: 'N8',
			status: 'active',
		},
		{
			id: uuidv4(),
			source: ausf.id,
			target: udm.id,
			protocol: 'N8',
			status: 'active',
		},
	];

	// Update the connections array for each network function
	networkFunctions.forEach((nf) => {
		nf.connections = connections
			.filter((conn) => conn.source === nf.id || conn.target === nf.id)
			.map((conn) => conn.id);
	});

	return connections;
}

export default function SimulatorPage() {
	const [networkFunctions, setNetworkFunctions] = useState<NetworkFunction[]>([]);
	const [connections, setConnections] = useState<Connection[]>([]);
	const [messages, setMessages] = useState<Message[]>([]);
	const [selectedTab, setSelectedTab] = useState<'network' | 'auth' | 'session'>('network');
	const [selectedId, setSelectedId] = useState<string | undefined>(undefined);
	const [simulationRunning, setSimulationRunning] = useState(false);

	// Initialize with mock data
	useEffect(() => {
		// First try to load from API
		const loadNetworkFunctions = async () => {
			try {
				const apiNetworkFunctions = await networkFunctionApi.getAllNetworkFunctions();

				// If we got network functions from the API, use those
				if (apiNetworkFunctions && apiNetworkFunctions.length > 0) {
					setNetworkFunctions(apiNetworkFunctions);
					// You would need to load connections separately here too
					return;
				}
			} catch (error) {
				console.warn('Could not load from API, using mock data instead:', error);
			}

			// Fall back to mock data if API fails or returns empty
			const initialNFs = [...initialNetworkFunctions];
			setNetworkFunctions(initialNFs);
			const initialConns = setupInitialConnections(initialNFs);
			setConnections(initialConns);
		};

		loadNetworkFunctions();
	}, []);

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

	// Simulate a message exchange (e.g., authentication)
	const simulateAuthentication = () => {
		if (simulationRunning) return;
		setSimulationRunning(true);

		const ue = networkFunctions.find((nf) => nf.type === 'UE');
		const amf = networkFunctions.find((nf) => nf.type === 'AMF');
		const ausf = networkFunctions.find((nf) => nf.type === 'AUSF');
		const udm = networkFunctions.find((nf) => nf.type === 'UDM');

		if (!ue || !amf || !ausf || !udm) {
			console.error('Required network functions not found');
			setSimulationRunning(false);
			return;
		}

		// Clear previous messages
		setMessages([]);

		// Step 1: UE -> AMF Authentication Request
		setTimeout(() => {
			const msg1: Message = {
				id: uuidv4(),
				type: 'REQUEST',
				source: ue.id,
				destination: amf.id,
				protocol: 'N1',
				payload: { type: 'Authentication Request', supi: 'imsi-123456789012345' },
				timestamp: new Date(),
			};
			setMessages((prev) => [...prev, msg1]);

			// Step 2: AMF -> AUSF
			setTimeout(() => {
				const msg2: Message = {
					id: uuidv4(),
					type: 'REQUEST',
					source: amf.id,
					destination: ausf.id,
					protocol: 'N8',
					payload: { type: 'Authentication Request', supi: 'imsi-123456789012345' },
					timestamp: new Date(),
				};
				setMessages((prev) => [...prev, msg2]);

				// Step 3: AUSF -> UDM
				setTimeout(() => {
					const msg3: Message = {
						id: uuidv4(),
						type: 'REQUEST',
						source: ausf.id,
						destination: udm.id,
						protocol: 'N8',
						payload: { type: 'Authentication Info Request', supi: 'imsi-123456789012345' },
						timestamp: new Date(),
					};
					setMessages((prev) => [...prev, msg3]);

					// Step 4: UDM -> AUSF
					setTimeout(() => {
						const msg4: Message = {
							id: uuidv4(),
							type: 'RESPONSE',
							source: udm.id,
							destination: ausf.id,
							protocol: 'N8',
							payload: { type: 'Authentication Info Response', vectors: { rand: '123', autn: '456' } },
							timestamp: new Date(),
						};
						setMessages((prev) => [...prev, msg4]);

						// Step 5: AUSF -> AMF
						setTimeout(() => {
							const msg5: Message = {
								id: uuidv4(),
								type: 'RESPONSE',
								source: ausf.id,
								destination: amf.id,
								protocol: 'N8',
								payload: { type: 'Authentication Response', vectors: { rand: '123', autn: '456' } },
								timestamp: new Date(),
							};
							setMessages((prev) => [...prev, msg5]);

							// Step 6: AMF -> UE
							setTimeout(() => {
								const msg6: Message = {
									id: uuidv4(),
									type: 'REQUEST',
									source: amf.id,
									destination: ue.id,
									protocol: 'N1',
									payload: { type: 'Authentication Challenge', rand: '123', autn: '456' },
									timestamp: new Date(),
								};
								setMessages((prev) => [...prev, msg6]);

								// Step 7: UE -> AMF
								setTimeout(() => {
									const msg7: Message = {
										id: uuidv4(),
										type: 'RESPONSE',
										source: ue.id,
										destination: amf.id,
										protocol: 'N1',
										payload: { type: 'Authentication Response', res: '789' },
										timestamp: new Date(),
									};
									setMessages((prev) => [...prev, msg7]);

									// Step 8: AMF -> AUSF
									setTimeout(() => {
										const msg8: Message = {
											id: uuidv4(),
											type: 'REQUEST',
											source: amf.id,
											destination: ausf.id,
											protocol: 'N8',
											payload: { type: 'Confirmation Request', res: '789' },
											timestamp: new Date(),
										};
										setMessages((prev) => [...prev, msg8]);

										// Step 9: AUSF -> AMF
										setTimeout(() => {
											const msg9: Message = {
												id: uuidv4(),
												type: 'RESPONSE',
												source: ausf.id,
												destination: amf.id,
												protocol: 'N8',
												payload: { type: 'Confirmation Response', result: 'SUCCESS' },
												timestamp: new Date(),
											};
											setMessages((prev) => [...prev, msg9]);

											// Step 10: AMF -> UE
											setTimeout(() => {
												const msg10: Message = {
													id: uuidv4(),
													type: 'RESPONSE',
													source: amf.id,
													destination: ue.id,
													protocol: 'N1',
													payload: { type: 'Authentication Success' },
													timestamp: new Date(),
												};
												setMessages((prev) => [...prev, msg10]);
												setSimulationRunning(false);
											}, 1000);
										}, 1000);
									}, 1000);
								}, 1000);
							}, 1000);
						}, 1000);
					}, 1000);
				}, 1000);
			}, 1000);
		}, 500);
	};

	// Simulate PDU session establishment
	const simulatePDUSessionEstablishment = () => {
		if (simulationRunning) return;
		setSimulationRunning(true);

		const ue = networkFunctions.find((nf) => nf.type === 'UE');
		const amf = networkFunctions.find((nf) => nf.type === 'AMF');
		const smf = networkFunctions.find((nf) => nf.type === 'SMF');
		const upf = networkFunctions.find((nf) => nf.type === 'UPF');

		if (!ue || !amf || !smf || !upf) {
			console.error('Required network functions not found');
			setSimulationRunning(false);
			return;
		}

		// Clear previous messages
		setMessages([]);

		// Step 1: UE -> AMF PDU Session Establishment Request
		setTimeout(() => {
			const msg1: Message = {
				id: uuidv4(),
				type: 'REQUEST',
				source: ue.id,
				destination: amf.id,
				protocol: 'N1',
				payload: { type: 'PDU Session Establishment Request', pduSessionId: 1, dnn: 'internet' },
				timestamp: new Date(),
			};
			setMessages((prev) => [...prev, msg1]);

			// Step 2: AMF -> SMF Create SM Context Request
			setTimeout(() => {
				const msg2: Message = {
					id: uuidv4(),
					type: 'REQUEST',
					source: amf.id,
					destination: smf.id,
					protocol: 'N11',
					payload: { type: 'Create SM Context Request', pduSessionId: 1, dnn: 'internet' },
					timestamp: new Date(),
				};
				setMessages((prev) => [...prev, msg2]);

				// Step 3: SMF -> UPF N4 Session Establishment
				setTimeout(() => {
					const msg3: Message = {
						id: uuidv4(),
						type: 'REQUEST',
						source: smf.id,
						destination: upf.id,
						protocol: 'N4',
						payload: { type: 'N4 Session Establishment', seid: 100, farId: 1 },
						timestamp: new Date(),
					};
					setMessages((prev) => [...prev, msg3]);

					// Step 4: UPF -> SMF N4 Session Establishment Response
					setTimeout(() => {
						const msg4: Message = {
							id: uuidv4(),
							type: 'RESPONSE',
							source: upf.id,
							destination: smf.id,
							protocol: 'N4',
							payload: { type: 'N4 Session Establishment Response', seid: 200 },
							timestamp: new Date(),
						};
						setMessages((prev) => [...prev, msg4]);

						// Step 5: SMF -> AMF Create SM Context Response
						setTimeout(() => {
							const msg5: Message = {
								id: uuidv4(),
								type: 'RESPONSE',
								source: smf.id,
								destination: amf.id,
								protocol: 'N11',
								payload: { type: 'Create SM Context Response', pduSessionId: 1 },
								timestamp: new Date(),
							};
							setMessages((prev) => [...prev, msg5]);

							// Step 6: AMF -> UE PDU Session Establishment Accept
							setTimeout(() => {
								const msg6: Message = {
									id: uuidv4(),
									type: 'RESPONSE',
									source: amf.id,
									destination: ue.id,
									protocol: 'N1',
									payload: { type: 'PDU Session Establishment Accept', pduSessionId: 1, qosFlowId: 1 },
									timestamp: new Date(),
								};
								setMessages((prev) => [...prev, msg6]);
								setSimulationRunning(false);
							}, 1000);
						}, 1000);
					}, 1000);
				}, 1000);
			}, 1000);
		}, 500);
	};

	return (
		<div className='w-full max-h-screen h-full flex flex-col'>
			<div className='flex-1 flex overflow-y-auto max-h-screen'>
				{/* Left panel for controls */}
				<div className='max-w-sm w-full p-8 flex flex-col gap-4'>
					<h1 className='text-2xl font-bold text-center'>5G Network Simulator</h1>
					<Divider />
					<div className='flex flex-col gap-4'>
						<h2 className='font-semibold'>Simulation Control</h2>
						<div className='flex items-center gap-2'>
							<h4 className='font-semibold'>Status</h4>
							<div className='flex items-center'>
								<div
									className={` w-3 h-3 rounded-full mr-2 ${simulationRunning ? 'bg-green-500' : 'bg-gray-400'}`}></div>
								<span>{simulationRunning ? 'Simulation Running' : 'Ready'}</span>
							</div>
						</div>
					</div>
					<Button
						variant='solid'
						onPress={() => setSelectedTab('network')}>
						Network View
					</Button>

					<Button
						variant='solid'
						color='primary'
						onPress={() => {
							setSelectedTab('auth');
							simulateAuthentication();
						}}
						disabled={simulationRunning}>
						Authentication Flow
					</Button>

					<Button
						variant='solid'
						color='primary'
						onPress={() => {
							setSelectedTab('session');
							simulatePDUSessionEstablishment();
						}}
						disabled={simulationRunning}>
						PDU Session Establishment
					</Button>
					<Card
						fullWidth
						className='p-2'>
						<CardHeader>
							<h2 className='font-semibold'>Message Log</h2>
						</CardHeader>
						<CardBody>
							<div className='overflow-y-auto text-xs'>
								{messages.map((message) => (
									<div
										key={message.id}
										className='mb-1'>
										<span className='text-gray-500'>{new Date(message.timestamp).toLocaleTimeString()}</span>{' '}
										<span className='font-semibold'>{message.protocol}</span>{' '}
										<span
											className={`px-1 rounded ${
												message.type === 'REQUEST'
													? 'bg-blue-100'
													: message.type === 'RESPONSE'
													? 'bg-green-100'
													: 'bg-red-100'
											}`}>
											{message.type}
										</span>{' '}
										<span>
											{networkFunctions.find((nf) => nf.id === message.source)?.name || message.source}
											{' → '}
											{networkFunctions.find((nf) => nf.id === message.destination)?.name || message.destination}
										</span>{' '}
										<span className='text-gray-600'>
											{typeof message.payload === 'object' && message.payload !== null
												? (message.payload as any).type
												: String(message.payload)}
										</span>
									</div>
								))}
								{messages.length === 0 && <div className='text-gray-400'>No messages yet</div>}
							</div>
						</CardBody>
					</Card>
				</div>

				{/* Main content area */}
				<div className='flex-1 flex flex-col relative overflow-y-auto'>
					{/* Tab content */}
					<div className='flex-1 p-8'>
						{selectedTab === 'network' && (
							<Card className='w-full h-full flex gap-4 relative'>
								<NetworkVisualizer
									networkFunctions={networkFunctions}
									connections={connections}
									messages={messages}
									onNetworkFunctionClick={handleNetworkFunctionClick}
									onConnectionClick={handleConnectionClick}
									selectedId={selectedId}
								/>
							</Card>
						)}

						{selectedTab === 'auth' && (
							<div className='w-full min-h-screen flex flex-col gap-4'>
								<Card className='h-1/2 relative'>
									<NetworkVisualizer
										networkFunctions={networkFunctions}
										connections={connections}
										messages={messages}
										onNetworkFunctionClick={handleNetworkFunctionClick}
										onConnectionClick={handleConnectionClick}
										selectedId={selectedId}
									/>
								</Card>
								<Card className='h-1/2 p-4 bg-white overflow-auto'>
									<CardHeader>
										<h2 className='font-semibold mb-4'>Authentication Flow</h2>
									</CardHeader>
									<CardBody className='relative'>
										<AuthenticationFlowDiagram />
									</CardBody>
								</Card>
							</div>
						)}

						{selectedTab === 'session' && (
							<div className='w-full min-h-screen flex flex-col gap-4'>
								<Card className='h-1/2 relative'>
									<NetworkVisualizer
										networkFunctions={networkFunctions}
										connections={connections}
										messages={messages}
										onNetworkFunctionClick={handleNetworkFunctionClick}
										onConnectionClick={handleConnectionClick}
										selectedId={selectedId}
									/>
								</Card>
								<Card className='h-1/2 p-4'>
									<CardHeader>
										<h2 className='font-semibold mb-4'>PDU Session Establishment</h2>
									</CardHeader>
									<CardBody>
										<PDUSessionEstablishmentDiagram />
									</CardBody>
								</Card>
							</div>
						)}
					</div>
				</div>
			</div>
		</div>
	);
}
