'use client';

import React from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './select';
import { Globe, Loader2 } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';

const LanguageSelector = () => {
	const { locale, setLocale, isLoading } = useLanguage();

	const handleLocaleChange = (newLocale: string) => {
		if (newLocale === 'en' || newLocale === 'ko') {
			setLocale(newLocale);
		}
	};

	const languages = [
		{ code: 'en', name: 'English', flag: '🇺🇸' },
		{ code: 'ko', name: '한국어', flag: '🇰🇷' },
	];

	const currentLanguage = languages.find((lang) => lang.code === locale);

	return (
		<Select
			value={locale}
			onValueChange={handleLocaleChange}
			disabled={isLoading}>
			<SelectTrigger className='w-[140px]'>
				<div className='flex items-center gap-2'>
					{isLoading ? <Loader2 className='w-4 h-4 animate-spin' /> : <Globe className='w-4 h-4' />}
					<SelectValue />
				</div>
			</SelectTrigger>
			<SelectContent className='z-[1000]'>
				{languages.map((language) => (
					<SelectItem
						key={language.code}
						value={language.code}>
						<div className='flex items-center gap-2'>
							<span>{language.flag}</span>
							<span>{language.name}</span>
						</div>
					</SelectItem>
				))}
			</SelectContent>
		</Select>
	);
};

export default LanguageSelector;
