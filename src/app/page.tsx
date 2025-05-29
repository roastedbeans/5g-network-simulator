import Image from 'next/image';
import Link from 'next/link';

export default function Home() {
	return (
		<div className='min-h-screen max-w-6xl w-full flex flex-col mx-auto items-start justify-between p-8'>
			<header className='w-full py-4 flex justify-between items-center'>
				<h1 className='text-2xl font-bold'>5G Network Simulator</h1>
				<nav>
					<ul className='flex space-x-4'>
						<li>
							<Link
								href='/simulator'
								className='text-blue-600 hover:underline'>
								Simulator
							</Link>
						</li>
						<li>
							<Link
								href='/'
								className='text-blue-600 hover:underline'>
								Documentation
							</Link>
						</li>
					</ul>
				</nav>
			</header>

			<main className='w-full'>
				<div className='bg-white dark:bg-gray-800 shadow-md rounded-lg p-8 mb-10'>
					<h2 className='text-3xl font-bold mb-6 text-center'>5G Network Simulator</h2>

					<p className='text-lg mb-8 text-center'>
						A comprehensive visualization and simulation tool for 5G network architecture, protocols, and security
						mechanisms.
					</p>

					<div className='flex gap-6 w-full'>
						<FeatureCard
							title='Network Visualization'
							description='Interactive visualization of 5G network functions and their connections'
							icon='🌐'
							link='/simulator'
						/>
						<FeatureCard
							title='Subscriber Registration'
							description='Manage subscribers registration on home PLMN'
							icon='👤'
							link='/subscribers'
						/>
					</div>
				</div>

				<div className='mt-12 text-center'>
					<h2 className='text-2xl font-bold mb-6'>About the Project</h2>
					<p className='mb-4'>
						This 5G Network Simulator provides an interactive learning environment to understand the complex
						architecture and protocols of 5G networks. It is designed for educational purposes and can be used by
						students, researchers, and professionals.
					</p>
					<p>
						The simulator visualizes the interactions between different network functions such as AMF, SMF, UPF, AUSF,
						UDM, and more, allowing users to observe message flows and protocol exchanges in real-time.
					</p>
				</div>
			</main>

			<footer className='w-full text-center border-t'>
				<p className='text-sm text-gray-600'>
					5G Network Simulator &copy; {new Date().getFullYear()} - Built with Next.js
				</p>
			</footer>
		</div>
	);
}

function FeatureCard({
	title,
	description,
	icon,
	link,
}: {
	title: string;
	description: string;
	icon: string;
	link: string;
}) {
	return (
		<Link
			href={link}
			className='bg-gray-50 hover:bg-gray-100 dark:bg-gray-700 p-6 rounded-lg shadow-sm w-full'>
			<div className='text-4xl mb-4'>{icon}</div>
			<h3 className='font-bold text-lg mb-2'>{title}</h3>
			<p className='text-gray-600 dark:text-gray-300'>{description}</p>
		</Link>
	);
}
