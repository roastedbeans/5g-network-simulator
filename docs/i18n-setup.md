# Internationalization (i18n) Setup

This document describes the internationalization setup for the 5G Network Simulator using Next.js 15 App Router and next-intl.

## Overview

The application supports multiple languages with the following configuration:

- **English (en)** - Default locale
- **Korean (ko)** - Secondary locale

## Architecture

### Directory Structure

```
src/
├── app/
│   ├── [locale]/                 # Locale-specific routes
│   │   ├── layout.tsx           # Locale layout with NextIntlClientProvider
│   │   ├── page.tsx             # Home page
│   │   └── (routes)/            # Protected routes
│   │       ├── documentation/
│   │       ├── simulator/
│   │       └── subscribers/
│   ├── page.tsx                 # Root redirect to /en
│   ├── layout.tsx               # Root layout (inactive with locale routing)
│   └── globals.css
├── i18n/
│   ├── routing.ts               # Routing configuration
│   └── request.ts               # Request configuration
├── middleware.ts                # Next.js middleware for locale handling
└── components/
    └── ui/
        ├── LanguageSelector.tsx # Language switching component
        └── NavigationBar.tsx    # Updated navigation with i18n
```

### Translation Files

```
messages/
├── en.json                      # English translations
└── ko.json                      # Korean translations
```

## Implementation Details

### 1. Next.js Configuration

The `next.config.ts` file includes the next-intl plugin:

```typescript
import createNextIntlPlugin from 'next-intl/plugin';
import type { NextConfig } from 'next';

const withNextIntl = createNextIntlPlugin('./src/i18n/request.ts');

const nextConfig: NextConfig = {
	/* config options here */
};

export default withNextIntl(nextConfig);
```

### 2. Middleware

The middleware handles locale detection and routing:

```typescript
import createMiddleware from 'next-intl/middleware';
import { routing } from './i18n/routing';

export default createMiddleware(routing);

export const config = {
	matcher: ['/', '/(ko|en)/:path*'],
};
```

### 3. Routing Configuration

```typescript
import { defineRouting } from 'next-intl/routing';

export const routing = defineRouting({
	locales: ['en', 'ko'],
	defaultLocale: 'en',
	pathnames: {
		'/': '/',
		'/simulator': {
			en: '/simulator',
			ko: '/시뮬레이터',
		},
		'/documentation': {
			en: '/documentation',
			ko: '/문서',
		},
		'/subscribers': {
			en: '/subscribers',
			ko: '/가입자',
		},
	},
});
```

### 4. Component Usage

Components use the `useTranslations` hook:

```typescript
import { useTranslations } from 'next-intl';

const SetupGuides = () => {
	const t = useTranslations('setupGuides');

	return (
		<div>
			<h1>{t('title')}</h1>
			<p>{t('description')}</p>
		</div>
	);
};
```

### 5. Language Selector

The `LanguageSelector` component allows users to switch languages:

```typescript
const handleLocaleChange = (newLocale: string) => {
	const pathnameWithoutLocale = pathname.replace(`/${locale}`, '') || '/';
	router.push(`/${newLocale}${pathnameWithoutLocale}`);
};
```

## URL Structure

### English (Default)

- Home: `/en/`
- Simulator: `/en/simulator`
- Documentation: `/en/documentation`
- Subscribers: `/en/subscribers`

### Korean

- Home: `/ko/`
- Simulator: `/ko/시뮬레이터`
- Documentation: `/ko/문서`
- Subscribers: `/ko/가입자`

## Translation Management

### Adding New Translations

1. Add the key-value pair to both `messages/en.json` and `messages/ko.json`
2. Use the translation in components with `useTranslations`

### Translation Structure

```json
{
	"setupGuides": {
		"title": "Setup Guides",
		"automatedSetup": {
			"title": "Automated Setup",
			"description": "One-command deployment for quick testing"
		}
	},
	"navigation": {
		"home": "Home",
		"simulator": "Simulator"
	}
}
```

### Interpolation

For dynamic content, use interpolation:

```json
{
	"scripts": {
		"overview": "The deployment includes {count} scripts"
	}
}
```

```typescript
t('scripts.overview', { count: scripts.length });
```

## Development

### Running the Application

```bash
npm run dev
```

The application will be available at:

- English: http://localhost:3000/en
- Korean: http://localhost:3000/ko

### Building for Production

```bash
npm run build
```

## Best Practices

1. **Namespace Organization**: Group related translations under namespaces (e.g., `setupGuides`, `navigation`)
2. **Consistent Keys**: Use descriptive, hierarchical keys
3. **Component Isolation**: Each component should use its own translation namespace
4. **Fallback Handling**: Always provide English translations as fallbacks
5. **Dynamic Content**: Use interpolation for dynamic values
6. **Locale-Aware Links**: Use locale-aware navigation in the NavigationBar

## Troubleshooting

### Common Issues

1. **Missing Translations**: Ensure all keys exist in both language files
2. **Routing Issues**: Check middleware configuration and locale patterns
3. **Type Safety**: Use TypeScript for translation key autocomplete
4. **Hydration Errors**: Ensure server and client locales match

### Debug Mode

Add debugging to see translation resolution:

```typescript
const t = useTranslations('setupGuides');
console.log('Current locale:', useLocale());
```

## Future Enhancements

1. **Additional Languages**: Add support for more languages by extending the `locales` array
2. **RTL Support**: Implement right-to-left language support
3. **Translation Management**: Integrate with translation management services
4. **Date/Number Formatting**: Add locale-specific formatting for dates and numbers
5. **Pluralization**: Implement proper pluralization rules for each language
