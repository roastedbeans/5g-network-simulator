'use client';
import React from 'react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

const NavigationBar = () => {
	return (
		<div className='flex gap-4 bg-primary p-4 shadow-sm'>
			<Button
				variant='ghost'
				asChild>
				<Link
					href='/'
					className='hover:bg-gray-300 transition-colors duration-200 p-2 rounded-md text-white'>
					Home
				</Link>
			</Button>
			<Button
				variant='ghost'
				asChild>
				<Link
					href='/subscribers'
					className='hover:bg-gray-300 transition-colors duration-200 p-2 rounded-md text-white'>
					Subscriber Registration
				</Link>
			</Button>
			<Button
				variant='ghost'
				asChild>
				<Link
					href='/documentation'
					className='hover:bg-gray-300 transition-colors duration-200 p-2 rounded-md text-white'>
					Documentation
				</Link>
			</Button>
		</div>
	);
};

export default NavigationBar;
