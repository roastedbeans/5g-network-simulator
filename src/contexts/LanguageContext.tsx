'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';

type Locale = 'en' | 'ko';

interface LanguageContextType {
	locale: Locale;
	setLocale: (locale: Locale) => void;
	isLoading: boolean;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
	const [locale, setLocaleState] = useState<Locale>('en');
	const [isLoading, setIsLoading] = useState(false);

	// Initialize locale from localStorage or default to 'en'
	useEffect(() => {
		const savedLocale = localStorage.getItem('locale') as Locale;
		if (savedLocale && (savedLocale === 'en' || savedLocale === 'ko')) {
			setLocaleState(savedLocale);
		}
	}, []);

	const setLocale = (newLocale: Locale) => {
		setIsLoading(true);
		setLocaleState(newLocale);
		localStorage.setItem('locale', newLocale);

		// Simulate loading time for smooth transition
		setTimeout(() => {
			setIsLoading(false);
		}, 200);
	};

	return <LanguageContext.Provider value={{ locale, setLocale, isLoading }}>{children}</LanguageContext.Provider>;
}

export function useLanguage() {
	const context = useContext(LanguageContext);
	if (context === undefined) {
		throw new Error('useLanguage must be used within a LanguageProvider');
	}
	return context;
}
