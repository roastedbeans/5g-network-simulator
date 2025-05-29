'use client';
import { RefreshCw, Plus, X } from 'lucide-react';
import React, { useState } from 'react';
import { Subscriber } from '@/services/subscriber-service';
import {
	Modal,
	ModalBody,
	ModalContent,
	ModalHeader,
	Button,
	Input,
	Select,
	SelectItem,
	Checkbox,
	RadioGroup,
	Radio,
	Divider,
	Card,
	CardBody,
	CardHeader,
} from '@heroui/react';

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
		<Modal
			isOpen={isOpen}
			onClose={onClose}
			isDismissable
			size='5xl'
			scrollBehavior='inside'>
			<ModalContent>
				<ModalHeader>
					<h3 className='text-lg font-semibold text-gray-900'>
						{selectedSubscriber ? 'Edit Subscriber' : 'Create New Subscriber'}
					</h3>
				</ModalHeader>

				<ModalBody className='overflow-y-auto max-h-[calc(90vh-200px)]'>
					<div className='space-y-6'>
						{/* Basic Authentication Fields */}
						<Card>
							<CardHeader>
								<h4 className='text-md font-semibold'>Authentication Information</h4>
							</CardHeader>
							<CardBody className='space-y-4'>
								<div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
									<div>
										<label className='block text-sm font-medium text-gray-700 mb-1'>
											IMSI <span className='text-red-500'>*</span>
										</label>
										<Input
											type='text'
											variant='bordered'
											placeholder='001010000000001'
											value={formData.imsi || ''}
											onChange={(e) => setFormData((prev) => ({ ...prev, imsi: e.target.value }))}
											required
										/>
									</div>

									<div>
										<label className='block text-sm font-medium text-gray-700 mb-1'>MSISDN</label>
										<Input
											type='text'
											variant='bordered'
											placeholder='1234567890'
											value={formData.msisdn || ''}
											onChange={(e) => setFormData((prev) => ({ ...prev, msisdn: e.target.value }))}
										/>
									</div>
								</div>

								<div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
									<div>
										<label className='block text-sm font-medium text-gray-700 mb-1'>
											K (Authentication Key) <span className='text-red-500'>*</span>
										</label>
										<Input
											type='text'
											variant='bordered'
											placeholder='465B5CE8B199B49FAA5F0A2EE238A6BC'
											value={formData.k || ''}
											onChange={(e) => setFormData((prev) => ({ ...prev, k: e.target.value }))}
											required
										/>
									</div>

									<div>
										<label className='block text-sm font-medium text-gray-700 mb-1'>
											OPc (Operator Key) <span className='text-red-500'>*</span>
										</label>
										<Input
											type='text'
											variant='bordered'
											placeholder='E8ED289DEBA952E4283B54E88E6183CA'
											value={formData.opc || ''}
											onChange={(e) => setFormData((prev) => ({ ...prev, opc: e.target.value }))}
											required
										/>
									</div>
								</div>

								<div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
									<div>
										<label className='block text-sm font-medium text-gray-700 mb-1'>
											AMF (Authentication Management Field) <span className='text-red-500'>*</span>
										</label>
										<Input
											type='text'
											variant='bordered'
											placeholder='8000'
											value={formData.amf || ''}
											onChange={(e) => setFormData((prev) => ({ ...prev, amf: e.target.value }))}
											required
										/>
									</div>

									<div>
										<label className='block text-sm font-medium text-gray-700 mb-1'>
											SQN (Sequence Number) <span className='text-red-500'>*</span>
										</label>
										<Input
											type='text'
											variant='bordered'
											placeholder='000000000000'
											value={formData.sqn || ''}
											onChange={(e) => setFormData((prev) => ({ ...prev, sqn: e.target.value }))}
											required
										/>
									</div>
								</div>
							</CardBody>
						</Card>

						{/* Subscriber Status and Settings */}
						<Card>
							<CardHeader>
								<h4 className='text-md font-semibold'>Subscriber Settings</h4>
							</CardHeader>
							<CardBody className='space-y-4'>
								<div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
									<div>
										<label className='block text-sm font-medium text-gray-700 mb-1'>
											Subscriber Status (TS 29.272 7.3.29)
										</label>
										<Select
											variant='bordered'
											selectedKeys={formData.subscriber_status ? [formData.subscriber_status.toString()] : ['0']}
											onSelectionChange={(keys) => {
												const value = Array.from(keys)[0] as string;
												setFormData((prev) => ({ ...prev, subscriber_status: parseInt(value) }));
											}}>
											<SelectItem key='0'>SERVICE_GRANTED</SelectItem>
											<SelectItem key='1'>OPERATOR_DETERMINED_BARRING</SelectItem>
										</Select>
									</div>

									<div>
										<label className='block text-sm font-medium text-gray-700 mb-1'>
											Operator Determined Barring (TS 29.272 7.3.30)
										</label>
										<Select
											variant='bordered'
											selectedKeys={
												formData.operator_determined_barring ? [formData.operator_determined_barring.toString()] : ['0']
											}
											onSelectionChange={(keys) => {
												const value = Array.from(keys)[0] as string;
												setFormData((prev) => ({ ...prev, operator_determined_barring: parseInt(value) }));
											}}>
											<SelectItem key='0'>(0) All Packet Oriented Services Barred</SelectItem>
											<SelectItem key='1'>(1) Roamer Access to HPLMN-AP Barred</SelectItem>
											<SelectItem key='2'>(2) Roamer Access to VPLMN-AP Barred</SelectItem>
										</Select>
									</div>
								</div>

								<div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
									<div>
										<label className='block text-sm font-medium text-gray-700 mb-1'>Status</label>
										<Select
											variant='bordered'
											selectedKeys={formData.status ? [formData.status] : ['active']}
											onSelectionChange={(keys) => {
												const value = Array.from(keys)[0] as string;
												setFormData((prev) => ({ ...prev, status: value as 'active' | 'inactive' | 'suspended' }));
											}}>
											<SelectItem key='active'>Active</SelectItem>
											<SelectItem key='inactive'>Inactive</SelectItem>
											<SelectItem key='suspended'>Suspended</SelectItem>
										</Select>
									</div>

									<div className='flex items-center mt-6'>
										<Checkbox
											isSelected={formData.roaming_allowed ?? true}
											onValueChange={(isSelected) => setFormData((prev) => ({ ...prev, roaming_allowed: isSelected }))}>
											Roaming Allowed
										</Checkbox>
									</div>
								</div>
							</CardBody>
						</Card>

						{/* Slice Configurations */}
						<Card>
							<CardHeader className='flex flex-row items-center justify-between'>
								<h4 className='text-md font-semibold'>Slice Configurations</h4>
								<Button
									size='sm'
									color='primary'
									startContent={<Plus className='w-4 h-4' />}
									onPress={addSlice}>
									Add Slice
								</Button>
							</CardHeader>
							<CardBody className='space-y-4'>
								{formData.slice?.map((slice, sliceIndex) => (
									<Card
										key={sliceIndex}
										className='border'>
										<CardHeader className='flex flex-row items-center justify-between pb-2'>
											<h5 className='text-sm font-medium'>Slice {sliceIndex + 1}</h5>
											<Button
												size='sm'
												color='danger'
												variant='light'
												isIconOnly
												onPress={() => removeSlice(sliceIndex)}>
												<X className='w-4 h-4' />
											</Button>
										</CardHeader>
										<CardBody className='space-y-4 pt-0'>
											<div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
												<div>
													<label className='block text-sm font-medium text-gray-700 mb-2'>SST*</label>
													<RadioGroup
														orientation='horizontal'
														value={slice.sst?.toString() || '1'}
														onValueChange={(value) => updateSlice(sliceIndex, 'sst', parseInt(value))}>
														<Radio value='1'>1</Radio>
														<Radio value='2'>2</Radio>
														<Radio value='3'>3</Radio>
														<Radio value='4'>4</Radio>
													</RadioGroup>
												</div>

												<div>
													<label className='block text-sm font-medium text-gray-700 mb-1'>SD</label>
													<Input
														type='text'
														variant='bordered'
														placeholder=''
														value={slice.sd || ''}
														onChange={(e) => updateSlice(sliceIndex, 'sd', e.target.value)}
													/>
												</div>

												<div className='flex items-center mt-6'>
													<Checkbox
														isSelected={slice.default_indicator ?? true}
														onValueChange={(isSelected) => updateSlice(sliceIndex, 'default_indicator', isSelected)}>
														Default S-NSSAI
													</Checkbox>
												</div>
											</div>

											{/* Session Configurations for this slice */}
											<Divider />
											<div className='space-y-4'>
												<div className='flex flex-row items-center justify-between'>
													<h6 className='text-sm font-medium'>Session Configurations</h6>
													<Button
														size='sm'
														color='primary'
														variant='flat'
														startContent={<Plus className='w-4 h-4' />}
														onPress={() => addSession(sliceIndex)}>
														Add Session
													</Button>
												</div>

												{slice.session?.map((session, sessionIndex) => (
													<Card
														key={sessionIndex}
														className='border-dashed border-2 border-gray-200'>
														<CardHeader className='flex flex-row items-center justify-between pb-2'>
															<h6 className='text-xs font-medium'>Session {sessionIndex + 1}</h6>
															<Button
																size='sm'
																color='danger'
																variant='light'
																isIconOnly
																onPress={() => removeSession(sliceIndex, sessionIndex)}>
																<X className='w-3 h-3' />
															</Button>
														</CardHeader>
														<CardBody className='space-y-3 pt-0'>
															<div className='grid grid-cols-1 md:grid-cols-2 gap-3'>
																<div>
																	<label className='block text-xs font-medium text-gray-700 mb-1'>DNN/APN*</label>
																	<Input
																		size='sm'
																		type='text'
																		variant='bordered'
																		placeholder='internet'
																		value={session.name || ''}
																		onChange={(e) => updateSession(sliceIndex, sessionIndex, 'name', e.target.value)}
																	/>
																</div>

																<div>
																	<label className='block text-xs font-medium text-gray-700 mb-1'>Type*</label>
																	<Select
																		size='sm'
																		variant='bordered'
																		selectedKeys={session.type ? [session.type.toString()] : ['2']}
																		onSelectionChange={(keys) => {
																			const value = Array.from(keys)[0] as string;
																			updateSession(sliceIndex, sessionIndex, 'type', parseInt(value));
																		}}>
																		<SelectItem key='0'>IPv4</SelectItem>
																		<SelectItem key='1'>IPv6</SelectItem>
																		<SelectItem key='2'>IPv4v6</SelectItem>
																	</Select>
																</div>
															</div>

															<div className='grid grid-cols-1 md:grid-cols-3 gap-3'>
																<div>
																	<label className='block text-xs font-medium text-gray-700 mb-1'>5QI/QCI*</label>
																	<Select
																		size='sm'
																		variant='bordered'
																		selectedKeys={session.qos?.index ? [session.qos.index.toString()] : ['9']}
																		onSelectionChange={(keys) => {
																			const value = Array.from(keys)[0] as string;
																			updateSessionNested(sliceIndex, sessionIndex, 'qos', 'index', parseInt(value));
																		}}>
																		{Array.from({ length: 15 }, (_, i) => i + 1).map((i) => (
																			<SelectItem key={i.toString()}>{i}</SelectItem>
																		))}
																	</Select>
																</div>

																<div>
																	<label className='block text-xs font-medium text-gray-700 mb-1'>
																		ARP Priority Level (1-15)*
																	</label>
																	<Select
																		size='sm'
																		variant='bordered'
																		selectedKeys={
																			session.qos?.arp?.priority_level
																				? [session.qos.arp.priority_level.toString()]
																				: ['8']
																		}
																		onSelectionChange={(keys) => {
																			const value = Array.from(keys)[0] as string;
																			updateSessionNested(sliceIndex, sessionIndex, 'qos', 'arp', {
																				...session.qos?.arp,
																				priority_level: parseInt(value),
																			});
																		}}>
																		{Array.from({ length: 15 }, (_, i) => i + 1).map((i) => (
																			<SelectItem key={i.toString()}>{i}</SelectItem>
																		))}
																	</Select>
																</div>
															</div>

															<div className='grid grid-cols-1 md:grid-cols-2 gap-3'>
																<div>
																	<label className='block text-xs font-medium text-gray-700 mb-1'>Capability*</label>
																	<Select
																		size='sm'
																		variant='bordered'
																		selectedKeys={
																			session.qos?.arp?.pre_emption_capability !== undefined
																				? [session.qos.arp.pre_emption_capability.toString()]
																				: ['0']
																		}
																		onSelectionChange={(keys) => {
																			const value = Array.from(keys)[0] as string;
																			updateSessionNested(sliceIndex, sessionIndex, 'qos', 'arp', {
																				...session.qos?.arp,
																				pre_emption_capability: parseInt(value),
																			});
																		}}>
																		<SelectItem key='0'>Disabled</SelectItem>
																		<SelectItem key='1'>Enabled</SelectItem>
																	</Select>
																</div>

																<div>
																	<label className='block text-xs font-medium text-gray-700 mb-1'>Vulnerability*</label>
																	<Select
																		size='sm'
																		variant='bordered'
																		selectedKeys={
																			session.qos?.arp?.pre_emption_vulnerability !== undefined
																				? [session.qos.arp.pre_emption_vulnerability.toString()]
																				: ['0']
																		}
																		onSelectionChange={(keys) => {
																			const value = Array.from(keys)[0] as string;
																			updateSessionNested(sliceIndex, sessionIndex, 'qos', 'arp', {
																				...session.qos?.arp,
																				pre_emption_vulnerability: parseInt(value),
																			});
																		}}>
																		<SelectItem key='0'>Disabled</SelectItem>
																		<SelectItem key='1'>Enabled</SelectItem>
																	</Select>
																</div>
															</div>

															<div className='grid grid-cols-1 md:grid-cols-2 gap-3'>
																<div className='grid grid-cols-2 gap-2'>
																	<div>
																		<label className='block text-xs font-medium text-gray-700 mb-1'>
																			Session-AMBR Downlink*
																		</label>
																		<Input
																			size='sm'
																			type='number'
																			variant='bordered'
																			placeholder='1'
																			value={session.ambr?.downlink?.value?.toString() || ''}
																			onChange={(e) =>
																				updateSessionNested(sliceIndex, sessionIndex, 'ambr', 'downlink', {
																					...session.ambr?.downlink,
																					value: parseInt(e.target.value) || 1,
																				})
																			}
																		/>
																	</div>
																	<div>
																		<label className='block text-xs font-medium text-gray-700 mb-1'>Unit</label>
																		<Select
																			size='sm'
																			variant='bordered'
																			selectedKeys={
																				session.ambr?.downlink?.unit ? [session.ambr.downlink.unit] : ['Gbps']
																			}
																			onSelectionChange={(keys) => {
																				const value = Array.from(keys)[0] as string;
																				updateSessionNested(sliceIndex, sessionIndex, 'ambr', 'downlink', {
																					...session.ambr?.downlink,
																					unit: value,
																				});
																			}}>
																			<SelectItem key='bps'>bps</SelectItem>
																			<SelectItem key='Kbps'>Kbps</SelectItem>
																			<SelectItem key='Mbps'>Mbps</SelectItem>
																			<SelectItem key='Gbps'>Gbps</SelectItem>
																		</Select>
																	</div>
																</div>

																<div className='grid grid-cols-2 gap-2'>
																	<div>
																		<label className='block text-xs font-medium text-gray-700 mb-1'>
																			Session-AMBR Uplink*
																		</label>
																		<Input
																			size='sm'
																			type='number'
																			variant='bordered'
																			placeholder='1'
																			value={session.ambr?.uplink?.value?.toString() || ''}
																			onChange={(e) =>
																				updateSessionNested(sliceIndex, sessionIndex, 'ambr', 'uplink', {
																					...session.ambr?.uplink,
																					value: parseInt(e.target.value) || 1,
																				})
																			}
																		/>
																	</div>
																	<div>
																		<label className='block text-xs font-medium text-gray-700 mb-1'>Unit</label>
																		<Select
																			size='sm'
																			variant='bordered'
																			selectedKeys={session.ambr?.uplink?.unit ? [session.ambr.uplink.unit] : ['Gbps']}
																			onSelectionChange={(keys) => {
																				const value = Array.from(keys)[0] as string;
																				updateSessionNested(sliceIndex, sessionIndex, 'ambr', 'uplink', {
																					...session.ambr?.uplink,
																					unit: value,
																				});
																			}}>
																			<SelectItem key='bps'>bps</SelectItem>
																			<SelectItem key='Kbps'>Kbps</SelectItem>
																			<SelectItem key='Mbps'>Mbps</SelectItem>
																			<SelectItem key='Gbps'>Gbps</SelectItem>
																		</Select>
																	</div>
																</div>
															</div>
														</CardBody>
													</Card>
												))}
											</div>
										</CardBody>
									</Card>
								))}

								{(!formData.slice || formData.slice.length === 0) && (
									<div className='text-center py-8 text-gray-500'>
										<p>No slices configured. Click "Add Slice" to add a slice configuration.</p>
									</div>
								)}
							</CardBody>
						</Card>
					</div>
				</ModalBody>

				<div className='px-6 py-4 border-t border-gray-200 flex justify-between'>
					{successMessage && (
						<div className='flex items-center text-green-600'>
							<span className='text-sm'>{successMessage}</span>
						</div>
					)}
					<div className='flex space-x-3 ml-auto'>
						<Button
							onPress={() => {
								setShowCreateModal(false);
								setShowEditModal(false);
								setFormData({});
								setSelectedSubscriber(null);
								setSuccessMessage(null);
							}}
							isDisabled={saveLoading}
							variant='flat'
							color='default'>
							Cancel
						</Button>
						<Button
							onPress={handleSave}
							isDisabled={saveLoading}
							color='primary'>
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
			</ModalContent>
		</Modal>
	);
};

export default SubscriberForm;
