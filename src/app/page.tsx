import Link from 'next/link';

export default function Home() {
	return (
		<div className='min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800'>
			<section className='max-w-6xl mx-auto px-4 py-16'>
				<div className='text-center mb-16'>
					<h1 className='text-5xl font-bold mb-6 bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent'>
						5G Network Setup Guide
					</h1>
					<p className='text-xl text-gray-600 dark:text-gray-300 mb-8 max-w-3xl mx-auto'>
						Cloud-native 5G network platform powered by Open5GS on Kubernetes. Complete setup documentation and UE
						registration for global roaming scenarios in a production-ready environment.
					</p>
					<div className='flex gap-4 justify-center'>
						<Link
							href='/documentation'
							className='bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-lg font-semibold transition-colors'>
							Setup Documentation
						</Link>
						<Link
							href='/subscribers'
							className='border border-blue-600 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 px-8 py-3 rounded-lg font-semibold transition-colors'>
							UE Registration
						</Link>
					</div>
				</div>

				{/* Architecture Overview */}
				<div className='bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 mb-16'>
					<h2 className='text-3xl font-bold mb-8 text-center'>Platform Architecture</h2>
					<div className='grid md:grid-cols-3 gap-8'>
						<ArchitectureCard
							title='Open5GS Core'
							description='Full 5G SA core network implementation with AMF, SMF, UPF, AUSF, UDM, and more'
							features={['Cloud-native deployment', 'Microservices architecture', 'RESTful APIs']}
						/>
						<ArchitectureCard
							title='Kubernetes Platform'
							description='Container orchestration with auto-scaling, service mesh, and high availability'
							features={['MicroK8s integration', 'Pod auto-scaling', 'Service discovery']}
						/>
						<ArchitectureCard
							title='Global Roaming'
							description='Multi-PLMN scenarios with home and visited network configurations'
							features={['VPLMN registration', 'Roaming agreements', 'Network slicing']}
						/>
					</div>
				</div>

				{/* Main Features */}
				<div className='grid md:grid-cols-2 gap-8 mb-16'>
					<FeatureCard
						title='Setup Documentation'
						description='Comprehensive guides for installation, configuration, and deployment of Open5GS on Kubernetes'
						link='/documentation'
						highlights={['Installation guides', 'Configuration examples', 'Best practices']}
					/>
					<FeatureCard
						title='UE Registration'
						description='Register and manage User Equipment on home VPLMN for global roaming scenarios'
						link='/subscribers'
						highlights={['Bulk registration', 'IMSI management', 'Subscription profiles']}
					/>
				</div>

				{/* Setup Process */}
				<div className='bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8'>
					<h2 className='text-3xl font-bold mb-8 text-center'>Setup Process</h2>
					<div className='grid md:grid-cols-2 gap-8'>
						<SetupCard
							title='Environment Preparation'
							description='Prepare your Kubernetes environment and install required dependencies'
							steps={[
								'Install MicroK8s or Kubernetes cluster',
								'Configure container runtime',
								'Set up persistent storage',
								'Enable required add-ons',
							]}
						/>
						<SetupCard
							title='Open5GS Deployment'
							description='Deploy and configure Open5GS network functions on Kubernetes'
							steps={[
								'Deploy MongoDB for data persistence',
								'Configure network function services',
								'Set up service mesh networking',
								'Validate network function connectivity',
							]}
						/>
						<SetupCard
							title='Network Configuration'
							description='Configure network interfaces and establish PLMN connectivity'
							steps={[
								'Configure home PLMN settings',
								'Set up visited PLMN parameters',
								'Configure roaming agreements',
								'Test network connectivity',
							]}
						/>
						<SetupCard
							title='UE Registration'
							description='Register user equipment for testing roaming scenarios'
							steps={[
								'Create subscriber profiles',
								'Configure authentication keys',
								'Set up QoS parameters',
								'Validate registration process',
							]}
						/>
					</div>
				</div>
			</section>

			{/* Footer */}
			<footer className='bg-gray-900 text-white py-12'>
				<div className='max-w-6xl mx-auto px-4 text-center'>
					<h3 className='text-2xl font-bold mb-4'>5G Network Setup Guide</h3>
					<p className='text-gray-400 mb-4'>
						Cloud-native 5G platform setup for next-generation network deployment and testing
					</p>
					<p className='text-sm text-gray-500'>
						&copy; {new Date().getFullYear()} 5G Network Setup Guide. Built with Next.js, Open5GS, and Kubernetes.
					</p>
				</div>
			</footer>
		</div>
	);
}

function ArchitectureCard({
	title,
	description,
	features,
}: {
	title: string;
	description: string;
	features: string[];
}) {
	return (
		<div className='text-center'>
			<h3 className='font-bold text-xl mb-3'>{title}</h3>
			<p className='text-gray-600 dark:text-gray-300 mb-4'>{description}</p>
			<ul className='text-sm text-gray-500 dark:text-gray-400'>
				{features.map((feature, index) => (
					<li
						key={index}
						className='mb-1'>
						• {feature}
					</li>
				))}
			</ul>
		</div>
	);
}

function FeatureCard({
	title,
	description,
	link,
	highlights,
}: {
	title: string;
	description: string;
	link: string;
	highlights: string[];
}) {
	return (
		<Link
			href={link}
			className='bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 group'>
			<h3 className='font-bold text-xl mb-3 text-gray-900 dark:text-white'>{title}</h3>
			<p className='text-gray-600 dark:text-gray-300 mb-4'>{description}</p>
			<ul className='text-sm text-blue-600 dark:text-blue-400'>
				{highlights.map((highlight, index) => (
					<li
						key={index}
						className='mb-1'>
						✓ {highlight}
					</li>
				))}
			</ul>
		</Link>
	);
}

function TechSpec({ title, items }: { title: string; items: string[] }) {
	return (
		<div>
			<h3 className='font-bold text-lg mb-3'>{title}</h3>
			<ul className='text-sm opacity-90'>
				{items.map((item, index) => (
					<li
						key={index}
						className='mb-1'>
						• {item}
					</li>
				))}
			</ul>
		</div>
	);
}

function SetupCard({ title, description, steps }: { title: string; description: string; steps: string[] }) {
	return (
		<div className='border border-gray-200 dark:border-gray-700 rounded-lg p-6'>
			<h3 className='font-bold text-lg mb-3 text-gray-900 dark:text-white'>{title}</h3>
			<p className='text-gray-600 dark:text-gray-300 mb-4'>{description}</p>
			<ul className='text-sm text-gray-500 dark:text-gray-400'>
				{steps.map((step, index) => (
					<li
						key={index}
						className='mb-2 flex items-start'>
						<span className='text-blue-500 mr-2'>{index + 1}.</span>
						{step}
					</li>
				))}
			</ul>
		</div>
	);
}
