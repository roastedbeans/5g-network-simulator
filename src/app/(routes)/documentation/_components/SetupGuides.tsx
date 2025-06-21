'use client';
import React, { useState } from 'react';
import { Card, CardHeader, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Zap, Settings, Terminal, Clock, User, CheckCircle, Copy, ExternalLink, FileText, Play } from 'lucide-react';

const SetupGuides = () => {
	const [selectedTab, setSelectedTab] = useState('setup');
	const [activeSection, setActiveSection] = useState<string | null>(null);

	// Simple Code component for inline code
	const Code = ({ children, className = '' }: { children: React.ReactNode; className?: string }) => (
		<code className={`bg-muted px-2 py-1 rounded text-sm font-mono ${className}`}>{children}</code>
	);

	const automatedSetup = {
		id: 'automated',
		title: 'Automated Setup',
		icon: Zap,
		bestFor: 'First-time users, demos',
		description: 'One-command deployment for quick testing',
		steps: [
			'Clone repository',
			'Navigate to repository',
			'Install dependencies and run complete setup',
			'Deploy roaming (HPLMN and VPLMN)',
		],
		commands: [
			'git clone https://github.com/roastedbeans/open5gs-roaming.git',
			'cd open5gs-roaming',
			'./cli.sh setup-roaming',
			'./cli.sh deploy-roaming',
		],
	};

	const scripts = [
		{
			name: 'cli.sh',
			description: 'Main CLI interface for all Open5GS operations',
			category: 'Core',
			icon: Terminal,
			usage: './cli.sh [command] [options]',
			useCase: 'Primary interface for all 5G network operations - from initial setup to daily management',
			example: './cli.sh setup-roaming && ./cli.sh deploy-roaming',
			commands: [
				'setup-roaming - Complete automated k8s-roaming setup',
				'deploy-roaming - Deploy both HPLMN and VPLMN',
				'deploy-hplmn - Deploy HPLMN components',
				'deploy-vplmn - Deploy VPLMN components',
				'subscribers - Manage subscriber database',
				'get-status - Show Open5GS deployments status',
				'restart-pods - Restart pods in namespaces',
				'pull-images - Pull Open5GS Docker images',
				'generate-certs - Generate TLS certificates',
				'deploy-certs - Deploy certificates as K8s secrets',
				'coredns-rewrite - Configure CoreDNS rewrite rules',
				'deploy-webui - Deploy Open5GS WebUI',
				'deploy-networkui - Deploy NetworkUI',
				'clean-k8s - Clean Kubernetes resources',
				'clean-docker - Clean Docker resources',
				'version - Show CLI version',
			],
		},
		{
			name: 'subscribers.sh',
			description: 'Direct subscriber database management',
			category: 'Database',
			icon: User,
			usage: './subscribers.sh [command] [options]',
			useCase: 'Manage subscriber database directly - add test users, bulk operations, cleanup',
			example: './subscribers.sh add-range -s 001011234567891 -e 001011234567900',
			commands: [
				'add-range - Add subscribers in IMSI range',
				'add - Add single subscriber or bulk from starting IMSI',
				'delete-all - Delete all subscribers',
				'list - List all subscribers',
				'count - Count total subscribers',
			],
		},
		{
			name: 'setup-k8s-roaming.sh',
			description: 'Complete Kubernetes roaming setup with dependencies',
			category: 'Setup',
			icon: Settings,
			usage: './setup-k8s-roaming.sh [tag]',
			useCase: 'One-command setup for complete 5G roaming environment from scratch',
			example: './setup-k8s-roaming.sh v2.7.5',
			commands: [
				'Installs Docker CE and MicroK8s',
				'Pulls Open5GS images',
				'Generates TLS certificates',
				'Configures CoreDNS rewrite rules',
				'Sets up roaming environment',
			],
		},
		{
			name: 'install-dep.sh',
			description: 'Install system dependencies',
			category: 'Setup',
			icon: Settings,
			usage: './install-dep.sh',
			useCase: 'Install required system packages before setting up Open5GS',
			example: './install-dep.sh',
			commands: ['Install Docker CE', 'Install Git', 'Install GTP5G kernel module', 'Configure user permissions'],
		},
		{
			name: 'get-status.sh',
			description: 'Show detailed status of Open5GS deployments',
			category: 'Monitoring',
			icon: CheckCircle,
			usage: './get-status.sh [-n namespace] [-d]',
			useCase: 'Monitor deployment health, troubleshoot pod issues, verify service status',
			example: './get-status.sh -d',
			commands: [
				'-n namespace - Show status for specific namespace',
				'-d - Show detailed information (services, deployments)',
				'Default: Shows status for both hplmn and vplmn',
			],
		},
		{
			name: 'restart-pods.sh',
			description: 'Restart Kubernetes pods by namespace',
			category: 'Management',
			icon: Play,
			usage: './restart-pods.sh [options]',
			useCase: 'Restart pods when configuration changes or troubleshooting connectivity issues',
			example: './restart-pods.sh -H',
			commands: [
				'-a, --all - Restart all Open5GS pods',
				'-H, --hplmn - Restart HPLMN pods only',
				'-V, --vplmn - Restart VPLMN pods only',
				'-n namespace - Restart specific namespace',
				'-f, --force - Skip confirmation',
				'-t timeout - Wait timeout (default: 300s)',
			],
		},
		{
			name: 'pull-docker-images.sh',
			description: 'Pull Open5GS Docker images from registry',
			category: 'Docker Images',
			icon: Copy,
			usage: './pull-docker-images.sh [options]',
			useCase: 'Update to latest Open5GS images or pull specific versions for testing',
			example: './pull-docker-images.sh -v v2.7.5 --parallel',
			commands: [
				'-r registry - Docker registry (default: docker.io/vinch05)',
				'-v version - Image version (default: v2.7.5)',
				'--no-utilities - Skip utility images',
				'--parallel - Pull images in parallel',
				'-f, --force - Force pull even if images exist',
			],
		},
		{
			name: 'kubectl-deploy-hplmn.sh',
			description: 'Deploy HPLMN (Home PLMN) components',
			category: 'Deployment',
			icon: Zap,
			usage: './kubectl-deploy-hplmn.sh',
			useCase: 'Deploy home network components for subscriber authentication and management',
			example: './kubectl-deploy-hplmn.sh',
			commands: [
				'Deploy AMF, SMF, UPF, AUSF, UDM, UDR, NRF, SCP',
				'Deploy MongoDB for HPLMN',
				'Create necessary configmaps and secrets',
				'Wait for pods to be ready',
			],
		},
		{
			name: 'kubectl-deploy-vplmn.sh',
			description: 'Deploy VPLMN (Visited PLMN) components',
			category: 'Deployment',
			icon: Zap,
			usage: './kubectl-deploy-vplmn.sh',
			useCase: 'Deploy visited network components for roaming scenarios and inter-PLMN communication',
			example: './kubectl-deploy-vplmn.sh',
			commands: [
				'Deploy AMF, SMF, UPF, PCF, BSF, NSSF, SEPP',
				'Deploy MongoDB for VPLMN',
				'Create necessary configmaps and secrets',
				'Configure roaming interfaces',
			],
		},
		{
			name: 'kubectl-deploy-webui.sh',
			description: 'Deploy Open5GS WebUI for subscriber management',
			category: 'UI',
			icon: ExternalLink,
			usage: './kubectl-deploy-webui.sh',
			useCase: 'Access web interface for subscriber management and network configuration',
			example: './kubectl-deploy-webui.sh',
			commands: [
				'Deploy WebUI pod and service',
				'Expose via NodePort 30999',
				'Connect to HPLMN MongoDB',
				'Default credentials: admin/1423',
			],
		},
		{
			name: 'kubectl-deploy-networkui.sh',
			description: 'Deploy NetworkUI for network monitoring',
			category: 'UI',
			icon: ExternalLink,
			usage: './kubectl-deploy-networkui.sh',
			useCase: 'Monitor network topology and visualize 5G network function connections',
			example: './kubectl-deploy-networkui.sh',
			commands: [
				'Deploy NetworkUI pod and service',
				'Expose via NodePort 30998',
				'Connect to HPLMN MongoDB',
				'Monitor network functions and connections',
			],
		},
		{
			name: 'coredns-rewrite.sh',
			description: 'Configure CoreDNS rewrite rules for 3GPP names',
			category: 'DNS',
			icon: Settings,
			usage: './coredns-rewrite.sh [options]',
			useCase: 'Configure DNS resolution for 3GPP FQDN names in roaming scenarios',
			example: './coredns-rewrite.sh --dry-run',
			commands: [
				'--hplmn-mnc/mcc - HPLMN codes (default: 001/001)',
				'--vplmn-mnc/mcc - VPLMN codes (default: 070/999)',
				'--dry-run - Preview changes',
				'--backup-only - Create backup only',
				'--restore file - Restore from backup',
				'--status - Show current config',
				'--test - Test DNS resolution',
			],
		},
		{
			name: 'cert-deploy.sh',
			description: 'Deploy TLS certificates as Kubernetes secrets',
			category: 'Security',
			icon: CheckCircle,
			usage: './cert-deploy.sh',
			useCase: 'Deploy SEPP TLS certificates for secure inter-PLMN communication',
			example: './cert-deploy.sh',
			commands: [
				'Create namespaces (hplmn, vplmn)',
				'Deploy SEPP N32-C certificates',
				'Deploy SEPP N32-F certificates',
				'Deploy CA certificates',
				'Create TLS secrets for both namespaces',
			],
		},
		{
			name: 'copy-pcap.sh',
			description: 'Copy PCAP files from SEPP pods for analysis',
			category: 'Debug',
			icon: FileText,
			usage: './copy-pcap.sh [options]',
			useCase: 'Extract network traffic captures for protocol analysis and debugging',
			example: './copy-pcap.sh -n vplmn -o ./analysis',
			commands: [
				'-n namespace - Kubernetes namespace (default: vplmn)',
				'-c container - Container name (default: sniffer)',
				'-p path - PCAP file path (default: pcap/sepp.pcap)',
				'-o dir - Output directory (default: pcap-logs)',
				'Interactive pod selection',
				'Automatic container detection',
			],
		},
		{
			name: 'pcap-capture.sh',
			description: 'Extract PCAP files from SEPP pods (standalone)',
			category: 'Debug',
			icon: FileText,
			usage: './pcap-capture.sh',
			useCase: 'Simple PCAP extraction tool for quick network traffic analysis',
			example: './pcap-capture.sh',
			commands: [
				'Find SEPP pods in vplmn namespace',
				'Try sniffer container first',
				'Auto-detect available containers',
				'Copy to pcap-logs directory',
				'Show file size and location',
			],
		},
		{
			name: 'update.sh',
			description: 'Update deployment files for MicroK8s registry',
			category: 'Management',
			icon: Settings,
			usage: './update.sh',
			useCase: 'Modify deployment files to use local MicroK8s registry instead of external registry',
			example: './update.sh',
			commands: [
				'Create backups of original files',
				'Update image references to localhost:32000/',
				'Set imagePullPolicy to IfNotPresent',
				'Process both hplmn and vplmn directories',
				'Update Open5GS and utility images',
			],
		},
		{
			name: 'import.sh',
			description: 'Import Docker images to MicroK8s registry',
			category: 'Docker Images',
			icon: Copy,
			usage: './import.sh',
			useCase: 'Transfer Docker images from local Docker to MicroK8s registry for offline deployment',
			example: './import.sh',
			commands: [
				'Tag images for MicroK8s registry',
				'Push to localhost:32000',
				'Import Open5GS component images',
				'Import utility images (mongo, netshoot, etc.)',
			],
		},
		{
			name: 'docker-deploy.sh',
			description: 'Deploy using Docker Compose alternative',
			category: 'Deployment',
			icon: Zap,
			usage: './docker-deploy.sh',
			useCase: 'Quick local testing with Docker Compose instead of Kubernetes',
			example: './docker-deploy.sh',
			commands: [
				'Alternative to Kubernetes deployment',
				'Use Docker Compose for local testing',
				'Simpler setup for development',
				'Not recommended for production',
			],
		},
		{
			name: 'docker-clean.sh',
			description: 'Clean Docker images and containers',
			category: 'Cleanup',
			icon: Settings,
			usage: './docker-clean.sh',
			useCase: 'Free up disk space by removing unused Docker resources',
			example: './docker-clean.sh',
			commands: [
				'Remove stopped containers',
				'Remove dangling images',
				'Remove unused volumes',
				'Remove unused networks',
				'System prune with confirmation',
			],
		},
		{
			name: 'microk8s-clean.sh',
			description: 'Clean MicroK8s resources and cache',
			category: 'Cleanup',
			icon: Settings,
			usage: './microk8s-clean.sh',
			useCase: 'Clean up MicroK8s environment and reset to fresh state',
			example: './microk8s-clean.sh',
			commands: [
				'Remove Open5GS namespaces',
				'Clean unused images from registry',
				'Remove persistent volumes',
				'Clean system cache',
				'Reset MicroK8s if needed',
			],
		},
	];

	const copyToClipboard = (text: string) => {
		navigator.clipboard.writeText(text);
	};

	const navigateToSection = (category: string) => {
		setActiveSection(category);
		// Smooth scroll to the section
		setTimeout(() => {
			const element = document.getElementById(`section-${category}`);
			if (element) {
				element.scrollIntoView({ behavior: 'smooth', block: 'start' });
				// Add a subtle highlight effect
				element.style.transform = 'scale(1.01)';
				element.style.transition = 'transform 0.3s ease';
				setTimeout(() => {
					element.style.transform = 'scale(1)';
				}, 300);
			}
		}, 100);
	};

	const groupedScripts = scripts.reduce((acc, script) => {
		if (!acc[script.category]) {
			acc[script.category] = [];
		}
		acc[script.category].push(script);
		return acc;
	}, {} as Record<string, typeof scripts>);

	return (
		<div className='space-y-6 p-8'>
			<Tabs
				value={selectedTab}
				onValueChange={setSelectedTab}
				className='w-full'>
				<TabsList className='grid w-full grid-cols-2'>
					<TabsTrigger value='setup'>Setup Guide</TabsTrigger>
					<TabsTrigger value='scripts'>Scripts Reference</TabsTrigger>
				</TabsList>

				<TabsContent
					value='setup'
					className='space-y-6'>
					{/* Automated Setup */}
					<Card>
						<CardContent className='p-4 space-y-3'>
							<div className='flex items-center gap-3'>
								<automatedSetup.icon className='w-6 h-6 text-primary' />
								<h3 className='font-semibold'>{automatedSetup.title}</h3>
							</div>

							<p className='text-sm text-muted-foreground'>{automatedSetup.description}</p>

							<div className='flex gap-2 flex-wrap'>
								<Badge
									variant='secondary'
									className='flex items-center gap-1'>
									<Clock className='w-3 h-3' />
									{automatedSetup.bestFor}
								</Badge>
							</div>
						</CardContent>
					</Card>

					{/* Prerequisites */}
					<Card>
						<CardHeader>
							<h3 className='text-lg font-semibold'>Prerequisites</h3>
						</CardHeader>
						<CardContent className='space-y-3'>
							<div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
								<div>
									<h4 className='font-medium mb-2'>System Requirements</h4>
									<ul className='space-y-1 text-sm text-muted-foreground'>
										<li>• Ubuntu 22.04 LTS</li>
										<li>• Minimum 8GB RAM</li>
										<li>• 50GB storage</li>
										<li>• 4 CPU cores</li>
									</ul>
								</div>
								<div>
									<h4 className='font-medium mb-2'>Access Requirements</h4>
									<ul className='space-y-1 text-sm text-muted-foreground'>
										<li>• Root/sudo access</li>
										<li>• Internet connectivity</li>
										<li>• Docker Hub access</li>
									</ul>
								</div>
							</div>
						</CardContent>
					</Card>

					{/* Setup Details */}
					<Card>
						<CardHeader className='pb-3'>
							<div className='flex items-center gap-3'>
								<automatedSetup.icon className='w-6 h-6 text-primary' />
								<h3 className='text-xl font-semibold'>{automatedSetup.title}</h3>
							</div>
						</CardHeader>
						<CardContent className='space-y-6'>
							{/* Steps Overview */}
							<div>
								<h4 className='font-medium mb-3'>Steps Overview</h4>
								<div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3'>
									{automatedSetup.steps.map((step, index) => (
										<div
											key={index}
											className='flex items-center gap-3 p-3 rounded-lg bg-muted/50'>
											<div className='w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs font-bold flex items-center justify-center flex-shrink-0'>
												{index + 1}
											</div>
											<span className='text-sm'>{step}</span>
										</div>
									))}
								</div>
							</div>

							<Separator />

							{/* Commands */}
							<div>
								<h4 className='font-medium mb-3'>Commands</h4>
								<div className='space-y-3'>
									{automatedSetup.commands.map((command, index) => (
										<div
											key={index}
											className='space-y-2'>
											<div className='flex items-center gap-2'>
												<span className='text-sm font-medium text-muted-foreground'>Step {index + 1}:</span>
												<span className='text-sm text-muted-foreground'>{automatedSetup.steps[index]}</span>
											</div>
											<div className='flex items-center gap-2'>
												<Code className='flex-1 p-3 rounded-lg bg-muted'>{command}</Code>
												<Button
													size='sm'
													variant='outline'
													onClick={() => copyToClipboard(command)}>
													<Copy className='w-4 h-4' />
												</Button>
											</div>
										</div>
									))}
								</div>
							</div>

							<Separator />

							{/* CLI Capabilities */}
							<div>
								<h4 className='font-medium mb-3'>CLI Additional Capabilities</h4>
								<div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
									<div className='space-y-2'>
										<div className='flex items-center gap-2'>
											<CheckCircle className='w-4 h-4 text-green-600' />
											<span className='text-sm'>Subscriber management</span>
										</div>
										<div className='flex items-center gap-2'>
											<CheckCircle className='w-4 h-4 text-green-600' />
											<span className='text-sm'>Pod restart and monitoring</span>
										</div>
										<div className='flex items-center gap-2'>
											<CheckCircle className='w-4 h-4 text-green-600' />
											<span className='text-sm'>PCAP file management</span>
										</div>
									</div>
									<div className='space-y-2'>
										<div className='flex items-center gap-2'>
											<CheckCircle className='w-4 h-4 text-green-600' />
											<span className='text-sm'>WebUI deployment</span>
										</div>
										<div className='flex items-center gap-2'>
											<CheckCircle className='w-4 h-4 text-green-600' />
											<span className='text-sm'>Certificate management</span>
										</div>
										<div className='flex items-center gap-2'>
											<CheckCircle className='w-4 h-4 text-green-600' />
											<span className='text-sm'>Cleanup operations</span>
										</div>
									</div>
								</div>
								<div className='mt-3 p-3 bg-blue-50 rounded-lg border border-blue-200'>
									<p className='text-sm text-blue-700'>
										💡 Run <Code>./cli.sh help</Code> to see all available commands and options
									</p>
								</div>
							</div>

							{/* Verification */}
							<div>
								<h4 className='font-medium mb-3'>Verification</h4>
								<div className='space-y-2'>
									<div className='flex items-center gap-2'>
										<Code className='flex-1 p-3 rounded-lg bg-muted'>./cli.sh get-status</Code>
										<Button
											size='sm'
											variant='outline'
											onClick={() => copyToClipboard('./cli.sh get-status')}>
											<Copy className='w-4 h-4' />
										</Button>
									</div>
									<div className='flex items-center gap-2'>
										<Code className='flex-1 p-3 rounded-lg bg-muted'>./cli.sh get-status -d</Code>
										<Button
											size='sm'
											variant='outline'
											onClick={() => copyToClipboard('./cli.sh get-status -d')}>
											<Copy className='w-4 h-4' />
										</Button>
									</div>
									<div className='flex items-center gap-2'>
										<Code className='flex-1 p-3 rounded-lg bg-muted'>./cli.sh subscribers count</Code>
										<Button
											size='sm'
											variant='outline'
											onClick={() => copyToClipboard('./cli.sh subscribers count')}>
											<Copy className='w-4 h-4' />
										</Button>
									</div>
								</div>
							</div>
						</CardContent>
					</Card>

					{/* After Deployment */}
					<Card>
						<CardHeader>
							<h3 className='text-lg font-semibold'>After Deployment</h3>
						</CardHeader>
						<CardContent className='space-y-4'>
							<div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
								<div>
									<h4 className='font-medium mb-2'>Access Services</h4>
									<ul className='space-y-1 text-sm'>
										<li>• WebUI: http://NODE_IP:30999</li>
										<li>• NetworkUI: http://NODE_IP:30998</li>
										<li>• MongoDB: NODE_IP:30017</li>
									</ul>
								</div>
								<div>
									<h4 className='font-medium mb-2'>Quick Status Check</h4>
									<Code className='text-xs mb-1'>./cli.sh get-status</Code>
									<p className='text-xs text-muted-foreground'>Check all pods status</p>
								</div>
								<div>
									<h4 className='font-medium mb-2'>Subscriber Count</h4>
									<Code className='text-xs mb-1'>./cli.sh subscribers count</Code>
									<p className='text-xs text-muted-foreground'>View total subscribers</p>
								</div>
							</div>

							<Separator />

							<div className='flex gap-2 flex-wrap'>
								<Button
									variant='outline'
									size='sm'
									className='flex items-center gap-2'>
									<ExternalLink className='w-4 h-4' />
									Troubleshooting Guide
								</Button>
								<Button
									variant='outline'
									size='sm'
									className='flex items-center gap-2'>
									<ExternalLink className='w-4 h-4' />
									Scripts Reference
								</Button>
								<Button
									variant='outline'
									size='sm'
									className='flex items-center gap-2'>
									<ExternalLink className='w-4 h-4' />
									Kubernetes Guide
								</Button>
								<Button
									variant='outline'
									size='sm'
									className='flex items-center gap-2'>
									<Terminal className='w-4 h-4' />
									CLI Command Reference
								</Button>
							</div>
						</CardContent>
					</Card>
				</TabsContent>

				<TabsContent
					value='scripts'
					className='space-y-6'>
					{/* Scripts Overview */}
					<Card id='scripts-overview'>
						<CardHeader>
							<div className='flex items-center gap-3'>
								<Terminal className='w-6 h-6 text-primary' />
								<h3 className='text-xl font-semibold'>Available Scripts</h3>
							</div>
						</CardHeader>
						<CardContent>
							<p className='text-muted-foreground mb-4'>
								The Open5GS deployment includes {scripts.length} scripts organized by category. Most operations can be
								performed through the main CLI interface (cli.sh), but individual scripts are also available for direct
								use.
							</p>
							<div className='grid grid-cols-2 md:grid-cols-4 gap-4'>
								{Object.keys(groupedScripts).map((category) => (
									<Button
										key={category}
										variant='ghost'
										onClick={() => navigateToSection(category)}
										className={`flex flex-col gap-0 text-center h-fit p-4 cursor-pointer transition-all duration-200`}>
										<h4
											className={`font-medium text-sm ${
												activeSection === category ? 'text-primary' : 'text-foreground'
											}`}>
											{category}
										</h4>
										<p
											className={`text-xs ${activeSection === category ? 'text-primary/80' : 'text-muted-foreground'}`}>
											{groupedScripts[category].length} scripts
										</p>
										<div className='mt-2 flex justify-center'>
											<span
												className={`text-xs ${
													activeSection === category ? 'text-primary/60' : 'text-muted-foreground'
												}`}>
												Click to navigate →
											</span>
										</div>
									</Button>
								))}
							</div>
						</CardContent>
					</Card>

					{/* Scripts by Category */}
					{Object.entries(groupedScripts).map(([category, categoryScripts]) => (
						<Card
							key={category}
							id={`section-${category}`}>
							<CardHeader>
								<div className='flex items-center justify-between'>
									<h3 className='text-lg font-semibold'>{category} Scripts</h3>
									<div className='flex items-center gap-3'>
										<span className='text-xs text-muted-foreground'>
											{categoryScripts.length} script{categoryScripts.length !== 1 ? 's' : ''}
										</span>
										{activeSection === category && (
											<div className='flex items-center gap-2'>
												<div className='w-2 h-2 bg-primary rounded-full animate-pulse'></div>
												<Button
													size='sm'
													variant='outline'
													onClick={() => {
														setActiveSection(null);
														document.getElementById('scripts-overview')?.scrollIntoView({
															behavior: 'smooth',
															block: 'start',
														});
													}}>
													Back to Overview
												</Button>
											</div>
										)}
									</div>
								</div>
							</CardHeader>
							<CardContent className='space-y-4'>
								{categoryScripts.map((script) => {
									const Icon = script.icon;
									return (
										<div
											key={script.name}
											className='border rounded-lg p-4 space-y-3'>
											<div className='flex items-start gap-3'>
												<Icon className='w-5 h-5 text-primary mt-1 flex-shrink-0' />
												<div className='flex-1 space-y-2'>
													<div className='flex items-center gap-2'>
														<h4 className='font-medium'>{script.name}</h4>
														<Badge variant='default'>{script.category}</Badge>
													</div>
													<p className='text-sm text-muted-foreground'>{script.description}</p>

													{/* Use Case */}
													<div className='p-2 bg-blue-50 rounded-lg border-l-2 border-blue-200'>
														<p className='text-xs font-medium text-blue-700 mb-1'>Use Case:</p>
														<p className='text-xs text-blue-600'>{script.useCase}</p>
													</div>

													{/* Usage */}
													<div className='flex items-center gap-2'>
														<span className='text-xs font-medium text-muted-foreground'>Usage:</span>
														<Code className='text-xs bg-muted px-2 py-1 rounded'>{script.usage}</Code>
														<Button
															size='sm'
															variant='outline'
															onClick={() => copyToClipboard(script.usage)}>
															<Copy className='w-3 h-3' />
														</Button>
													</div>

													{/* Example */}
													<div className='flex items-center gap-2'>
														<span className='text-xs font-medium text-muted-foreground'>Example:</span>
														<Code className='text-xs bg-green-100 px-2 py-1 rounded text-green-800'>
															{script.example}
														</Code>
														<Button
															size='sm'
															variant='outline'
															onClick={() => copyToClipboard(script.example)}>
															<Copy className='w-3 h-3' />
														</Button>
													</div>
												</div>
											</div>

											<div className='space-y-1'>
												<h5 className='text-sm font-medium'>Available Commands/Options:</h5>
												<div className='grid grid-cols-1 md:grid-cols-2 gap-1'>
													{script.commands.map((command, index) => (
														<div
															key={index}
															className='text-xs text-muted-foreground flex items-start gap-1'>
															<span className='text-primary'>•</span>
															<span>{command}</span>
														</div>
													))}
												</div>
											</div>
										</div>
									);
								})}
							</CardContent>
						</Card>
					))}

					{/* Quick Reference */}
					<Card>
						<CardHeader>
							<h3 className='text-lg font-semibold'>Quick Reference</h3>
						</CardHeader>
						<CardContent className='space-y-4'>
							<div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
								<div className='p-3 rounded-lg bg-green-50 border-l-4 border-green-500'>
									<h5 className='font-medium text-sm text-green-700 mb-2'>Most Common Commands</h5>
									<div className='space-y-1 text-xs text-green-600'>
										<div>
											<Code className='text-xs'>./cli.sh setup-roaming</Code> - Full setup
										</div>
										<div>
											<Code className='text-xs'>./cli.sh get-status</Code> - Check status
										</div>
										<div>
											<Code className='text-xs'>./cli.sh subscribers add-range</Code> - Add subscribers
										</div>
										<div>
											<Code className='text-xs'>./cli.sh restart-pods -a</Code> - Restart all pods
										</div>
									</div>
								</div>
								<div className='p-3 rounded-lg bg-blue-50 border-l-4 border-blue-500'>
									<h5 className='font-medium text-sm text-blue-700 mb-2'>Direct Script Access</h5>
									<div className='space-y-1 text-xs text-blue-600'>
										<div>
											All scripts are in <Code className='text-xs'>./scripts/</Code> directory
										</div>
										<div>
											Make scripts executable: <Code className='text-xs'>chmod +x *.sh</Code>
										</div>
										<div>
											View help: <Code className='text-xs'>./script.sh --help</Code>
										</div>
										<div>Use CLI wrapper for most operations</div>
									</div>
								</div>
							</div>
						</CardContent>
					</Card>
				</TabsContent>
			</Tabs>
		</div>
	);
};

export default SetupGuides;
