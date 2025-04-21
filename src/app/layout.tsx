import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
	title: '5G Network Simulator',
	description: 'Visualize and simulate 5G network architecture, protocols, and security mechanisms',
};

export default function RootLayout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	return (
		<html lang='en'>
			<body className='bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100'>{children}</body>
		</html>
	);
}
