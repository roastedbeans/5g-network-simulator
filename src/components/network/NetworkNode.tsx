import React, { memo } from 'react';
import { NetworkRole } from '@/types/network';
import { Position } from '@xyflow/react';
import { Handle } from '@xyflow/react';

interface NodeData {
	slug: string;
	name: string;
	status: 'active' | 'inactive' | 'error';
	plmn?: { id: string; role: NetworkRole; name: string };
	ipAddress?: string;
	protocols?: string[];
	statusColor: string;
	isSelected?: boolean;
	connections?: Array<{ id: string; type: string; name: string; protocol?: string }>;
	[key: string]: unknown;
}

interface NetworkFunctionNodeProps {
	data: NodeData;
	selected?: boolean;
}

function NetworkFunctionNode({ data, selected }: NetworkFunctionNodeProps) {
	const {
		slug,
		name,
		status,
		plmn,
		ipAddress,
		protocols = [],
		isSelected = selected,
		statusColor,
		connections = [],
	} = data;

	// Prevent node size changes from affecting position

	const plmnRole = plmn?.role || 'home';
	const plmnBorder = plmnRole === 'home' ? '#284c64' : '#831d11';
	const borderColor = isSelected ? plmnBorder : statusColor;
	// Don't change these dimensions on selection to avoid position shifts
	const cardWidth = '200px';
	const minHeight = '100px';

	return (
		<div
			className='rounded shadow-md overflow-hidden relative cursor-move transition-all duration-200'
			style={{
				width: cardWidth,
				minHeight: minHeight,
				backgroundColor: plmnBorder,
				border: `1px solid ${borderColor}`,
				color: 'white',
				zIndex: isSelected ? 10 : 1,
			}}>
			{/* Header with type */}
			<div className={`bg-black px-2 py-1 flex justify-between items-center`}>
				<div className='text-sm font-bold'>{name}</div>
				<div
					className='h-2 w-2 rounded-full'
					style={{ backgroundColor: statusColor }}
					title={`Status: ${status}`}
				/>
			</div>

			{/* Content */}
			<div className='text-sm p-2'>
				<div className='text-sm text-gray-200'>PLMN: {plmn?.id || 'N/A'}</div>
				{ipAddress && <div className='text-xs text-gray-200'>IP: {ipAddress}</div>}

				{/* Show protocols if available */}
				{protocols.length > 0 && (
					<div className='mt-1'>
						<div className='text-sm font-medium'>Protocols:</div>
						<div className='flex flex-wrap gap-1 mt-0.5'>
							{protocols.map((protocol) => (
								<span
									key={protocol}
									className='bg-black bg-opacity-20 px-1 text-sm rounded'>
									{protocol}
								</span>
							))}
						</div>
					</div>
				)}

				{/* Always show connected nodes */}
				{connections.length > 0 && (
					<div className='mt-1 h-fit'>
						<div className='text-sm font-medium'>Connected to:</div>
						<div className='flex flex-col gap-0.5 mt-0.5'>
							{connections.map((conn) => (
								<div
									key={conn.id}
									className='text-sm bg-black px-2 py-1 rounded flex justify-between items-center'>
									<span>{conn.name}</span>
									{conn.protocol && <span className='text-sm rounded'>{conn.protocol}</span>}
								</div>
							))}
						</div>
					</div>
				)}
			</div>

			{/* Basic connection points - one on each side */}
			<Handle
				type='source'
				position={Position.Top}
				className='opacity-0'
				id={`${slug}`}
			/>
			<Handle
				type='source'
				position={Position.Right}
				className='opacity-0'
				id={`${slug}`}
			/>
			<Handle
				type='source'
				position={Position.Bottom}
				className='opacity-0'
				id={`${slug}`}
			/>
			<Handle
				type='source'
				position={Position.Left}
				className='opacity-0'
				id={`${slug}`}
			/>

			{/* {Target handles} */}
			<Handle
				type='target'
				position={Position.Top}
				className='opacity-0'
				id={`${slug}`}
			/>
			<Handle
				type='target'
				position={Position.Right}
				className='opacity-0'
				id={`${slug}`}
			/>
			<Handle
				type='target'
				position={Position.Bottom}
				className='opacity-0'
				id={`${slug}`}
			/>
			<Handle
				type='target'
				position={Position.Left}
				className='opacity-0'
				id={`${slug}`}
			/>
		</div>
	);
}

export default memo(NetworkFunctionNode);
