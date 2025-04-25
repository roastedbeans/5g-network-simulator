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

// Automatic layout function to position nodes in a grid with appropriate spacing
const calculateAutomaticLayout = (
	nodes: any[],
	connections: any[],
	existingPositions: Record<string, { x: number; y: number }> = {},
	forceLayout = false
): Record<string, { x: number; y: number }> => {
	// If we already have positions for all nodes and force layout is false, keep them
	const allNodesHavePositions = nodes.every((node) => existingPositions[node.id]);
	if (allNodesHavePositions && !forceLayout) {
		return existingPositions;
	}

	const positions: Record<string, { x: number; y: number }> = { ...existingPositions };

	// Set base values for layout with increased spacing
	const nodeWidth = 400; // Width of node cards plus spacing
	const nodeHeight = 350; // Height of node cards plus spacing
	const groupPadding = 100; // Padding between major groups (home vs visited)

	// First separate by PLMN (home vs visited)
	const homeNodes: any[] = [];
	const visitedNodes: any[] = [];

	nodes.forEach((node) => {
		const plmnRole = node.data?.plmn?.role || node.plmn?.role || 'home';
		if (plmnRole === 'visited') {
			visitedNodes.push(node);
		} else {
			homeNodes.push(node);
		}
	});

	// Function to organize nodes by type within a PLMN group
	const organizeByType = (nodeGroup: any[], startY: number) => {
		// Create groups by node type
		const nodesByType: Record<string, any[]> = {};
		nodeGroup.forEach((node) => {
			const type = node.type || node.data?.type || 'DEFAULT';
			if (!nodesByType[type]) {
				nodesByType[type] = [];
			}
			nodesByType[type].push(node);
		});

		// Extract special node types for custom positioning
		const seppNodes = nodesByType['SEPP'] || [];
		const ueNodes = nodesByType['UE'] || [];
		const packetrusherNodes = nodesByType['PacketRusher'] || [];

		// Remove special nodes from regular processing
		delete nodesByType['SEPP'];
		delete nodesByType['UE'];
		delete nodesByType['PacketRusher'];

		// Order types to position related functions closer to SEPP
		const typeOrder = ['AMF', 'SMF', 'UPF', 'AUSF', 'UDM', 'gNodeB'];
		const sortedTypes = [...typeOrder, ...Object.keys(nodesByType).filter((type) => !typeOrder.includes(type))];

		// Position each type group in a horizontal row pattern
		let gridY = startY;
		const typePadding = 250; // Padding between different types (vertical)
		let maxX = 0; // Track the rightmost position

		// First position SEPP nodes in the center-left
		if (seppNodes.length > 0) {
			const seppStartX = 600; // Center-left position
			seppNodes.forEach((node, index) => {
				positions[node.id] = {
					x: seppStartX + index * (nodeWidth * 0.7), // Position close together
					y: gridY + 100, // A bit below the starting Y
				};
				maxX = Math.max(maxX, seppStartX + index * (nodeWidth * 0.7) + nodeWidth);
			});
			gridY += nodeHeight + typePadding;
		}

		// Next position core network functions close to SEPP
		sortedTypes.forEach((type) => {
			if (!nodesByType[type]) return;

			const typeNodes = nodesByType[type];
			const nodesPerRow = Math.ceil(Math.sqrt(typeNodes.length) * 1.5); // More nodes per row for horizontal layout

			// Start position depends on function type
			let rowStartX = 400;

			if (['AMF', 'SMF', 'UPF'].includes(type)) {
				// Position key core network functions closer to SEPP
				rowStartX = 300;
			} else if (['AUSF', 'UDM'].includes(type)) {
				// Position authentication functions in a middle distance
				rowStartX = 500;
			} else {
				// Other functions slightly farther
				rowStartX = 700;
			}

			typeNodes.forEach((node, index) => {
				const col = index % nodesPerRow;
				const row = Math.floor(index / nodesPerRow);

				positions[node.id] = {
					x: rowStartX + col * nodeWidth,
					y: gridY + row * nodeHeight,
				};
				maxX = Math.max(maxX, rowStartX + col * nodeWidth + nodeWidth);
			});

			// Calculate row count and move down for next type
			const rowCount = Math.ceil(typeNodes.length / nodesPerRow);
			gridY += rowCount * nodeHeight + typePadding;
		});

		// Finally position UE and PacketRusher far to the right
		// UE first
		if (ueNodes.length > 0) {
			const ueStartX = maxX + 300; // Far right
			ueNodes.forEach((node, index) => {
				positions[node.id] = {
					x: ueStartX + index * nodeWidth,
					y: startY + 200, // Higher up
				};
			});
		}

		// PacketRusher last
		if (packetrusherNodes.length > 0) {
			const prStartX = maxX + 300; // Far right
			packetrusherNodes.forEach((node, index) => {
				positions[node.id] = {
					x: prStartX + index * nodeWidth,
					y: startY + 600, // Lower down
				};
			});
		}

		return gridY; // Return the ending Y position
	};

	// Layout home network on the top
	const homeEndY = organizeByType(homeNodes, 100);

	// Layout visited network at the bottom with good separation
	organizeByType(visitedNodes, homeEndY + groupPadding);

	// Second pass: adjust positions based on connections for better layout
	// This creates a bit of a force-directed effect
	for (let i = 0; i < 3; i++) {
		// Just a few iterations to keep it simple
		connections.forEach((conn) => {
			const source = conn.source;
			const target = conn.target;

			if (positions[source] && positions[target]) {
				// Apply a slight attractive force between connected nodes
				const sourcePos = positions[source];
				const targetPos = positions[target];

				// Check if this connection crosses between home and visited
				const sourceNode = nodes.find((n) => n.id === source);
				const targetNode = nodes.find((n) => n.id === target);

				const sourcePlmn = sourceNode?.data?.plmn?.role || sourceNode?.plmn?.role || 'home';
				const targetPlmn = targetNode?.data?.plmn?.role || targetNode?.plmn?.role || 'home';

				// If connection is within the same PLMN, try to move nodes closer
				if (sourcePlmn === targetPlmn) {
					const dx = targetPos.x - sourcePos.x;
					const dy = targetPos.y - sourcePos.y;
					const distance = Math.sqrt(dx * dx + dy * dy);

					// Only adjust if nodes are too far apart but keep minimum spacing
					if (distance > nodeWidth * 6) {
						const adjustmentFactor = 0.05; // Small adjustment to avoid chaotic movements

						// Move nodes slightly closer together
						positions[source] = {
							x: sourcePos.x + dx * adjustmentFactor,
							y: sourcePos.y + dy * adjustmentFactor,
						};

						positions[target] = {
							x: targetPos.x - dx * adjustmentFactor,
							y: targetPos.y - dy * adjustmentFactor,
						};
					}
				}
			}
		});
	}

	return positions;
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

			return {
				...conn,
				type: 'floating',
				data: {
					...conn.data,
					sourceName: sourceNode?.name || sourceNode?.id || conn.source,
					targetName: targetNode?.name || targetNode?.id || conn.target,
					protocol,
					animated: isConnectedToSelectedNode, // Animate edges connected to selected node
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
			};
		});

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
		console.log('Node dragged:', node.id, node.position);
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
				</div>
			</ReactFlow>
		</div>
	);
}
