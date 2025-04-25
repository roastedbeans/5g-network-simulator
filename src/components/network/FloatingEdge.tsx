import { getSmoothStepPath, useInternalNode, EdgeProps } from '@xyflow/react';
import { getEdgeParams } from '@/utils/utils';
import { ProtocolType } from '@/types/network';

export interface FloatingEdgeProps extends Partial<EdgeProps> {
	id: string;
	source: string;
	target: string;
	data?: {
		protocol?: ProtocolType;
		sourceName?: string;
		targetName?: string;
		animated?: boolean;
		animationClass?: string;
	};
	selected?: boolean;
	animated?: boolean;
}

// Protocol color mapping
const protocolColors: Record<ProtocolType, string> = {
	N1: '#3498db', // Blue - UE-AMF
	N2: '#2ecc71', // Green - RAN-AMF
	N3: '#e74c3c', // Red - RAN-UPF (User Plane)
	N4: '#f39c12', // Orange - SMF-UPF
	N6: '#9b59b6', // Purple - UPF-Data Network
	N8: '#1abc9c', // Turquoise - UDM-AMF
	N9: '#d35400', // Dark Orange - UPF-UPF
	N10: '#8e44ad', // Violet - UDM-SMF
	N11: '#27ae60', // Emerald - AMF-SMF
	N12: '#2980b9', // Dark Blue - AMF-AUSF
	N13: '#c0392b', // Dark Red - UDM-AUSF
	N14: '#16a085', // Green Blue - AMF-AMF
	N15: '#7f8c8d', // Gray - AMF-PCF
	N32: '#34495e', // Dark Gray - SEPP-SEPP
};

// Protocol stroke dash arrays for different types
const protocolStrokeDashArrays: Record<ProtocolType, string> = {
	N1: '0', // Solid line
	N2: '0', // Solid line
	N3: '0', // Solid line
	N4: '5,5', // Dashed
	N6: '0', // Solid
	N8: '10,10', // Long dashed
	N9: '0', // Solid
	N10: '5,5', // Dashed
	N11: '0', // Solid
	N12: '5,10', // Dash-dot
	N13: '10,10', // Long dashed
	N14: '5,5,1,5', // Dash-dot-dot
	N15: '5,5', // Dashed
	N32: '10,5', // Long dash-short dash
};

const FloatingEdge = ({
	id,
	source,
	target,
	markerEnd,
	style = {},
	data,
	selected,
	animated: edgeAnimated,
}: FloatingEdgeProps) => {
	const sourceNode = useInternalNode(source);
	const targetNode = useInternalNode(target);

	if (!sourceNode || !targetNode) {
		return null;
	}

	const { sx, sy, tx, ty, sourcePos, targetPos } = getEdgeParams(sourceNode, targetNode);

	// Use source/target coordinates from props if provided, otherwise use calculated values
	const [edgePath, labelX, labelY] = getSmoothStepPath({
		sourceX: sx,
		sourceY: sy,
		sourcePosition: sourcePos,
		targetPosition: targetPos,
		targetX: tx,
		targetY: ty,
	});

	// Get protocol and determine color and style
	const protocol = data?.protocol as ProtocolType;
	const edgeColor = protocol && protocolColors[protocol] ? protocolColors[protocol] : '#888888';
	const strokeDashArray = protocol && protocolStrokeDashArrays[protocol] ? protocolStrokeDashArrays[protocol] : '0';

	// Get source and target names
	const sourceName = data?.sourceName || '';
	const targetName = data?.targetName || '';

	return (
		<>
			<path
				id={id}
				className={`react-flow__edge-path`}
				d={edgePath}
				strokeWidth={selected ? 3 : 2}
				stroke={edgeColor}
				strokeDasharray={strokeDashArray}
				markerEnd={markerEnd}
				style={{
					...style,

					stroke: edgeColor,
				}}
			/>

			{/* Edge label for protocol */}
			{protocol && (
				<foreignObject
					width={60}
					height={30}
					x={labelX - 30}
					y={labelY - 15}
					className='react-flow__edge-label'
					requiredExtensions='http://www.w3.org/1999/xhtml'>
					<div className='flex justify-center items-center h-full'>
						<div
							className={`px-2 py-1 rounded text-xs font-bold bg-white ${selected ? 'ring-2 ring-offset-1' : ''}`}
							style={{
								border: `1.5px solid ${edgeColor}`,
								color: edgeColor,
								boxShadow: selected ? '0 0 8px rgba(0,0,0,0.3)' : 'none',
							}}>
							{protocol}
						</div>
					</div>
				</foreignObject>
			)}
		</>
	);
};

export default FloatingEdge;
