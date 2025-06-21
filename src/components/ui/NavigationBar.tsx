'use client';
import React, { useState } from 'react';
import { useTranslations } from 'next-intl';
import { useRouter, usePathname } from 'next/navigation';
import { Card } from './card';
import { Button } from './button';
import { Menu, X, Activity, Users, BookOpen, Play } from 'lucide-react';
import LanguageSelector from '@/components/ui/LanguageSelector';

const NavigationBar = () => {
	const t = useTranslations('navigation');
	const [isMenuOpen, setIsMenuOpen] = useState(false);
	const router = useRouter();
	const pathname = usePathname();

	const navigationItems = [
		{
			name: t('home'),
			path: '/',
			icon: Activity,
			description: 'Network simulator dashboard',
		},
		{
			name: t('documentation'),
			path: '/documentation',
			icon: BookOpen,
			description: 'Setup guides and documentation',
		},
		{
			name: t('subscribers'),
			path: '/subscribers',
			icon: Users,
			description: 'Manage subscriber database',
		},
	];

	const handleNavigation = (path: string) => {
		router.push(path);
		setIsMenuOpen(false);
	};

	const isActive = (path: string) => {
		if (path === '/') {
			return pathname === '/';
		}
		return pathname.startsWith(path);
	};

	return (
		<Card className='w-full bg-white dark:bg-gray-800 border-b shadow-sm'>
			<div className='px-4 sm:px-6 lg:px-8'>
				<div className='flex justify-between items-center h-16'>
					{/* Logo */}
					<div
						className='flex items-center cursor-pointer'
						onClick={() => handleNavigation('/')}>
						<div className='flex-shrink-0 flex items-center gap-3'>
							<div className='w-8 h-8 bg-primary rounded-lg flex items-center justify-center'>
								<Activity className='w-5 h-5 text-primary-foreground' />
							</div>
							<div className='hidden sm:block'>
								<h1 className='text-xl font-bold text-gray-900 dark:text-white'>5G Network Simulator</h1>
								<p className='text-xs text-gray-500 dark:text-gray-400'>Real-time network visualization</p>
							</div>
						</div>
					</div>

					{/* Desktop Navigation */}
					<div className='hidden md:block'>
						<div className='flex items-center space-x-4'>
							{navigationItems.map((item) => (
								<Button
									key={item.path}
									variant={isActive(item.path) ? 'default' : 'ghost'}
									size='sm'
									onClick={() => handleNavigation(item.path)}
									className='flex items-center gap-2'>
									<item.icon className='w-4 h-4' />
									{item.name}
								</Button>
							))}
							<LanguageSelector />
						</div>
					</div>

					{/* Mobile menu button */}
					<div className='md:hidden flex items-center gap-2'>
						<LanguageSelector />
						<Button
							variant='ghost'
							size='sm'
							onClick={() => setIsMenuOpen(!isMenuOpen)}>
							{isMenuOpen ? <X className='w-5 h-5' /> : <Menu className='w-5 h-5' />}
						</Button>
					</div>
				</div>

				{/* Mobile Navigation */}
				{isMenuOpen && (
					<div className='md:hidden'>
						<div className='px-2 pt-2 pb-3 space-y-1 border-t border-gray-200 dark:border-gray-700'>
							{navigationItems.map((item) => (
								<div
									key={item.path}
									className='block'>
									<Button
										variant={isActive(item.path) ? 'default' : 'ghost'}
										className='w-full justify-start gap-3 h-auto p-3'
										onClick={() => handleNavigation(item.path)}>
										<item.icon className='w-5 h-5' />
										<div className='text-left'>
											<div className='font-medium'>{item.name}</div>
											<div className='text-xs text-muted-foreground'>{item.description}</div>
										</div>
									</Button>
								</div>
							))}
						</div>
					</div>
				)}
			</div>
		</Card>
	);
};

export default NavigationBar;
