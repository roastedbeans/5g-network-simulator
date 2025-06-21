'use client';
import { RefreshCw, Plus, X, Users, Eye } from 'lucide-react';
import React, { useState } from 'react';
import { Subscriber } from '@/services/subscriber-service';
import { Card, CardHeader, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Separator } from '@/components/ui/separator';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';

interface BulkSubscriberFormProps {
	isOpen: boolean;
	onClose: () => void;
	onSuccess: () => void;
}

interface BulkCreateData {
	startImsi: string;
	count: number;
	templateData: Partial<Subscriber>;
	incrementMsisdn: boolean;
	startMsisdn?: string;
}

const BulkSubscriberForm = ({ isOpen, onClose, onSuccess }: BulkSubscriberFormProps) => {
	const [bulkData, setBulkData] = useState<BulkCreateData>({
		startImsi: '',
		count: 10,
		incrementMsisdn: false,
		startMsisdn: '',
		templateData: {
			k: '465B5CE8B199B49FAA5F0A2EE238A6BC',
			opc: 'E8ED289DEBA952E4283B54E88E6183CA',
			amf: '8000',
			sqn: '000000000000',
			status: 'active',
			subscriber_status: 0,
			operator_determined_barring: 0,
			slice: [
				{
					sst: 1,
					sd: '',
					default_indicator: true,
					session: [
						{
							name: 'internet',
							type: 2, // IPv4v6
							pcc_rule: [],
							ambr: {
								uplink: { value: 1, unit: 'Gbps' },
								downlink: { value: 1, unit: 'Gbps' },
							},
							qos: {
								index: 9,
								arp: {
									priority_level: 8,
									pre_emption_capability: 0,
									pre_emption_vulnerability: 0,
								},
							},
						},
					],
				},
			],
		},
	});

	const [loading, setLoading] = useState(false);
	const [preview, setPreview] = useState<{ startImsi: string; endImsi: string; imsiList: string[] }>({
		startImsi: '',
		endImsi: '',
		imsiList: [],
	});
	const [showPreview, setShowPreview] = useState(false);
	const [successMessage, setSuccessMessage] = useState<string | null>(null);
	const [error, setError] = useState<string | null>(null);

	// Helper function to add a new slice
	const addSlice = () => {
		const newSlice = {
			sst: 1,
			sd: '',
			default_indicator: true,
			session: [],
		};

		setBulkData((prev) => ({
			...prev,
			templateData: {
				...prev.templateData,
				slice: [...(prev.templateData.slice || []), newSlice],
			},
		}));
	};

	// Helper function to remove a slice
	const removeSlice = (index: number) => {
		setBulkData((prev) => ({
			...prev,
			templateData: {
				...prev.templateData,
				slice: prev.templateData.slice?.filter((_, i) => i !== index) || [],
			},
		}));
	};

	// Helper function to update slice
	const updateSlice = (index: number, field: string, value: any) => {
		setBulkData((prev) => ({
			...prev,
			templateData: {
				...prev.templateData,
				slice: prev.templateData.slice?.map((slice, i) => (i === index ? { ...slice, [field]: value } : slice)) || [],
			},
		}));
	};

	// Helper function to add a session to a slice
	const addSession = (sliceIndex: number) => {
		const newSession = {
			name: 'internet',
			type: 2, // IPv4v6
			pcc_rule: [],
			ambr: {
				uplink: { value: 1, unit: 'Gbps' },
				downlink: { value: 1, unit: 'Gbps' },
			},
			qos: {
				index: 9,
				arp: {
					priority_level: 8,
					pre_emption_capability: 0,
					pre_emption_vulnerability: 0,
				},
			},
		};

		setBulkData((prev) => ({
			...prev,
			templateData: {
				...prev.templateData,
				slice:
					prev.templateData.slice?.map((slice, i) =>
						i === sliceIndex ? { ...slice, session: [...(slice.session || []), newSession] } : slice
					) || [],
			},
		}));
	};

	// Helper function to remove a session
	const removeSession = (sliceIndex: number, sessionIndex: number) => {
		setBulkData((prev) => ({
			...prev,
			templateData: {
				...prev.templateData,
				slice:
					prev.templateData.slice?.map((slice, i) =>
						i === sliceIndex ? { ...slice, session: slice.session?.filter((_, j) => j !== sessionIndex) || [] } : slice
					) || [],
			},
		}));
	};

	// Helper function to update session
	const updateSession = (sliceIndex: number, sessionIndex: number, field: string, value: any) => {
		setBulkData((prev) => ({
			...prev,
			templateData: {
				...prev.templateData,
				slice:
					prev.templateData.slice?.map((slice, i) =>
						i === sliceIndex
							? {
									...slice,
									session:
										slice.session?.map((session, j) =>
											j === sessionIndex ? { ...session, [field]: value } : session
										) || [],
							  }
							: slice
					) || [],
			},
		}));
	};

	// Helper function to update nested session fields
	const updateSessionNested = (
		sliceIndex: number,
		sessionIndex: number,
		parentField: string,
		field: string,
		value: any
	) => {
		setBulkData((prev) => ({
			...prev,
			templateData: {
				...prev.templateData,
				slice:
					prev.templateData.slice?.map((slice, i) =>
						i === sliceIndex
							? {
									...slice,
									session:
										slice.session?.map((session, j) =>
											j === sessionIndex
												? {
														...session,
														[parentField]: {
															...(session[parentField as keyof typeof session] as any),
															[field]: value,
														},
												  }
												: session
										) || [],
							  }
							: slice
					) || [],
			},
		}));
	};

	// Generate preview of IMSIs to be created
	const generatePreview = () => {
		if (!bulkData.startImsi || !bulkData.count || bulkData.count <= 0) return;

		setShowPreview(!showPreview);

		try {
			const startImsi = BigInt(bulkData.startImsi);
			const imsiList: string[] = [];

			for (let i = 0; i < Math.min(bulkData.count, 10); i++) {
				// Show max 10 in preview, preserve leading zeros by padding to 15 digits
				imsiList.push((startImsi + BigInt(i)).toString().padStart(15, '0'));
			}

			// Preserve leading zeros by padding to 15 digits
			const endImsi = (startImsi + BigInt(bulkData.count - 1)).toString().padStart(15, '0');

			setPreview({
				startImsi: bulkData.startImsi,
				endImsi,
				imsiList,
			});
		} catch (error) {
			setError('Invalid start IMSI format');
		}
	};

	const handleSubmit = async () => {
		setLoading(true);
		setError(null);
		setSuccessMessage(null);

		try {
			console.log('Starting bulk submission with data:', bulkData);

			// Validate inputs
			if (!bulkData.startImsi || !bulkData.count) {
				throw new Error('Start IMSI and count are required');
			}

			if (bulkData.count > 1000) {
				throw new Error('Cannot process more than 1000 subscribers at once');
			}

			if (!/^\d{15}$/.test(bulkData.startImsi)) {
				throw new Error('Start IMSI must be exactly 15 digits');
			}

			if (bulkData.incrementMsisdn && bulkData.startMsisdn && !/^\d+$/.test(bulkData.startMsisdn)) {
				throw new Error('Start MSISDN must contain only digits');
			}

			// Calculate end IMSI, preserve leading zeros by padding to 15 digits
			const startImsi = BigInt(bulkData.startImsi);
			const endImsi = (startImsi + BigInt(bulkData.count - 1)).toString().padStart(15, '0');

			console.log('Calculated IMSI range:', { startImsi: bulkData.startImsi, endImsi, count: bulkData.count });

			// Prepare API payload
			const payload: any = {
				imsi_start: bulkData.startImsi,
				imsi_end: endImsi,
				k: bulkData.templateData.k || '465B5CE8B199B49FAA5F0A2EE238A6BC',
				opc: bulkData.templateData.opc || 'E8ED289DEBA952E4283B54E88E6183CA',
				amf: bulkData.templateData.amf || '8000',
				sqn: bulkData.templateData.sqn || '000000000000',
				status: bulkData.templateData.status || 'active',
				subscriber_status: bulkData.templateData.subscriber_status || 0,
				operator_determined_barring: bulkData.templateData.operator_determined_barring || 0,
				slice: bulkData.templateData.slice || [],
			};

			// Only include msisdn_start if incrementMsisdn is enabled and startMsisdn is provided
			if (bulkData.incrementMsisdn && bulkData.startMsisdn && bulkData.startMsisdn.trim()) {
				payload.msisdn_start = bulkData.startMsisdn.trim();
			}

			console.log('Sending payload to API:', JSON.stringify(payload, null, 2));

			const response = await fetch('/api/subscribers/batch', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify(payload),
			});

			console.log('API response status:', response.status);

			if (!response.ok) {
				const errorData = await response.json();
				console.error('API error response:', errorData);
				throw new Error(errorData.error || 'Failed to process subscribers');
			}

			const result = await response.json();
			console.log('API success response:', result);
			setSuccessMessage(result.message || `Successfully processed ${result.count} subscribers`);

			// Reset form after success
			setTimeout(() => {
				onSuccess();
				handleClose();
			}, 1500);
		} catch (error) {
			console.error('Bulk submission error:', error);
			setError(error instanceof Error ? error.message : 'An unknown error occurred');
		} finally {
			setLoading(false);
		}
	};

	const handleClose = () => {
		setBulkData({
			startImsi: '',
			count: 10,
			incrementMsisdn: false,
			startMsisdn: '',
			templateData: {
				k: '465B5CE8B199B49FAA5F0A2EE238A6BC',
				opc: 'E8ED289DEBA952E4283B54E88E6183CA',
				amf: '8000',
				sqn: '000000000000',
				status: 'active',
				subscriber_status: 0,
				operator_determined_barring: 0,
				slice: [
					{
						sst: 1,
						sd: '',
						default_indicator: true,
						session: [
							{
								name: 'internet',
								type: 2,
								pcc_rule: [],
								ambr: {
									uplink: { value: 1, unit: 'Gbps' },
									downlink: { value: 1, unit: 'Gbps' },
								},
								qos: {
									index: 9,
									arp: {
										priority_level: 8,
										pre_emption_capability: 0,
										pre_emption_vulnerability: 0,
									},
								},
							},
						],
					},
				],
			},
		});
		setShowPreview(false);
		setSuccessMessage(null);
		setError(null);
		onClose();
	};

	return (
		<Dialog
			open={isOpen}
			onOpenChange={handleClose}>
			<DialogContent className='sm:max-w-4xl max-h-[70vh] overflow-y-scroll overflow-x-hidden rounded-none'>
				<DialogHeader>
					<DialogTitle className='flex items-center gap-2'>
						<Users className='w-5 h-5' />
						Bulk Create Subscribers
					</DialogTitle>
				</DialogHeader>

				{/* Bulk Configuration */}
				<Card className='w-full'>
					<CardHeader>
						<h4 className='text-md font-semibold'>Bulk Creation Settings</h4>
					</CardHeader>
					<CardContent className='space-y-4'>
						<div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
							<div>
								<Label
									htmlFor='startImsi'
									className='block text-sm font-medium mb-1'>
									Start IMSI <span className='text-red-500'>*</span>
								</Label>
								<Input
									id='startImsi'
									type='text'
									placeholder='001010000000001'
									value={bulkData.startImsi}
									onChange={(e) => setBulkData((prev) => ({ ...prev, startImsi: e.target.value }))}
									required
								/>
								<p className='text-xs text-gray-500 mt-1'>15-digit IMSI starting point</p>
							</div>

							<div>
								<Label
									htmlFor='count'
									className='block text-sm font-medium mb-1'>
									Count <span className='text-red-500'>*</span>
								</Label>
								<Input
									id='count'
									type='number'
									min='1'
									max='1000'
									placeholder='10'
									value={bulkData.count}
									onChange={(e) => setBulkData((prev) => ({ ...prev, count: parseInt(e.target.value) || 1 }))}
									required
								/>
								<p className='text-xs text-gray-500 mt-1'>Number of subscribers to create (max 1000)</p>
							</div>
						</div>

						<div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
							<div className='flex items-center space-x-2'>
								<Checkbox
									id='incrementMsisdn'
									checked={bulkData.incrementMsisdn}
									onCheckedChange={(checked) =>
										setBulkData((prev) => ({ ...prev, incrementMsisdn: checked as boolean }))
									}
								/>
								<Label htmlFor='incrementMsisdn'>Auto-increment MSISDN</Label>
							</div>
							<div className='flex items-center space-x-2'>
								<Checkbox
									id='previewImsis'
									checked={showPreview}
									onCheckedChange={generatePreview}
									disabled={!bulkData.startImsi || !bulkData.count}
								/>
								<Label htmlFor='previewImsis'>Preview IMSIs</Label>
							</div>

							{bulkData.incrementMsisdn && (
								<div>
									<Label
										htmlFor='startMsisdn'
										className='block text-sm font-medium mb-1'>
										Start MSISDN
									</Label>
									<Input
										id='startMsisdn'
										type='text'
										placeholder='1234567890'
										value={bulkData.startMsisdn}
										onChange={(e) => setBulkData((prev) => ({ ...prev, startMsisdn: e.target.value }))}
									/>
									<p className='text-xs text-gray-500 mt-1'>Starting MSISDN (will increment for each subscriber)</p>
								</div>
							)}
						</div>

						{/* Preview Panel */}
						{showPreview && preview.imsiList.length > 0 && (
							<Card className='border-l-4 border-l-blue-500 bg-blue-50'>
								<CardContent className='pt-4'>
									<h5 className='text-sm font-semibold mb-2'>IMSI Preview</h5>
									<p className='text-sm text-gray-600 mb-2'>
										Range: {preview.startImsi} - {preview.endImsi} ({bulkData.count} subscribers)
									</p>
									<div className='flex flex-wrap gap-1'>
										{preview.imsiList.map((imsi, index) => (
											<span
												key={index}
												className='text-xs bg-white px-2 py-1 rounded border'>
												{imsi}
											</span>
										))}
										{bulkData.count > 10 && (
											<span className='text-xs text-gray-500 px-2 py-1'>... and {bulkData.count - 10} more</span>
										)}
									</div>
								</CardContent>
							</Card>
						)}
					</CardContent>
				</Card>

				{/* Template Data - Authentication Information */}
				<Card className='w-full'>
					<CardHeader>
						<h4 className='text-md font-semibold'>Template Authentication Information</h4>
						<p className='text-sm text-gray-600'>These values will be used for all created subscribers</p>
					</CardHeader>
					<CardContent className='space-y-4'>
						<div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
							<div>
								<Label
									htmlFor='templateK'
									className='block text-sm font-medium mb-1'>
									K (Authentication Key) <span className='text-red-500'>*</span>
								</Label>
								<Input
									id='templateK'
									type='text'
									placeholder='465B5CE8B199B49FAA5F0A2EE238A6BC'
									value={bulkData.templateData.k || ''}
									onChange={(e) =>
										setBulkData((prev) => ({
											...prev,
											templateData: { ...prev.templateData, k: e.target.value },
										}))
									}
									required
								/>
							</div>

							<div>
								<Label
									htmlFor='templateOpc'
									className='block text-sm font-medium mb-1'>
									OPc (Operator Key) <span className='text-red-500'>*</span>
								</Label>
								<Input
									id='templateOpc'
									type='text'
									placeholder='E8ED289DEBA952E4283B54E88E6183CA'
									value={bulkData.templateData.opc || ''}
									onChange={(e) =>
										setBulkData((prev) => ({
											...prev,
											templateData: { ...prev.templateData, opc: e.target.value },
										}))
									}
									required
								/>
							</div>
						</div>

						<div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
							<div>
								<Label
									htmlFor='templateAmf'
									className='block text-sm font-medium mb-1'>
									AMF (Authentication Management Field) <span className='text-red-500'>*</span>
								</Label>
								<Input
									id='templateAmf'
									type='text'
									placeholder='8000'
									value={bulkData.templateData.amf || ''}
									onChange={(e) =>
										setBulkData((prev) => ({
											...prev,
											templateData: { ...prev.templateData, amf: e.target.value },
										}))
									}
									required
								/>
							</div>

							<div>
								<Label
									htmlFor='templateSqn'
									className='block text-sm font-medium mb-1'>
									SQN (Sequence Number) <span className='text-red-500'>*</span>
								</Label>
								<Input
									id='templateSqn'
									type='text'
									placeholder='000000000000'
									value={bulkData.templateData.sqn || ''}
									onChange={(e) =>
										setBulkData((prev) => ({
											...prev,
											templateData: { ...prev.templateData, sqn: e.target.value },
										}))
									}
									required
								/>
							</div>
						</div>
					</CardContent>
				</Card>

				{/* Template Subscriber Settings */}
				<Card>
					<CardHeader>
						<h4 className='text-md font-semibold'>Template Subscriber Settings</h4>
					</CardHeader>
					<CardContent className='space-y-4'>
						<div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
							<div>
								<Label className='block text-sm font-medium mb-1'>Subscriber Status (TS 29.272 7.3.29)</Label>
								<Select
									value={bulkData.templateData.subscriber_status?.toString() || '0'}
									onValueChange={(value) =>
										setBulkData((prev) => ({
											...prev,
											templateData: { ...prev.templateData, subscriber_status: parseInt(value) },
										}))
									}>
									<SelectTrigger>
										<SelectValue placeholder='Select status' />
									</SelectTrigger>
									<SelectContent>
										<SelectItem value='0'>SERVICE_GRANTED</SelectItem>
										<SelectItem value='1'>OPERATOR_DETERMINED_BARRING</SelectItem>
									</SelectContent>
								</Select>
							</div>

							<div>
								<Label className='block text-sm font-medium mb-1'>Status</Label>
								<Select
									value={bulkData.templateData.status || 'active'}
									onValueChange={(value) =>
										setBulkData((prev) => ({
											...prev,
											templateData: { ...prev.templateData, status: value as 'active' | 'inactive' | 'suspended' },
										}))
									}>
									<SelectTrigger>
										<SelectValue placeholder='Select status' />
									</SelectTrigger>
									<SelectContent>
										<SelectItem value='active'>Active</SelectItem>
										<SelectItem value='inactive'>Inactive</SelectItem>
										<SelectItem value='suspended'>Suspended</SelectItem>
									</SelectContent>
								</Select>
							</div>
						</div>
					</CardContent>
				</Card>

				{/* Template Slice Configurations */}
				<Card>
					<CardHeader className='flex flex-row items-center justify-between'>
						<div>
							<h4 className='text-md font-semibold'>Template Slice Configurations</h4>
							<p className='text-sm text-gray-600'>These slice configurations will be applied to all subscribers</p>
						</div>
						<Button
							size='sm'
							onClick={addSlice}
							className='flex items-center gap-2'>
							<Plus className='w-4 h-4' />
							Add Slice
						</Button>
					</CardHeader>
					<CardContent className='space-y-6'>
						{bulkData.templateData.slice?.map((slice, sliceIndex) => (
							<div key={sliceIndex}>
								{sliceIndex > 0 && <Separator className='mb-6' />}
								<div className='space-y-4'>
									<div className='flex flex-row items-center justify-between'>
										<h5 className='text-sm font-medium'>Slice {sliceIndex + 1}</h5>
										<Button
											size='sm'
											variant='destructive'
											onClick={() => removeSlice(sliceIndex)}
											className='h-8 w-8 p-0'>
											<X className='w-4 h-4' />
										</Button>
									</div>

									<div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
										<div>
											<Label className='block text-sm font-medium mb-1'>SST*</Label>
											<RadioGroup
												value={slice.sst?.toString() || '1'}
												onValueChange={(value) => updateSlice(sliceIndex, 'sst', parseInt(value))}
												className='flex flex-row space-x-4'>
												<div className='flex items-center space-x-2'>
													<RadioGroupItem
														value='1'
														id={`sst-1-${sliceIndex}`}
													/>
													<Label htmlFor={`sst-1-${sliceIndex}`}>1</Label>
												</div>
												<div className='flex items-center space-x-2'>
													<RadioGroupItem
														value='2'
														id={`sst-2-${sliceIndex}`}
													/>
													<Label htmlFor={`sst-2-${sliceIndex}`}>2</Label>
												</div>
												<div className='flex items-center space-x-2'>
													<RadioGroupItem
														value='3'
														id={`sst-3-${sliceIndex}`}
													/>
													<Label htmlFor={`sst-3-${sliceIndex}`}>3</Label>
												</div>
												<div className='flex items-center space-x-2'>
													<RadioGroupItem
														value='4'
														id={`sst-4-${sliceIndex}`}
													/>
													<Label htmlFor={`sst-4-${sliceIndex}`}>4</Label>
												</div>
											</RadioGroup>
										</div>

										<div>
											<Label className='block text-sm font-medium mb-1'>SD</Label>
											<Input
												type='text'
												placeholder=''
												value={slice.sd || ''}
												onChange={(e) => updateSlice(sliceIndex, 'sd', e.target.value)}
											/>
										</div>

										<div className='flex items-center mt-6'>
											<div className='flex flex-col'>
												<Label className='block text-sm font-medium mb-1'>Options</Label>
												<div className='flex items-center space-x-2 mt-2'>
													<Checkbox
														id={`default-${sliceIndex}`}
														checked={slice.default_indicator ?? true}
														onCheckedChange={(checked) =>
															updateSlice(sliceIndex, 'default_indicator', checked as boolean)
														}
													/>
													<Label htmlFor={`default-${sliceIndex}`}>Default S-NSSAI</Label>
												</div>
											</div>
										</div>
									</div>

									{/* Session Configurations for this slice */}
									<Separator />
									<div className='space-y-4'>
										<div className='flex flex-row items-center justify-between'>
											<h6 className='text-sm font-medium'>Session Configurations</h6>
											<Button
												size='sm'
												variant='outline'
												onClick={() => addSession(sliceIndex)}
												className='flex items-center gap-2'>
												<Plus className='w-4 h-4' />
												Add Session
											</Button>
										</div>

										{slice.session?.map((session, sessionIndex) => (
											<div key={sessionIndex}>
												{sessionIndex > 0 && <Separator className='my-4' />}
												<div className='space-y-3 p-4 border border-dashed border-gray-200 rounded-lg'>
													<div className='flex flex-row items-center justify-between'>
														<h6 className='text-xs font-medium'>Session {sessionIndex + 1}</h6>
														<Button
															size='sm'
															variant='destructive'
															onClick={() => removeSession(sliceIndex, sessionIndex)}
															className='h-6 w-6 p-0'>
															<X className='w-3 h-3' />
														</Button>
													</div>

													<div className='grid grid-cols-1 md:grid-cols-2 gap-3'>
														<div>
															<Label className='block text-xs font-medium mb-1'>DNN/APN*</Label>
															<Input
																type='text'
																placeholder='internet'
																value={session.name || ''}
																onChange={(e) => updateSession(sliceIndex, sessionIndex, 'name', e.target.value)}
																className='h-8'
															/>
														</div>

														<div>
															<Label className='block text-xs font-medium mb-1'>Type*</Label>
															<Select
																value={session.type?.toString() || '2'}
																onValueChange={(value) =>
																	updateSession(sliceIndex, sessionIndex, 'type', parseInt(value))
																}>
																<SelectTrigger className='h-8'>
																	<SelectValue />
																</SelectTrigger>
																<SelectContent>
																	<SelectItem value='0'>IPv4</SelectItem>
																	<SelectItem value='1'>IPv6</SelectItem>
																	<SelectItem value='2'>IPv4v6</SelectItem>
																</SelectContent>
															</Select>
														</div>
													</div>

													<div className='grid grid-cols-1 md:grid-cols-2 gap-3'>
														<div>
															<Label className='block text-xs font-medium mb-1'>5QI/QCI*</Label>
															<Select
																value={session.qos?.index?.toString() || '9'}
																onValueChange={(value) =>
																	updateSessionNested(sliceIndex, sessionIndex, 'qos', 'index', parseInt(value))
																}>
																<SelectTrigger className='h-8'>
																	<SelectValue />
																</SelectTrigger>
																<SelectContent>
																	{Array.from({ length: 15 }, (_, i) => i + 1).map((i) => (
																		<SelectItem
																			key={i.toString()}
																			value={i.toString()}>
																			{i}
																		</SelectItem>
																	))}
																</SelectContent>
															</Select>
														</div>

														<div>
															<Label className='block text-xs font-medium mb-1'>ARP Priority Level (1-15)*</Label>
															<Select
																value={session.qos?.arp?.priority_level?.toString() || '8'}
																onValueChange={(value) => {
																	updateSessionNested(sliceIndex, sessionIndex, 'qos', 'arp', {
																		...session.qos?.arp,
																		priority_level: parseInt(value),
																	});
																}}>
																<SelectTrigger className='h-8'>
																	<SelectValue />
																</SelectTrigger>
																<SelectContent>
																	{Array.from({ length: 15 }, (_, i) => i + 1).map((i) => (
																		<SelectItem
																			key={i.toString()}
																			value={i.toString()}>
																			{i}
																		</SelectItem>
																	))}
																</SelectContent>
															</Select>
														</div>
													</div>

													<div className='grid grid-cols-1 md:grid-cols-2 gap-3'>
														<div>
															<Label className='block text-xs font-medium mb-1'>Capability*</Label>
															<Select
																value={session.qos?.arp?.pre_emption_capability?.toString() || '0'}
																onValueChange={(value) => {
																	updateSessionNested(sliceIndex, sessionIndex, 'qos', 'arp', {
																		...session.qos?.arp,
																		pre_emption_capability: parseInt(value),
																	});
																}}>
																<SelectTrigger className='h-8'>
																	<SelectValue />
																</SelectTrigger>
																<SelectContent>
																	<SelectItem value='0'>Disabled</SelectItem>
																	<SelectItem value='1'>Enabled</SelectItem>
																</SelectContent>
															</Select>
														</div>

														<div>
															<Label className='block text-xs font-medium mb-1'>Vulnerability*</Label>
															<Select
																value={session.qos?.arp?.pre_emption_vulnerability?.toString() || '0'}
																onValueChange={(value) => {
																	updateSessionNested(sliceIndex, sessionIndex, 'qos', 'arp', {
																		...session.qos?.arp,
																		pre_emption_vulnerability: parseInt(value),
																	});
																}}>
																<SelectTrigger className='h-8'>
																	<SelectValue />
																</SelectTrigger>
																<SelectContent>
																	<SelectItem value='0'>Disabled</SelectItem>
																	<SelectItem value='1'>Enabled</SelectItem>
																</SelectContent>
															</Select>
														</div>
													</div>

													<div className='grid grid-cols-1 md:grid-cols-2 gap-3'>
														<div className='grid grid-cols-2 gap-2'>
															<div>
																<Label className='block text-xs font-medium mb-1'>Session-AMBR Downlink*</Label>
																<Input
																	type='number'
																	placeholder='1'
																	value={session.ambr?.downlink?.value?.toString() || ''}
																	onChange={(e) =>
																		updateSessionNested(sliceIndex, sessionIndex, 'ambr', 'downlink', {
																			...session.ambr?.downlink,
																			value: parseInt(e.target.value) || 1,
																		})
																	}
																	className='h-8'
																/>
															</div>
															<div>
																<Label className='block text-xs font-medium mb-1'>Unit</Label>
																<Select
																	value={session.ambr?.downlink?.unit || 'Gbps'}
																	onValueChange={(value) => {
																		updateSessionNested(sliceIndex, sessionIndex, 'ambr', 'downlink', {
																			...session.ambr?.downlink,
																			unit: value,
																		});
																	}}>
																	<SelectTrigger className='h-8'>
																		<SelectValue />
																	</SelectTrigger>
																	<SelectContent>
																		<SelectItem value='bps'>bps</SelectItem>
																		<SelectItem value='Kbps'>Kbps</SelectItem>
																		<SelectItem value='Mbps'>Mbps</SelectItem>
																		<SelectItem value='Gbps'>Gbps</SelectItem>
																	</SelectContent>
																</Select>
															</div>
														</div>

														<div className='grid grid-cols-2 gap-2'>
															<div>
																<Label className='block text-xs font-medium mb-1'>Session-AMBR Uplink*</Label>
																<Input
																	type='number'
																	placeholder='1'
																	value={session.ambr?.uplink?.value?.toString() || ''}
																	onChange={(e) =>
																		updateSessionNested(sliceIndex, sessionIndex, 'ambr', 'uplink', {
																			...session.ambr?.uplink,
																			value: parseInt(e.target.value) || 1,
																		})
																	}
																	className='h-8'
																/>
															</div>
															<div>
																<Label className='block text-xs font-medium mb-1'>Unit</Label>
																<Select
																	value={session.ambr?.uplink?.unit || 'Gbps'}
																	onValueChange={(value) => {
																		updateSessionNested(sliceIndex, sessionIndex, 'ambr', 'uplink', {
																			...session.ambr?.uplink,
																			unit: value,
																		});
																	}}>
																	<SelectTrigger className='h-8'>
																		<SelectValue />
																	</SelectTrigger>
																	<SelectContent>
																		<SelectItem value='bps'>bps</SelectItem>
																		<SelectItem value='Kbps'>Kbps</SelectItem>
																		<SelectItem value='Mbps'>Mbps</SelectItem>
																		<SelectItem value='Gbps'>Gbps</SelectItem>
																	</SelectContent>
																</Select>
															</div>
														</div>
													</div>
												</div>
											</div>
										))}
									</div>
								</div>
							</div>
						))}

						{(!bulkData.templateData.slice || bulkData.templateData.slice.length === 0) && (
							<div className='text-center py-8 text-gray-500'>
								<p>No slices configured. Click "Add Slice" to add a slice configuration.</p>
							</div>
						)}
					</CardContent>
				</Card>

				{/* Action Buttons */}
				<div className='px-6 py-4 border-t border-gray-200 flex justify-between'>
					{/* Status Messages */}
					<div className='flex items-center'>
						{successMessage && (
							<div className='flex items-center text-green-600'>
								<span className='text-sm'>{successMessage}</span>
							</div>
						)}
						{error && (
							<div className='flex items-center text-red-600'>
								<span className='text-sm'>{error}</span>
							</div>
						)}
					</div>

					{/* Buttons */}
					<div className='flex space-x-3 ml-auto'>
						<Button
							onClick={handleClose}
							disabled={loading}
							variant='outline'>
							Cancel
						</Button>
						<Button
							onClick={handleSubmit}
							disabled={loading}>
							{loading ? (
								<>
									<RefreshCw className='w-4 h-4 mr-2 animate-spin' />
									Processing...
								</>
							) : (
								`Process ${bulkData.count} Subscribers`
							)}
						</Button>
					</div>
				</div>
			</DialogContent>
		</Dialog>
	);
};

export default BulkSubscriberForm;
