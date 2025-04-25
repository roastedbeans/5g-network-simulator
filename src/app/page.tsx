import Image from 'next/image';
import Link from 'next/link';

export default function Home() {
	return (
		<div className='grid min-h-screen items-center justify-items-center p-8 pb-20 gap-8 sm:p-20'>
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

			<main className='w-full max-w-4xl'>
				<div className='bg-white dark:bg-gray-800 shadow-md rounded-lg p-8 mb-10'>
					<div className='flex items-center justify-center mb-8'>
						<Image
							src='/5g-logo.svg'
							alt='5G Network Simulator'
							width={200}
							height={100}
							priority
							className='h-24 w-auto'
						/>
					</div>

					<h2 className='text-3xl font-bold mb-6 text-center'>5G Network Simulator</h2>

					<p className='text-lg mb-8 text-center'>
						A comprehensive visualization and simulation tool for 5G network architecture, protocols, and security
						mechanisms.
					</p>

					<div className='grid grid-cols-1 md:grid-cols-3 gap-6'>
						<FeatureCard
							title='Network Visualization'
							description='Interactive visualization of 5G network functions and their connections'
							icon='🌐'
						/>
						<FeatureCard
							title='Protocol Simulation'
							description='Simulate key 5G protocols including authentication and session establishment'
							icon='📊'
						/>
						<FeatureCard
							title='Security Analysis'
							description='Analyze and understand 5G security mechanisms and key hierarchies'
							icon='🔒'
						/>
					</div>

					<div className='mt-10 flex justify-center'>
						<Link
							href='/simulator'
							className='bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-8 rounded-lg transition duration-300'>
							Launch Simulator
						</Link>
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

			<footer className='w-full max-w-4xl py-6 text-center border-t'>
				<p className='text-sm text-gray-600'>
					5G Network Simulator &copy; {new Date().getFullYear()} - Built with Next.js
				</p>
			</footer>
		</div>
	);
}

function FeatureCard({ title, description, icon }: { title: string; description: string; icon: string }) {
	return (
		<div className='bg-gray-50 dark:bg-gray-700 p-6 rounded-lg shadow-sm'>
			<div className='text-4xl mb-4'>{icon}</div>
			<h3 className='font-bold text-lg mb-2'>{title}</h3>
			<p className='text-gray-600 dark:text-gray-300'>{description}</p>
		</div>
	);
}
