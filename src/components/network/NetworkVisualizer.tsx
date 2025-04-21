import { useRef, useEffect, useState } from 'react';
import * as d3 from 'd3';
import { NetworkFunction, Connection, Message } from '@/types/network';
import { getNetworkFunctionTemplate } from '@/services/simulator/network-service';
import { getProtocolInfo } from '@/services/simulator/connection-service';
import { Card, CardBody, CardHeader, Popover, PopoverTrigger, PopoverContent, Button } from '@heroui/react';
import { LucideHelpCircle } from 'lucide-react';
interface NetworkVisualizerProps {
	networkFunctions: NetworkFunction[];
	connections: Connection[];
	messages: Message[];
	onNetworkFunctionClick?: (nf: NetworkFunction) => void;
	onConnectionClick?: (conn: Connection) => void;
	selectedId?: string;
}

export default function NetworkVisualizer({
	networkFunctions,
	connections,
	messages,
	onNetworkFunctionClick,
	onConnectionClick,
	selectedId,
}: NetworkVisualizerProps) {
	const svgRef = useRef<SVGSVGElement>(null);
	const [dimensions, setDimensions] = useState({ width: 800, height: 600 });
	const [tooltipData, setTooltipData] = useState<{ content: string; x: number; y: number } | null>(null);
	const [isDragging, setIsDragging] = useState(false);
	const [isClient, setIsClient] = useState(false);
	const zoomRef = useRef<any>(null);

	useEffect(() => {
		if (typeof window !== 'undefined') {
			setIsClient(true);
		}
	}, []);

	const [showLegend, setShowLegend] = useState(() => {
		if (typeof window !== 'undefined') {
			const saved = localStorage.getItem('networkVisualizerShowLegend');
			return saved !== null ? saved === 'true' : false;
		}
		return false;
	});

	const [showMinimap, setShowMinimap] = useState(() => {
		if (typeof window !== 'undefined') {
			const saved = localStorage.getItem('networkVisualizerShowMinimap');
			return saved !== null ? saved === 'true' : true;
		}
		return true;
	});

	// Save preferences when they change
	useEffect(() => {
		if (typeof window !== 'undefined') {
			localStorage.setItem('networkVisualizerShowLegend', showLegend.toString());
		}
	}, [showLegend]);

	useEffect(() => {
		if (typeof window !== 'undefined') {
			localStorage.setItem('networkVisualizerShowMinimap', showMinimap.toString());
		}
	}, [showMinimap]);

	// Configure color scales for different network function types and statuses
	const typeColorScale = d3
		.scaleOrdinal<string>()
		.domain(['UE', 'RAN', '5GC', 'AMF', 'SMF', 'UPF', 'AUSF', 'UDM'])
		.range(['#3498db', '#2ecc71', '#9b59b6', '#e74c3c', '#f39c12', '#1abc9c', '#34495e', '#e67e22']);

	const statusColorScale = d3
		.scaleOrdinal<string>()
		.domain(['active', 'inactive', 'error'])
		.range(['#2ecc71', '#95a5a6', '#e74c3c']);

	// Handle window resize
	useEffect(() => {
		const handleResize = () => {
			if (svgRef.current) {
				const container = svgRef.current.parentElement;
				if (container) {
					setDimensions({
						width: container.clientWidth,
						height: container.clientHeight,
					});
				}
			}
		};

		handleResize();
		window.addEventListener('resize', handleResize);
		return () => window.removeEventListener('resize', handleResize);
	}, []);

	// Reset view function
	const resetView = () => {
		if (svgRef.current && zoomRef.current) {
			const svg = d3.select(svgRef.current);
			svg
				.transition()
				.duration(750)
				.call(
					zoomRef.current.transform,
					d3.zoomIdentity,
					d3.zoomTransform(svg.node()!).invert([dimensions.width / 2, dimensions.height / 2])
				);
		}
	};

	// Render the network visualization
	useEffect(() => {
		if (!svgRef.current || networkFunctions.length === 0) return;

		const svg = d3.select(svgRef.current);
		svg.selectAll('*').remove(); // Clear previous elements

		// Create the main group for transformations
		const g = svg.append('g');

		// Add zoom behavior
		const zoom = d3
			.zoom()
			.scaleExtent([0.1, 4])
			.filter((event) => event.ctrlKey || event.metaKey) // Only zoom when control/command key is pressed
			.on('zoom', (event) => {
				g.attr('transform', event.transform);
				// Hide tooltip on zoom
				setTooltipData(null);
			});

		// Store zoom reference for reset functionality
		zoomRef.current = zoom;

		svg.call(zoom as any);

		// Create arrow markers for connections
		svg
			.append('defs')
			.selectAll('marker')
			.data(['end'])
			.enter()
			.append('marker')
			.attr('id', 'arrow')
			.attr('viewBox', '0 -5 10 10')
			.attr('refX', 20)
			.attr('refY', 0)
			.attr('markerWidth', 6)
			.attr('markerHeight', 6)
			.attr('orient', 'auto')
			.append('path')
			.attr('d', 'M0,-5L10,0L0,5')
			.attr('fill', '#999');

		// Draw connections first (so they appear behind nodes)
		const link = g
			.selectAll('.link')
			.data(connections)
			.enter()
			.append('path')
			.attr('class', 'link')
			.attr('stroke', (d) => (d.status === 'active' ? '#666' : '#ccc'))
			.attr('stroke-width', (d) => (d.status === 'active' ? 2 : 1))
			.attr('stroke-dasharray', (d) => (d.status === 'active' ? '0' : '3,3'))
			.attr('marker-end', 'url(#arrow)')
			.attr('fill', 'none')
			.attr('d', (d) => {
				const source = networkFunctions.find((nf) => nf.id === d.source);
				const target = networkFunctions.find((nf) => nf.id === d.target);

				if (!source || !target) return '';

				// Calculate path with slight curve for better visualization
				const dx = target.position.x - source.position.x;
				const dy = target.position.y - source.position.y;
				const dr = Math.sqrt(dx * dx + dy * dy) * 1.5;

				return `M${source.position.x},${source.position.y}A${dr},${dr} 0 0,1 ${target.position.x},${target.position.y}`;
			})
			.on('mouseover', (event, d) => {
				const protocolInfo = getProtocolInfo(d.protocol);
				setTooltipData({
					content: `
            <strong>${d.protocol} Connection</strong><br/>
            ${protocolInfo.description}<br/>
            Status: ${d.status}<br/>
            ${d.latency ? `Latency: ${d.latency}ms<br/>` : ''}
            ${d.bandwidth ? `Bandwidth: ${d.bandwidth}Mbps<br/>` : ''}
          `,
					x: event.pageX,
					y: event.pageY,
				});
			})
			.on('mouseout', () => {
				setTooltipData(null);
			})
			.on('click', (event, d) => {
				event.stopPropagation();
				onConnectionClick?.(d);
			})
			.attr('stroke', (d) => (d.id === selectedId ? '#ff0000' : d.status === 'active' ? '#666' : '#ccc'))
			.attr('stroke-width', (d) => (d.id === selectedId ? 3 : d.status === 'active' ? 2 : 1));

		// Add protocol labels to connections
		g.selectAll('.link-label')
			.data(connections)
			.enter()
			.append('text')
			.attr('class', 'link-label')
			.attr('font-size', '10px')
			.attr('text-anchor', 'middle')
			.attr('dy', -5)
			.append('textPath')
			.attr('xlink:href', (d, i) => `#path${i}`)
			.attr('startOffset', '50%')
			.text((d) => d.protocol);

		// Draw network function nodes
		const node = g
			.selectAll('.node')
			.data(networkFunctions)
			.enter()
			.append('g')
			.attr('class', 'node')
			.attr('transform', (d) => `translate(${d.position.x},${d.position.y})`)
			.on('mouseover', (event, d) => {
				if (isDragging) return; // Don't show tooltip when dragging
				const template = getNetworkFunctionTemplate(d.type);
				setTooltipData({
					content: `
            <strong>${d.name}</strong><br/>
            Type: ${d.type}<br/>
            Status: ${d.status}<br/>
            ${template.description}<br/>
            ${d.ipAddress ? `IP: ${d.ipAddress}<br/>` : ''}
            Connections: ${d.connections.length}
          `,
					x: event.pageX,
					y: event.pageY,
				});
			})
			.on('mouseout', () => {
				setTooltipData(null);
			})
			.on('click', (event, d) => {
				event.stopPropagation();
				onNetworkFunctionClick?.(d);
			})
			.call(
				d3.drag<SVGGElement, NetworkFunction>().on('start', dragstarted).on('drag', dragged).on('end', dragended) as any
			);

		// Draw node circles
		node
			.append('circle')
			.attr('r', 20)
			.attr('fill', (d) => typeColorScale(d.type))
			.attr('stroke', (d) => (d.id === selectedId ? '#ff0000' : statusColorScale(d.status)))
			.attr('stroke-width', (d) => (d.id === selectedId ? 3 : 2))
			.attr('cursor', 'grab');

		// Add node labels
		node
			.append('text')
			.attr('text-anchor', 'middle')
			.attr('dy', 30)
			.attr('font-size', '12px')
			.text((d) => d.name);

		// Add node type labels
		node
			.append('text')
			.attr('text-anchor', 'middle')
			.attr('dy', 4)
			.attr('font-size', '10px')
			.attr('fill', 'white')
			.text((d) => d.type);

		// Handle active messages with animations
		const recentMessages = messages.filter((m) => new Date().getTime() - new Date(m.timestamp).getTime() < 5000);

		recentMessages.forEach((message) => {
			const source = networkFunctions.find((nf) => nf.id === message.source);
			const target = networkFunctions.find((nf) => nf.id === message.destination);

			if (!source || !target) return;

			// Create message circle
			const messageCircle = g
				.append('circle')
				.attr('r', 5)
				.attr('fill', message.type === 'ERROR' ? '#e74c3c' : '#3498db')
				.attr('cx', source.position.x)
				.attr('cy', source.position.y);

			// Animate the message along the path
			messageCircle
				.transition()
				.duration(1000)
				.attrTween('transform', () => {
					return (t: number) => {
						const x = source.position.x + (target.position.x - source.position.x) * t;
						const y = source.position.y + (target.position.y - source.position.y) * t;
						return `translate(${x - source.position.x},${y - source.position.y})`;
					};
				})
				.on('end', () => {
					messageCircle.remove();
				});
		});

		// Drag handlers
		function dragstarted(event: d3.D3DragEvent<SVGGElement, NetworkFunction, any>, d: NetworkFunction) {
			setIsDragging(true);
			setTooltipData(null); // Clear any open tooltips when starting a drag
			if (!event.active) d3.forceSimulation().alphaTarget(0.3).restart();
		}

		function dragged(this: any, event: d3.D3DragEvent<SVGGElement, NetworkFunction, any>, d: NetworkFunction) {
			d.position.x = event.x;
			d.position.y = event.y;
			d3.select(this).attr('transform', `translate(${d.position.x},${d.position.y})`);

			// Update connection paths
			link
				.filter((conn) => conn.source === d.id || conn.target === d.id)
				.attr('d', (conn) => {
					const source = networkFunctions.find((nf) => nf.id === conn.source);
					const target = networkFunctions.find((nf) => nf.id === conn.target);

					if (!source || !target) return '';

					const dx = target.position.x - source.position.x;
					const dy = target.position.y - source.position.y;
					const dr = Math.sqrt(dx * dx + dy * dy) * 1.5;

					return `M${source.position.x},${source.position.y}A${dr},${dr} 0 0,1 ${target.position.x},${target.position.y}`;
				});
		}

		function dragended(event: d3.D3DragEvent<SVGGElement, NetworkFunction, any>, d: NetworkFunction) {
			setIsDragging(false);
			if (!event.active) d3.forceSimulation().alphaTarget(0);
			// Here you might want to call an API to update the position in the backend
		}
	}, [networkFunctions, connections, messages, dimensions, selectedId, onConnectionClick, onNetworkFunctionClick]);

	if (!isClient) return null;

	return (
		<div className='relative w-full h-full select-none'>
			<svg
				ref={svgRef}
				width={dimensions.width}
				height={dimensions.height}
				className={`rounded-md bg-white ${isDragging ? 'cursor-grabbing' : ''}`}
			/>

			{/* Control buttons */}
			<div className='absolute top-4 left-4 flex space-x-2'>
				<Button
					onPress={resetView}
					title='Reset view'>
					Reset View
				</Button>
				<Button
					onPress={() => setShowLegend(!showLegend)}
					title='Show/hide legend'>
					{showLegend ? 'Hide Legend' : 'Show Legend'}
				</Button>
				<Button
					onPress={() => setShowMinimap(!showMinimap)}
					title='Show/hide minimap'>
					{showMinimap ? 'Hide Minimap' : 'Show Minimap'}
				</Button>
			</div>

			{/* Mini-map for network overview */}
			{showMinimap && networkFunctions.length > 0 && (
				<Card className='absolute top-4 right-4 z-10 p-2 w-52'>
					<svg>
						{connections.map((conn) => {
							const source = networkFunctions.find((nf) => nf.id === conn.source);
							const target = networkFunctions.find((nf) => nf.id === conn.target);
							if (!source || !target) return null;

							// Calculate minimap coordinates
							const maxX = Math.max(...networkFunctions.map((nf) => nf.position.x));
							const maxY = Math.max(...networkFunctions.map((nf) => nf.position.y));
							const minX = Math.min(...networkFunctions.map((nf) => nf.position.x));
							const minY = Math.min(...networkFunctions.map((nf) => nf.position.y));

							const scale = Math.min(140 / (maxX - minX || 1), 140 / (maxY - minY || 1));

							const miniSource = {
								x: (source.position.x - minX) * scale + 5,
								y: (source.position.y - minY) * scale + 5,
							};

							const miniTarget = {
								x: (target.position.x - minX) * scale + 5,
								y: (target.position.y - minY) * scale + 5,
							};

							return (
								<line
									key={conn.id}
									x1={miniSource.x}
									y1={miniSource.y}
									x2={miniTarget.x}
									y2={miniTarget.y}
									stroke={conn.status === 'active' ? '#666' : '#ccc'}
									strokeWidth={1}
								/>
							);
						})}

						{networkFunctions.map((nf) => {
							// Calculate minimap coordinates
							const maxX = Math.max(...networkFunctions.map((n) => n.position.x));
							const maxY = Math.max(...networkFunctions.map((n) => n.position.y));
							const minX = Math.min(...networkFunctions.map((n) => n.position.x));
							const minY = Math.min(...networkFunctions.map((n) => n.position.y));

							const scale = Math.min(150 / (maxX - minX || 1), 150 / (maxY - minY || 1));

							const miniX = (nf.position.x - minX) * scale + 5;
							const miniY = (nf.position.y - minY) * scale + 5;

							return (
								<circle
									key={nf.id}
									cx={miniX}
									cy={miniY}
									r={4}
									fill={typeColorScale(nf.type)}
									stroke={nf.id === selectedId ? '#ff0000' : statusColorScale(nf.status)}
									strokeWidth={nf.id === selectedId ? 2 : 1}
								/>
							);
						})}
					</svg>
				</Card>
			)}

			{/* Legend */}
			{showLegend && (
				<Card className='absolute top-48 right-4 z-10 w-52'>
					<CardHeader>
						<h3 className='font-semibold text-sm'>Network Function Types</h3>
					</CardHeader>
					<CardBody>
						<div className='grid grid-cols-2 gap-y-2 gap-x-4 text-xs'>
							{['UE', 'RAN', '5GC', 'AMF', 'SMF', 'UPF', 'AUSF', 'UDM'].map((type) => (
								<div
									key={type}
									className='flex items-center'>
									<div
										className='w-4 h-4 rounded-full mr-2'
										style={{ backgroundColor: typeColorScale(type) }}></div>
									<span>{type}</span>
								</div>
							))}
						</div>
					</CardBody>
				</Card>
			)}

			{/* Drag indicator */}
			{isDragging && (
				<div className='absolute bottom-4 left-4 bg-blue-400 text-white px-3 py-1 rounded-md text-sm shadow-lg'>
					Moving network function
				</div>
			)}

			{tooltipData && !isDragging && (
				<div
					className='absolute bg-white shadow-lg rounded p-2 text-sm border border-gray-300 z-10 pointer-events-none select-none'
					style={{
						left: tooltipData.x - 300,
						top: tooltipData.y - 100,
						maxWidth: '200px',
					}}
					dangerouslySetInnerHTML={{ __html: tooltipData.content }}
				/>
			)}

			<Popover className='absolute bottom-2 right-2 bg-white/80 text-xs z-10 w-80'>
				<PopoverTrigger>
					<Button
						color='primary'
						isIconOnly
						radius='full'
						className='absolute bottom-4 right-4'
						aria-label='Show instructions'>
						<LucideHelpCircle className='h-5 w-5' />
					</Button>
				</PopoverTrigger>
				<PopoverContent className='p-4'>
					<h3 className='font-semibold text-gray-800'>Network Visualizer Controls</h3>
					<ul className='space-y-2 text-gray-700'>
						<li>
							<span className='font-medium'>Click</span>: Select a network function or connection
						</li>
						<li>
							<span className='font-medium'>Drag</span>: Move network functions
						</li>
						<li>
							<span className='font-medium'>Ctrl/Cmd + Scroll</span>: Zoom in/out
						</li>
						<li>
							<span className='font-medium'>Hover</span>: View details
						</li>
					</ul>
				</PopoverContent>
			</Popover>
		</div>
	);
}
