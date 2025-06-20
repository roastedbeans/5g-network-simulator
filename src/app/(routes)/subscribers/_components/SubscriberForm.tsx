'use client';
import { RefreshCw, Plus, X } from 'lucide-react';
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

interface SubscriberFormProps {
	isOpen: boolean;
	onClose: () => void;
	selectedSubscriber: Subscriber | null;
	showCreateModal: boolean;
	showEditModal: boolean;
	setShowCreateModal: React.Dispatch<React.SetStateAction<boolean>>;
	setShowEditModal: React.Dispatch<React.SetStateAction<boolean>>;
	formData: Partial<Subscriber>;
	setFormData: React.Dispatch<React.SetStateAction<Partial<Subscriber>>>;
	setSelectedSubscriber: React.Dispatch<React.SetStateAction<Subscriber | null>>;
	saveLoading: boolean;
	successMessage: string | null;
	setSuccessMessage: React.Dispatch<React.SetStateAction<string | null>>;
	handleSave: () => Promise<void>;
}

const SubscriberForm = ({
	isOpen,
	onClose,
	selectedSubscriber,
	setShowCreateModal,
	setShowEditModal,
	formData,
	setFormData,
	setSelectedSubscriber,
	saveLoading,
	successMessage,
	setSuccessMessage,
	handleSave,
}: SubscriberFormProps) => {
	// Helper function to add a new slice
	const addSlice = () => {
		const newSlice = {
			sst: 1,
			sd: '',
			default_indicator: true,
			session: [],
		};

		setFormData((prev) => ({
			...prev,
			slice: [...(prev.slice || []), newSlice],
		}));
	};

	// Helper function to remove a slice
	const removeSlice = (index: number) => {
		setFormData((prev) => ({
			...prev,
			slice: prev.slice?.filter((_, i) => i !== index) || [],
		}));
	};

	// Helper function to update slice
	const updateSlice = (index: number, field: string, value: any) => {
		setFormData((prev) => ({
			...prev,
			slice: prev.slice?.map((slice, i) => (i === index ? { ...slice, [field]: value } : slice)) || [],
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

		setFormData((prev) => ({
			...prev,
			slice:
				prev.slice?.map((slice, i) =>
					i === sliceIndex ? { ...slice, session: [...(slice.session || []), newSession] } : slice
				) || [],
		}));
	};

	// Helper function to remove a session
	const removeSession = (sliceIndex: number, sessionIndex: number) => {
		setFormData((prev) => ({
			...prev,
			slice:
				prev.slice?.map((slice, i) =>
					i === sliceIndex ? { ...slice, session: slice.session?.filter((_, j) => j !== sessionIndex) || [] } : slice
				) || [],
		}));
	};

	// Helper function to update session
	const updateSession = (sliceIndex: number, sessionIndex: number, field: string, value: any) => {
		setFormData((prev) => ({
			...prev,
			slice:
				prev.slice?.map((slice, i) =>
					i === sliceIndex
						? {
								...slice,
								session:
									slice.session?.map((session, j) => (j === sessionIndex ? { ...session, [field]: value } : session)) ||
									[],
						  }
						: slice
				) || [],
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
		setFormData((prev) => ({
			...prev,
			slice:
				prev.slice?.map((slice, i) =>
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
		}));
	};

	return (
		<Dialog
			open={isOpen}
			onOpenChange={onClose}>
			<DialogContent className='sm:max-w-4xl h-fit max-h-[70vh] overflow-y-scroll overflow-x-hidden rounded-none'>
				<DialogHeader>
					<DialogTitle>{selectedSubscriber ? 'Edit Subscriber' : 'Create New Subscriber'}</DialogTitle>
				</DialogHeader>

				{/* Basic Authentication Fields */}
				<Card className='w-full'>
					<CardHeader>
						<h4 className='text-md font-semibold'>Authentication Information</h4>
					</CardHeader>
					<CardContent className='space-y-4'>
						<div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
							<div>
								<Label
									htmlFor='imsi'
									className='block text-sm font-medium mb-1'>
									IMSI <span className='text-red-500'>*</span>
								</Label>
								<Input
									id='imsi'
									type='text'
									placeholder='001010000000001'
									value={formData.imsi || ''}
									onChange={(e) => setFormData((prev) => ({ ...prev, imsi: e.target.value }))}
									required
								/>
							</div>

							<div>
								<Label
									htmlFor='msisdn'
									className='block text-sm font-medium mb-1'>
									MSISDN
								</Label>
								<Input
									id='msisdn'
									type='text'
									placeholder='1234567890'
									value={formData.msisdn || ''}
									onChange={(e) => setFormData((prev) => ({ ...prev, msisdn: e.target.value }))}
								/>
							</div>
						</div>

						<div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
							<div>
								<Label
									htmlFor='k'
									className='block text-sm font-medium mb-1'>
									K (Authentication Key) <span className='text-red-500'>*</span>
								</Label>
								<Input
									id='k'
									type='text'
									placeholder='465B5CE8B199B49FAA5F0A2EE238A6BC'
									value={formData.k || ''}
									onChange={(e) => setFormData((prev) => ({ ...prev, k: e.target.value }))}
									required
								/>
							</div>

							<div>
								<Label
									htmlFor='opc'
									className='block text-sm font-medium mb-1'>
									OPc (Operator Key) <span className='text-red-500'>*</span>
								</Label>
								<Input
									id='opc'
									type='text'
									placeholder='E8ED289DEBA952E4283B54E88E6183CA'
									value={formData.opc || ''}
									onChange={(e) => setFormData((prev) => ({ ...prev, opc: e.target.value }))}
									required
								/>
							</div>
						</div>

						<div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
							<div>
								<Label
									htmlFor='amf'
									className='block text-sm font-medium mb-1'>
									AMF (Authentication Management Field) <span className='text-red-500'>*</span>
								</Label>
								<Input
									id='amf'
									type='text'
									placeholder='8000'
									value={formData.amf || ''}
									onChange={(e) => setFormData((prev) => ({ ...prev, amf: e.target.value }))}
									required
								/>
							</div>

							<div>
								<Label
									htmlFor='sqn'
									className='block text-sm font-medium mb-1'>
									SQN (Sequence Number) <span className='text-red-500'>*</span>
								</Label>
								<Input
									id='sqn'
									type='text'
									placeholder='000000000000'
									value={formData.sqn || ''}
									onChange={(e) => setFormData((prev) => ({ ...prev, sqn: e.target.value }))}
									required
								/>
							</div>
						</div>
					</CardContent>
				</Card>

				{/* Subscriber Status and Settings */}
				<Card>
					<CardHeader>
						<h4 className='text-md font-semibold'>Subscriber Settings</h4>
					</CardHeader>
					<CardContent className='space-y-4'>
						<div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
							<div>
								<Label className='block text-sm font-medium mb-1'>Subscriber Status (TS 29.272 7.3.29)</Label>
								<Select
									value={formData.subscriber_status?.toString() || '0'}
									onValueChange={(value) => setFormData((prev) => ({ ...prev, subscriber_status: parseInt(value) }))}>
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
								<Label className='block text-sm font-medium mb-1'>Operator Determined Barring (TS 29.272 7.3.30)</Label>
								<Select
									value={formData.operator_determined_barring?.toString() || '0'}
									onValueChange={(value) =>
										setFormData((prev) => ({ ...prev, operator_determined_barring: parseInt(value) }))
									}>
									<SelectTrigger>
										<SelectValue placeholder='Select barring' />
									</SelectTrigger>
									<SelectContent>
										<SelectItem value='0'>(0) All Packet Oriented Services Barred</SelectItem>
										<SelectItem value='1'>(1) Roamer Access to HPLMN-AP Barred</SelectItem>
										<SelectItem value='2'>(2) Roamer Access to VPLMN-AP Barred</SelectItem>
									</SelectContent>
								</Select>
							</div>
						</div>

						<div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
							<div>
								<Label className='block text-sm font-medium mb-1'>Status</Label>
								<Select
									value={formData.status || 'active'}
									onValueChange={(value) =>
										setFormData((prev) => ({ ...prev, status: value as 'active' | 'inactive' | 'suspended' }))
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

				{/* Slice Configurations */}
				<Card>
					<CardHeader className='flex flex-row items-center justify-between'>
						<h4 className='text-md font-semibold'>Slice Configurations</h4>
						<Button
							size='sm'
							onClick={addSlice}
							className='flex items-center gap-2'>
							<Plus className='w-4 h-4' />
							Add Slice
						</Button>
					</CardHeader>
					<CardContent className='space-y-6'>
						{formData.slice?.map((slice, sliceIndex) => (
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

						{(!formData.slice || formData.slice.length === 0) && (
							<div className='text-center py-8 text-gray-500'>
								<p>No slices configured. Click "Add Slice" to add a slice configuration.</p>
							</div>
						)}
					</CardContent>
				</Card>

				<div className='px-6 py-4 border-t border-gray-200 flex justify-between'>
					{successMessage && (
						<div className='flex items-center text-green-600'>
							<span className='text-sm'>{successMessage}</span>
						</div>
					)}
					<div className='flex space-x-3 ml-auto'>
						<Button
							onClick={() => {
								setShowCreateModal(false);
								setShowEditModal(false);
								setFormData({});
								setSelectedSubscriber(null);
								setSuccessMessage(null);
							}}
							disabled={saveLoading}
							variant='outline'>
							Cancel
						</Button>
						<Button
							onClick={handleSave}
							disabled={saveLoading}>
							{saveLoading ? (
								<>
									<RefreshCw className='w-4 h-4 mr-2 animate-spin' />
									{selectedSubscriber ? 'Updating...' : 'Creating...'}
								</>
							) : selectedSubscriber ? (
								'Update'
							) : (
								'Create'
							)}
						</Button>
					</div>
				</div>
			</DialogContent>
		</Dialog>
	);
};

export default SubscriberForm;
