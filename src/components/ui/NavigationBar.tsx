'use client';
import React from 'react';
import { Button, Link } from '@heroui/react';

const NavigationBar = () => {
	return (
		<div className='flex gap-4'>
			<Link
				href='/'
				className='hover:bg-gray-300 transition-colors duration-200 p-2 rounded-md text-gray-900'>
				Home
			</Link>
			<Link
				href='/simulator'
				className='hover:bg-gray-300 transition-colors duration-200 p-2 rounded-md text-gray-900'>
				Network Visualizer
			</Link>
			<Link
				href='/simulator'
				className='hover:bg-gray-300 transition-colors duration-200 p-2 rounded-md text-gray-900'>
				Subscriber Registration
			</Link>
		</div>
	);
};

export default NavigationBar;
