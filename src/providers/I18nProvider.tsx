'use client';

import React, { useEffect, useState } from 'react';
import { NextIntlClientProvider } from 'next-intl';
import { LanguageProvider, useLanguage } from '@/contexts/LanguageContext';

// Import the messages
import enMessages from '../../messages/en.json';
import koMessages from '../../messages/ko.json';

const messages = {
	en: enMessages,
	ko: koMessages,
};

function I18nContent({ children }: { children: React.ReactNode }) {
	const { locale } = useLanguage();
	const [currentMessages, setCurrentMessages] = useState(messages.en);

	useEffect(() => {
		setCurrentMessages(messages[locale]);
	}, [locale]);

	return (
		<NextIntlClientProvider
			locale={locale}
			messages={currentMessages}
			timeZone='UTC'>
			{children}
		</NextIntlClientProvider>
	);
}

export function I18nProvider({ children }: { children: React.ReactNode }) {
	return (
		<LanguageProvider>
			<I18nContent>{children}</I18nContent>
		</LanguageProvider>
	);
}
