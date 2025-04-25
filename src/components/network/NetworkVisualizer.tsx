import React, { useEffect, useState, useCallback, useRef } from 'react';
import {
	Controls,
	Background,
	addEdge,
	Position,
	MarkerType,
	useReactFlow,
	Connection as RFConnection,
	ReactFlow,
	BackgroundVariant,
	SmoothStepEdge,
	useNodesState,
	useEdgesState,
	type Node,
	type Edge,
	EdgeProps,
	getBezierPath,
	type EdgeTypes,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { NetworkFunction, Connection, Message } from '@/types/network';
import { Button } from '@heroui/react';
import NetworkFunctionNode from './NetworkNode';
import FloatingEdge from './FloatingEdge';
import dynamic from 'next/dynamic';

// Dynamically import the modal component to avoid SSR issues with mermaid
const ProtocolDiagramModal = dynamic(() => import('./ProtocolDiagramModal'), { ssr: false });

// Basic type color map
const typeColorMap: Record<string, string> = {
	UE: '#3498db',
	gNodeB: '#2ecc71',
	AMF: '#e74c3c',
	SMF: '#f39c12',
	UPF: '#1abc9c',
	AUSF: '#34495e',
	UDM: '#e67e22',
	DEFAULT: '#7f8c8d',
};

// Basic status color map
const statusColorMap: Record<string, string> = {
	active: '#2ecc71',
	inactive: '#bdc3c7',
	error: '#e74c3c',
	DEFAULT: '#bdc3c7',
};

const nodeTypes = {
	networkFunction: NetworkFunctionNode,
};

// Define edge types with explicit typing
const edgeTypes: EdgeTypes = {
	floating: FloatingEdge,
};

// Auto layout function that applies a one-time 20% spread from original positions
const calculateAutomaticLayout = (
	nodes: any[],
	connections: any[],
	existingPositions: Record<string, { x: number; y: number }> = {},
	forceLayout = false
): Record<string, { x: number; y: number }> => {
	// Store original positions for nodes if not already stored
	// We use this to only apply the spread once from the original positions
	const originalPositions: Record<string, { x: number; y: number }> = {};
	const newPositions: Record<string, { x: number; y: number }> = {};

	// First, get all original positions from node data
	nodes.forEach((node) => {
		if (node.position) {
			originalPositions[node.id] = {
				x: node.position.x,
				y: node.position.y,
			};
		} else if (existingPositions[node.id]) {
			originalPositions[node.id] = existingPositions[node.id];
		} else {
			// Default position if none exists
			originalPositions[node.id] = { x: 0, y: 0 };
		}
	});

	// If no nodes have positions or force layout is true, apply the spread
	if (Object.keys(originalPositions).length === 0 || forceLayout) {
		return existingPositions;
	}

	// Calculate the center of all original positions
	let centerX = 0;
	let centerY = 0;
	let nodeCount = 0;

	Object.values(originalPositions).forEach((pos) => {
		centerX += pos.x;
		centerY += pos.y;
		nodeCount++;
	});

	if (nodeCount > 0) {
		centerX /= nodeCount;
		centerY /= nodeCount;
	}

	const spreadFactor = 3;

	Object.entries(originalPositions).forEach(([id, pos]) => {
		// Calculate vector from center to original position
		const vectorX = pos.x - centerX;
		const vectorY = pos.y - centerY;

		// Apply the spread
		newPositions[id] = {
			x: centerX + vectorX * spreadFactor,
			y: centerY + vectorY * spreadFactor,
		};
	});

	// Return the spread positions
	return newPositions;
};

// Helper function to apply spreading from center point
const applySpreadToPositions = (
	positions: Record<string, { x: number; y: number }>,
	spreadFactor: number
): Record<string, { x: number; y: number }> => {
	const spreadPositions: Record<string, { x: number; y: number }> = {};
	const nodeCount = Object.keys(positions).length;

	if (nodeCount === 0) return positions;

	// Calculate center point
	let centerX = 0;
	let centerY = 0;

	Object.values(positions).forEach((pos) => {
		centerX += pos.x;
		centerY += pos.y;
	});

	centerX /= nodeCount;
	centerY /= nodeCount;

	// Spread nodes outward from center by spreadFactor
	Object.entries(positions).forEach(([id, pos]) => {
		const dx = pos.x - centerX;
		const dy = pos.y - centerY;

		spreadPositions[id] = {
			x: centerX + dx * spreadFactor,
			y: centerY + dy * spreadFactor,
		};
	});

	return spreadPositions;
};

// Network Visualizer Component
interface NetworkVisualizerProps {
	networkFunctions: Node[];
	connections: Edge[];
	messages: Message[];
	onNetworkFunctionClick?: (nf: NetworkFunction) => void;
	onConnectionClick?: (conn: Connection) => void;
	selectedId?: string;
}

export function NetworkVisualizer({
	networkFunctions = [],
	connections = [],
	messages = [],
	onNetworkFunctionClick,
	onConnectionClick,
	selectedId,
}: NetworkVisualizerProps) {
	// State for nodes and edges
	const [nodes, setNodes, onNodesChange] = useNodesState(networkFunctions as Node[]);
	const [edges, setEdges, onEdgesChange] = useEdgesState(connections as Edge[]);
	// Track selected node and its connections
	const [selectedNodeId, setSelectedNodeId] = useState<string | null>(selectedId || null);
	// Track if we should apply auto layout
	const [hasAppliedLayout, setHasAppliedLayout] = useState(false);
	// State for protocol diagram modal
	const [isProtocolModalOpen, setIsProtocolModalOpen] = useState(false);

	const reactFlowWrapper = useRef<HTMLDivElement>(null);
	const { zoomIn, zoomOut, fitView } = useReactFlow();

	// Process the nodes and edges with visual properties
	useEffect(() => {
		// Find connections for a specific node
		const getNodeConnections = (nodeId: string) => {
			return connections
				.filter((conn) => conn.source === nodeId || conn.target === nodeId)
				.map((conn) => {
					// Get the id of the node on the other end of the connection
					const connectedNodeId = conn.source === nodeId ? conn.target : conn.source;
					const connectedNode = networkFunctions.find((nf) => nf.id === connectedNodeId) as any;

					if (!connectedNode) return null;

					// Get connection data including protocol
					const connData = conn as unknown as Connection;

					return {
						id: connectedNodeId,
						type: connectedNode.type || 'Unknown',
						name: connectedNode.name || connectedNode.id,
						protocol: connData.protocol || 'Unknown',
					};
				})
				.filter(Boolean); // Remove null values
		};

		// Preserve existing node positions from current state
		const nodePositions: Record<string, { x: number; y: number }> = {};
		nodes.forEach((node) => {
			nodePositions[node.id] = {
				x: node.position?.x ?? 0,
				y: node.position?.y ?? 0,
			};
		});

		// Calculate automatic layout if no positions exist or it's the first render
		const shouldApplyLayout = networkFunctions.length > 0 && !hasAppliedLayout;
		const calculatedPositions = calculateAutomaticLayout(
			networkFunctions,
			connections,
			nodePositions,
			shouldApplyLayout
		);

		if (shouldApplyLayout) {
			setHasAppliedLayout(true);
		}

		// Enhance nodes with visual properties
		const enhancedNodes = networkFunctions.map((nf: any) => {
			const nodeType = nf.type || 'DEFAULT';
			const nodeStatus = nf.status || 'inactive';
			const isSelected = selectedNodeId === nf.id;

			// Get connections for all nodes, not just selected ones
			const nodeConnections = getNodeConnections(nf.id);

			// Use calculated position
			const position = calculatedPositions[nf.id] || nf.position || { x: 0, y: 0 };

			return {
				...nf,
				position,
				type: 'networkFunction',
				data: {
					...nf.data,
					...nf,
					typeColor: typeColorMap[nodeType] || typeColorMap.DEFAULT,
					statusColor: statusColorMap[nodeStatus] || statusColorMap.DEFAULT,
					isSelected,
					connections: nodeConnections,
				},
			};
		});

		setNodes(enhancedNodes as Node[]);
		// We specifically omit 'nodes' from the dependency array to prevent position reset
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [networkFunctions, selectedNodeId, connections, hasAppliedLayout]);

	// Auto layout button handler
	const applyAutoLayout = useCallback(() => {
		// Force recalculation of layout
		setHasAppliedLayout(false);
	}, []);

	// Process edges after nodes have been set
	useEffect(() => {
		if (nodes.length === 0) return;

		// Enhance edges with visual properties
		const enhancedEdges = connections.map((conn) => {
			// Type cast to access custom properties
			const connData = conn as unknown as Connection;
			const protocol = connData.protocol || '';

			// Find source and target nodes to get their positions
			const sourceNode = networkFunctions.find((nf) => nf.id === conn.source) as unknown as NetworkFunction;
			const targetNode = networkFunctions.find((nf) => nf.id === conn.target) as unknown as NetworkFunction;

			// Check if this edge is connected to the selected node
			const isConnectedToSelectedNode =
				selectedNodeId && (conn.source === selectedNodeId || conn.target === selectedNodeId);

			// Determine animation direction based on the selected node
			let animationClass = '';
			if (isConnectedToSelectedNode) {
				if (conn.source === selectedNodeId) {
					// Outgoing connection from selected node
					animationClass = 'animated'; // Flow animation
				} else {
					// Incoming connection to selected node
					animationClass = 'animated-pulse'; // Pulse animation
				}
			}

			// Log to help debug animation issues
			if (isConnectedToSelectedNode) {
				console.log(`Edge ${conn.id} is connected to selected node ${selectedNodeId}`);
				console.log(`Animation class: ${animationClass}`);
			}

			return {
				...conn,
				type: 'floating',
				data: {
					...conn.data,
					sourceName: sourceNode?.name || sourceNode?.id || conn.source,
					targetName: targetNode?.name || targetNode?.id || conn.target,
					protocol,
					animated: isConnectedToSelectedNode,
					animationClass,
				},
				markerEnd: {
					type: MarkerType.ArrowClosed,
					color: isConnectedToSelectedNode ? undefined : 'rgba(0,0,0,0.3)', // Dim markers for non-selected connections
				},
				// Base styling is now handled by the FloatingEdge component
				style: {
					opacity: selectedNodeId && !isConnectedToSelectedNode ? 0.3 : 1,
					zIndex: isConnectedToSelectedNode ? 5 : 0,
					strokeWidth: isConnectedToSelectedNode ? 3 : 2,
				},
				selected: isConnectedToSelectedNode,
				animated: true, // Ensure animated prop is passed to the edge
			};
		});

		// Log all edges with animation classes
		console.log(
			'All edges with animation:',
			enhancedEdges.filter((edge) => edge.data.animationClass)
		);

		setEdges(enhancedEdges as Edge[]);
	}, [nodes, connections, networkFunctions, selectedNodeId]);

	// Handle connections
	const onConnect = useCallback((params: RFConnection) => {
		setEdges((eds) => addEdge({ ...params }, eds));
	}, []);

	// Handle node click
	const onNodeClick = useCallback(
		(event: React.MouseEvent, node: Node) => {
			// Toggle selection
			setSelectedNodeId((prevId) => (prevId === node.id ? null : node.id));

			// Still call external handler if provided
			if (onNetworkFunctionClick) {
				onNetworkFunctionClick(node as unknown as NetworkFunction);
			}
		},
		[onNetworkFunctionClick]
	);

	// Handle edge click
	const onEdgeClick = useCallback(
		(event: React.MouseEvent, edge: Edge) => {
			if (onConnectionClick) {
				onConnectionClick(edge as unknown as Connection);
			}
		},
		[onConnectionClick]
	);

	// When nodes are dragged
	const onNodeDragStop = useCallback((event: React.MouseEvent, node: Node, nodes: Node[]) => {
		// Store the updated node positions
		setNodes((prevNodes) => {
			return prevNodes.map((prevNode) => {
				// If this is the dragged node, update its position from the event
				if (prevNode.id === node.id) {
					return {
						...prevNode,
						position: node.position,
					};
				}
				// For other nodes, check if they were also dragged as part of a multi-selection
				const draggedNode = nodes.find((n) => n.id === prevNode.id);
				if (draggedNode) {
					return {
						...prevNode,
						position: draggedNode.position,
					};
				}
				return prevNode;
			});
		});
	}, []);

	// Client-side rendering check
	const [isClient, setIsClient] = useState(false);
	useEffect(() => {
		setIsClient(true);
	}, []);

	// Reset view
	const resetView = useCallback(() => {
		fitView({ padding: 0.2, duration: 300 });
	}, [fitView]);

	// Fit view on initial load
	useEffect(() => {
		if (nodes.length > 0) {
			const timer = setTimeout(() => {
				fitView({ padding: 0.2, duration: 500 });
			}, 300);
			return () => clearTimeout(timer);
		}
	}, [nodes.length, fitView]);

	// Clear selection when clicking on the background
	const onPaneClick = useCallback(() => {
		setSelectedNodeId(null);
	}, []);

	// Placeholder when no data
	if (isClient && networkFunctions.length === 0) {
		return (
			<div className='h-full w-full flex items-center justify-center bg-gray-50 dark:bg-gray-800'>
				<div className='p-6 max-w-md text-center'>
					<h3 className='text-lg font-medium mb-2 dark:text-white'>No Network Functions</h3>
					<p className='text-gray-600 dark:text-gray-300 mb-4'>
						Please set up a network scenario using the controls above.
					</p>
				</div>
			</div>
		);
	}

	if (!isClient) return null;

	return (
		<div
			className='relative w-full h-full'
			ref={reactFlowWrapper}>
			<ReactFlow
				nodes={nodes}
				edges={edges}
				onNodesChange={onNodesChange}
				onEdgesChange={onEdgesChange}
				onConnect={onConnect}
				onNodeClick={onNodeClick}
				onEdgeClick={onEdgeClick}
				onNodeDragStop={onNodeDragStop}
				onPaneClick={onPaneClick}
				edgeTypes={edgeTypes}
				nodeTypes={nodeTypes}
				fitView
				minZoom={0.2}
				maxZoom={2}
				nodesDraggable={true}
				nodesConnectable={false}
				elementsSelectable={true}
				defaultEdgeOptions={{
					type: 'floating',
					selectable: true,
				}}>
				<Background
					variant={'dots' as BackgroundVariant}
					gap={16}
					size={0.5}
				/>
				<Controls />

				{/* Simple control buttons */}
				<div className='absolute top-3 left-3 z-10 flex space-x-1.5 bg-white dark:bg-gray-700 p-1.5 rounded shadow'>
					<Button
						onPress={resetView}
						title='Fit view'
						size='sm'
						variant='ghost'>
						Fit View
					</Button>
					<Button
						onPress={() => zoomIn()}
						title='Zoom In'
						size='sm'
						variant='ghost'>
						+
					</Button>
					<Button
						onPress={() => zoomOut()}
						title='Zoom Out'
						size='sm'
						variant='ghost'>
						-
					</Button>
					<Button
						onPress={applyAutoLayout}
						title='Auto Layout'
						size='sm'
						variant='ghost'>
						Auto Layout
					</Button>
					<Button
						onPress={() => {
							// Log node positions to console for debugging
							console.log(
								'Node Positions:',
								nodes.map((node) => ({
									id: node.id,
									type: node.type,
									name: node.data?.name,
									position: node.position,
								}))
							);
						}}
						title='Log Positions'
						size='sm'
						variant='ghost'>
						Log Positions
					</Button>
				</div>

				{/* Protocol Diagram Button */}
				<div className='absolute top-3 right-3 z-10'>
					<Button
						onPress={() => setIsProtocolModalOpen(true)}
						title='Show Protocol Diagram'
						size='sm'
						variant='solid'
						className='bg-white dark:bg-gray-700 shadow'>
						Protocol Diagram
					</Button>
				</div>
			</ReactFlow>

			{/* Protocol Diagram Modal */}
			<ProtocolDiagramModal
				isOpen={isProtocolModalOpen}
				onClose={() => setIsProtocolModalOpen(false)}
			/>
		</div>
	);
}
