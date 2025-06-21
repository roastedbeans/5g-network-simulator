import type { Metadata } from 'next';
import './globals.css';
import NavigationBar from '@/components/ui/NavigationBar';
import { I18nProvider } from '@/providers/I18nProvider';

export const metadata: Metadata = {
	title: 'Roaming UI',
	description: 'Open5gs Roaming setup guide and UE egistration UI',
};

export default function RootLayout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	return (
		<html lang='en'>
			<body className='bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100'>
				<I18nProvider>
					<div className='sticky top-0 z-[999] w-full'>
						<NavigationBar />
					</div>
					{children}
				</I18nProvider>
			</body>
		</html>
	);
}
