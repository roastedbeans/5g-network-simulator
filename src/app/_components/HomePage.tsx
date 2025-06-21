'use client';
import React from 'react';
import { useTranslations } from 'next-intl';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Play, BookOpen, Users, Activity, Zap, Shield, Network } from 'lucide-react';
import Link from 'next/link';

export default function HomePage() {
	const t = useTranslations('home');

	const features = [
		{
			icon: Users,
			title: t('features.ueRegistration.title'),
			description: t('features.ueRegistration.description'),
			color: 'bg-blue-100 text-blue-600',
		},
		{
			icon: BookOpen,
			title: t('features.setupGuides.title'),
			description: t('features.setupGuides.description'),
			color: 'bg-green-100 text-green-600',
		},
	];

	return (
		<div className='min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800'>
			<div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12'>
				{/* Hero Section */}
				<div className='text-center mb-16'>
					<div className='flex justify-center mb-6'>
						<div className='p-4 bg-primary rounded-full'>
							<Zap className='w-12 h-12 text-primary-foreground' />
						</div>
					</div>
					<h1 className='text-4xl md:text-6xl font-bold text-gray-900 dark:text-white mb-6'>{t('hero.title')}</h1>
					<p className='text-xl text-gray-600 dark:text-gray-300 mb-8 max-w-3xl mx-auto'>{t('hero.subtitle')}</p>
					<div className='flex flex-col sm:flex-row gap-4 justify-center'>
						<Link href='/documentation'>
							<Button
								size='lg'
								className='w-full sm:w-auto'>
								<BookOpen className='w-5 h-5 mr-2' />
								{t('hero.learnMore')}
							</Button>
						</Link>
						<Link href='/subscribers'>
							<Button
								size='lg'
								variant='outline'
								className='w-full sm:w-auto'>
								<Users className='w-5 h-5 mr-2' />
								{t('hero.registerUE')}
							</Button>
						</Link>
					</div>
				</div>

				{/* Features Grid */}
				<div className='grid md:grid-cols-2 gap-8 mb-16 max-w-4xl mx-auto'>
					{features.map((feature, index) => (
						<Card
							key={index}
							className='text-center'>
							<CardContent className='p-6'>
								<div className={`inline-flex p-3 rounded-full ${feature.color} mb-4`}>
									<feature.icon className='w-6 h-6' />
								</div>
								<h3 className='text-xl font-semibold mb-2'>{feature.title}</h3>
								<p className='text-gray-600 dark:text-gray-300'>{feature.description}</p>
							</CardContent>
						</Card>
					))}
				</div>

				{/* Status Badge */}
				<div className='text-center mt-16'>
					<Badge
						variant='outline'
						className='px-4 py-2'>
						{t('status')}
					</Badge>
				</div>
			</div>
		</div>
	);
}
