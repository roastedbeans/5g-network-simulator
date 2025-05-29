'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
	Search,
	Plus,
	Edit,
	Trash2,
	MoreVertical,
	Filter,
	RefreshCw,
	ChevronsUpDown,
	ChevronUp,
	ChevronDown,
	X,
} from 'lucide-react';
import SubscriberForm from './SubscriberForm';
import { Subscriber } from '@/services/subscriber-service';
import { Button, Input, Pagination } from '@heroui/react';
import SubscriberDelete from './SubscriberDelete';

// Types
interface NetworkSlice {
	sst: number;
	sd?: string;
	default_indicator?: boolean;
	session?: Session[];
}

interface Session {
	name: string;
	type: number;
	pcc_rule?: PccRule[];
	ambr?: {
		uplink: { value: number; unit: string };
		downlink: { value: number; unit: string };
	};
	qos?: {
		index: number;
		arp: {
			priority_level: number;
			pre_emption_capability: number;
			pre_emption_vulnerability: number;
		};
	};
}

interface PccRule {
	qos_id: number;
	priority?: number;
	flow?: Flow[];
}

interface Flow {
	description: string;
	direction: number;
}

interface SecurityContext {
	k: string;
	amf: string;
	op?: string;
	opc?: string;
	sqn: string;
}

// Default values for subscribers
const DEFAULT_KEY = '465B5CE8B199B49FAA5F0A2EE238A6BC';
const DEFAULT_OPC = 'E8ED289DEBA952E4283B54E88E6183CA';
const DEFAULT_AMF = '8000';
const DEFAULT_SQN = '000000000000';

const COLUMNS = [
	{ name: 'IMSI', key: 'imsi', sortable: true },
	{ name: 'MSISDN', key: 'msisdn', sortable: true },
	{ name: 'Status', key: 'status', sortable: true },
	{ name: 'Roaming', key: 'roaming_allowed', sortable: true },
	{ name: 'Last Seen', key: 'last_seen', sortable: true },
	{ name: 'Created', key: 'created_at', sortable: true },
	{ name: 'Actions', key: 'actions', sortable: false },
];

export default function SubscriberManagementDashboard() {
	// State management
	const [subscribers, setSubscribers] = useState<Subscriber[]>([]);
	const [totalSubscribers, setTotalSubscribers] = useState(0);
	const [apiTotalPages, setApiTotalPages] = useState(0);
	const [loading, setLoading] = useState(false);
	const [saveLoading, setSaveLoading] = useState(false);
	const [deleteLoading, setDeleteLoading] = useState(false);
	const [successMessage, setSuccessMessage] = useState<string | null>(null);
	const [selectedSubscribers, setSelectedSubscribers] = useState<Set<string>>(new Set());
	const [visibleColumns, setVisibleColumns] = useState<Set<string>>(new Set(COLUMNS.map((col) => col.key)));
	const [statusFilter, setStatusFilter] = useState<string>('all');
	const [rowsPerPage, setRowsPerPage] = useState(10);
	const [sortColumn, setSortColumn] = useState('created_at');
	const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
	const [currentPage, setCurrentPage] = useState(1);
	const [searchQuery, setSearchQuery] = useState('');
	const [selectedSubscriber, setSelectedSubscriber] = useState<Subscriber | null>(null);
	const [formData, setFormData] = useState<Partial<Subscriber>>({});

	// Modal states
	const [showCreateModal, setShowCreateModal] = useState(false);
	const [showEditModal, setShowEditModal] = useState(false);
	const [showViewModal, setShowViewModal] = useState(false);
	const [showDeleteModal, setShowDeleteModal] = useState(false);
	const [showColumnModal, setShowColumnModal] = useState(false);
	const [showStatusFilter, setShowStatusFilter] = useState(false);
	const [activeTab, setActiveTab] = useState('basic');

	// Load subscribers
	const loadSubscribers = useCallback(async () => {
		setLoading(true);
		try {
			const response = await fetch(
				`/api/subscribers?page=${currentPage}&limit=${rowsPerPage}&search=${searchQuery}&status=${statusFilter}`
			);
			if (!response.ok) {
				throw new Error(`HTTP error! status: ${response.status}`);
			}
			const data = await response.json();

			// Handle the API response structure correctly
			if (data.subscribers && Array.isArray(data.subscribers)) {
				setSubscribers(data.subscribers);
				setTotalSubscribers(data.pagination?.total || data.subscribers.length);
				setApiTotalPages(data.pagination?.pages || 1);
			} else if (Array.isArray(data)) {
				// Fallback if API returns array directly
				setSubscribers(data);
				setTotalSubscribers(data.length);
				setApiTotalPages(1);
			} else {
				console.error('Unexpected API response structure:', data);
				setSubscribers([]);
				setTotalSubscribers(0);
				setApiTotalPages(0);
			}
		} catch (error) {
			console.error('Failed to load subscribers:', error);
			setSubscribers([]);
			setTotalSubscribers(0);
			setApiTotalPages(0);
			// Show user-friendly error message
			alert(`Failed to load subscribers: ${error instanceof Error ? error.message : 'Unknown error'}`);
		} finally {
			setLoading(false);
		}
	}, [currentPage, rowsPerPage, searchQuery, statusFilter]);

	useEffect(() => {
		loadSubscribers();
	}, [loadSubscribers]);

	// Since we're using server-side pagination, we don't need client-side filtering
	// The API handles search, status filtering, and pagination
	const displayedSubscribers = subscribers;

	// Use API pagination data
	const totalPages = apiTotalPages || Math.ceil(totalSubscribers / rowsPerPage);
	const paginatedSubscribers = displayedSubscribers;

	// Handlers
	const handleSort = (column: string) => {
		if (sortColumn === column) {
			setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
		} else {
			setSortColumn(column);
			setSortDirection('asc');
		}
	};

	const handleSelectAll = () => {
		if (selectedSubscribers.size === paginatedSubscribers.length) {
			setSelectedSubscribers(new Set());
		} else {
			const subscriberIds = paginatedSubscribers.map((s) => s.id).filter((id) => id !== undefined) as string[];
			setSelectedSubscribers(new Set(subscriberIds));
		}
	};

	const handleSelectSubscriber = (id: string | undefined) => {
		if (!id) return;

		const newSelected = new Set(selectedSubscribers);
		if (newSelected.has(id)) {
			newSelected.delete(id);
		} else {
			newSelected.add(id);
		}
		setSelectedSubscribers(newSelected);
	};

	const openCreateModal = () => {
		setFormData({
			status: 'active',
			roaming_allowed: true,
			amf: DEFAULT_AMF,
			sqn: DEFAULT_SQN,
			k: DEFAULT_KEY,
			opc: DEFAULT_OPC,
		});
		setShowCreateModal(true);
	};

	const openEditModal = (subscriber: Subscriber) => {
		setSelectedSubscriber(subscriber);
		setFormData(subscriber);
		setShowEditModal(true);
	};

	const openViewModal = (subscriber: Subscriber) => {
		setSelectedSubscriber(subscriber);
		setShowViewModal(true);
	};

	const openDeleteModal = (subscriber: Subscriber) => {
		setSelectedSubscriber(subscriber);
		setShowDeleteModal(true);
	};

	const handleSave = async () => {
		setSaveLoading(true);
		setSuccessMessage(null);
		try {
			if (selectedSubscriber) {
				// Update existing subscriber
				const response = await fetch(`/api/subscribers/${selectedSubscriber.id}`, {
					method: 'PUT',
					headers: {
						'Content-Type': 'application/json',
					},
					body: JSON.stringify(formData),
				});

				if (!response.ok) {
					const errorData = await response.json();
					throw new Error(errorData.error || 'Failed to update subscriber');
				}

				setSuccessMessage(`Subscriber ${formData.imsi} updated successfully`);
			} else {
				// Create new subscriber
				const response = await fetch('/api/subscribers', {
					method: 'POST',
					headers: {
						'Content-Type': 'application/json',
					},
					body: JSON.stringify(formData),
				});

				if (!response.ok) {
					const errorData = await response.json();
					throw new Error(errorData.error || 'Failed to create subscriber');
				}

				setSuccessMessage(`Subscriber ${formData.imsi} created successfully`);
			}

			await loadSubscribers();
			setTimeout(() => {
				setShowCreateModal(false);
				setShowEditModal(false);
				setFormData({});
				setSelectedSubscriber(null);
				setSuccessMessage(null);
			}, 1500);
		} catch (error: any) {
			console.error('Failed to save subscriber:', error);
			alert(error.message || 'Failed to save subscriber');
		} finally {
			setSaveLoading(false);
		}
	};

	const handleDelete = async () => {
		setDeleteLoading(true);
		setSuccessMessage(null);
		try {
			if (!selectedSubscriber?.id) return;

			const response = await fetch(`/api/subscribers/${selectedSubscriber.id}`, {
				method: 'DELETE',
			});

			if (!response.ok) {
				const errorData = await response.json();
				throw new Error(errorData.error || 'Failed to delete subscriber');
			}

			setSuccessMessage(`Subscriber ${selectedSubscriber.imsi} deleted successfully`);
			await loadSubscribers();

			setTimeout(() => {
				setShowDeleteModal(false);
				setSelectedSubscriber(null);
				setSuccessMessage(null);
			}, 1500);
		} catch (error: any) {
			console.error('Failed to delete subscriber:', error);
			alert(error.message || 'Failed to delete subscriber');
		} finally {
			setDeleteLoading(false);
		}
	};

	const formatDate = (dateString: string | undefined) => {
		if (!dateString) return '-';
		return new Date(dateString).toLocaleString();
	};

	const getStatusColor = (status: string) => {
		switch (status) {
			case 'active':
				return 'bg-green-100 text-green-800';
			case 'suspended':
				return 'bg-yellow-100 text-yellow-800';
			case 'inactive':
				return 'bg-red-100 text-red-800';
			default:
				return 'bg-gray-100 text-gray-800';
		}
	};

	const getRoamingColor = (allowed: boolean) => {
		return allowed ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800';
	};

	return (
		<div className='p-6 max-w-7xl mx-auto'>
			{/* Header */}
			<div className='mb-8'>
				<h1 className='text-3xl font-bold text-gray-900 mb-2'>Open5GS Subscriber Management</h1>
				<p className='text-gray-600'>Manage subscribers for HPLMN roaming network</p>
			</div>

			{/* Main Card */}
			<div className='bg-white rounded-lg shadow-sm border border-gray-200'>
				{/* Top Controls */}
				<div className='p-6 border-b border-gray-200'>
					<div className='flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center'>
						{/* Search */}
						<div className='relative flex-1 max-w-md'>
							<Input
								type='text'
								variant='bordered'
								placeholder='Search by IMSI or MSISDN...'
								value={searchQuery}
								startContent={<Search className='w-5 h-5 text-gray-400' />}
								onChange={(e) => setSearchQuery(e.target.value)}
							/>
							{searchQuery && (
								<Button
									onPress={() => setSearchQuery('')}
									variant='flat'
									color='default'
									isIconOnly
									className='absolute right-3 top-1/2 transform -translate-y-1/2'>
									<X className='w-5 h-5' />
								</Button>
							)}
						</div>

						{/* Action Buttons */}
						<div className='flex gap-2 flex-wrap'>
							{/* Status Filter */}
							<div className='relative'>
								<Button
									onPress={() => setShowStatusFilter(!showStatusFilter)}
									variant='flat'
									color='default'>
									<Filter className='w-4 h-4 mr-2' />
									Status
								</Button>
								{showStatusFilter && (
									<div className='absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 z-10'>
										<div className='p-2'>
											{['all', 'active', 'inactive', 'suspended'].map((status) => (
												<label
													key={status}
													className='flex items-center p-2 hover:bg-gray-50 rounded cursor-pointer'>
													<input
														type='radio'
														name='status'
														value={status}
														checked={statusFilter === status}
														onChange={(e) => setStatusFilter(e.target.value)}
														className='mr-2'
													/>
													<span className='capitalize'>{status}</span>
												</label>
											))}
										</div>
									</div>
								)}
							</div>

							{/* Column Visibility */}
							<div className='relative'>
								<Button
									onPress={() => setShowColumnModal(!showColumnModal)}
									variant='flat'
									title='Columns'>
									<MoreVertical className='w-4 h-4 mr-2' />
									Columns
								</Button>
								{showColumnModal && (
									<div className='absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 z-10'>
										<div className='p-2'>
											{COLUMNS.map((column) => (
												<label
													key={column.key}
													className='flex items-center p-2 hover:bg-gray-50 rounded cursor-pointer'>
													<input
														type='checkbox'
														checked={visibleColumns.has(column.key)}
														onChange={(e) => {
															const newVisible = new Set(visibleColumns);
															if (e.target.checked) {
																newVisible.add(column.key);
															} else {
																newVisible.delete(column.key);
															}
															setVisibleColumns(newVisible);
														}}
														className='mr-2'
													/>
													<span>{column.name}</span>
												</label>
											))}
										</div>
									</div>
								)}
							</div>

							{/* Refresh button */}
							<Button
								onPress={loadSubscribers}
								isDisabled={loading}
								variant='flat'
								color='default'>
								<RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
								{loading ? 'Loading...' : 'Refresh'}
							</Button>

							{/* Add Subscriber button */}
							<Button
								onPress={openCreateModal}
								color='primary'>
								<Plus className='w-4 h-4 mr-2' />
								Add Subscriber
							</Button>
						</div>
					</div>

					{/* Stats */}
					<div className='mt-4 flex justify-between items-center text-sm text-gray-600'>
						<span>Total {totalSubscribers} subscribers</span>
						<span>{selectedSubscribers.size > 0 && `${selectedSubscribers.size} selected`}</span>
					</div>
				</div>

				{/* Table */}
				<div className='overflow-x-auto'>
					<table className='w-full'>
						<thead className='bg-gray-50 border-b border-gray-200'>
							<tr>
								<th className='px-6 py-3 text-left'>
									<input
										type='checkbox'
										checked={
											selectedSubscribers.size === paginatedSubscribers.length && paginatedSubscribers.length > 0
										}
										onChange={handleSelectAll}
										className='rounded border-gray-300'
									/>
								</th>
								{COLUMNS.filter((col) => visibleColumns.has(col.key)).map((column) => (
									<th
										key={column.key}
										className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
										{column.sortable ? (
											<Button
												onPress={() => handleSort(column.key)}
												variant='light'
												color='default'
												className='px-0 min-w-0 h-auto flex items-center'>
												<span>{column.name}</span>
												{sortColumn === column.key ? (
													sortDirection === 'asc' ? (
														<ChevronUp className='w-4 h-4' />
													) : (
														<ChevronDown className='w-4 h-4' />
													)
												) : (
													<ChevronsUpDown className='w-4 h-4 opacity-50' />
												)}
											</Button>
										) : (
											column.name
										)}
									</th>
								))}
							</tr>
						</thead>
						<tbody className='bg-white divide-y divide-gray-200'>
							{loading ? (
								<tr>
									<td
										colSpan={visibleColumns.size + 1}
										className='px-6 py-12 text-center'>
										<div className='flex items-center justify-center'>
											<RefreshCw className='w-6 h-6 animate-spin text-gray-400 mr-2' />
											<span className='text-gray-500'>Loading...</span>
										</div>
									</td>
								</tr>
							) : paginatedSubscribers.length === 0 ? (
								<tr>
									<td
										colSpan={visibleColumns.size + 1}
										className='px-6 py-12 text-center text-gray-500'>
										No subscribers found
									</td>
								</tr>
							) : (
								paginatedSubscribers.map((subscriber) => (
									<tr
										key={subscriber.id}
										className='hover:bg-gray-50'>
										<td className='px-6 py-4'>
											<input
												type='checkbox'
												checked={selectedSubscribers.has(subscriber.id || '')}
												onChange={() => handleSelectSubscriber(subscriber.id || '')}
												className='rounded border-gray-300'
											/>
										</td>
										{visibleColumns.has('imsi') && (
											<td className='px-6 py-4 whitespace-nowrap'>
												<div>
													<div className='text-sm font-medium text-gray-900'>{subscriber.imsi}</div>
													<div className='text-sm text-gray-500'>{subscriber.id}</div>
												</div>
											</td>
										)}
										{visibleColumns.has('msisdn') && (
											<td className='px-6 py-4 whitespace-nowrap text-sm text-gray-900'>{subscriber.msisdn || '-'}</td>
										)}
										{visibleColumns.has('status') && (
											<td className='px-6 py-4 whitespace-nowrap'>
												<span
													className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(
														subscriber.status
													)}`}>
													{subscriber.status}
												</span>
											</td>
										)}
										{visibleColumns.has('roaming_allowed') && (
											<td className='px-6 py-4 whitespace-nowrap'>
												<span
													className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getRoamingColor(
														subscriber.roaming_allowed || false
													)}`}>
													{subscriber.roaming_allowed ? 'Allowed' : 'Blocked'}
												</span>
											</td>
										)}
										{visibleColumns.has('last_seen') && (
											<td className='px-6 py-4 whitespace-nowrap text-sm text-gray-900'>
												{formatDate(subscriber.last_seen)}
											</td>
										)}
										{visibleColumns.has('created_at') && (
											<td className='px-6 py-4 whitespace-nowrap text-sm text-gray-900'>
												{formatDate(subscriber.created_at)}
											</td>
										)}
										{visibleColumns.has('actions') && (
											<td className='px-6 py-4 whitespace-nowrap text-sm font-medium'>
												<div className='flex items-center space-x-2'>
													<Button
														variant='light'
														color='primary'
														onPress={() => openEditModal(subscriber)}
														isIconOnly
														title='Edit subscriber'>
														<Edit className='w-4 h-4' />
													</Button>
													<Button
														variant='light'
														color='danger'
														onPress={() => openDeleteModal(subscriber)}
														isIconOnly
														title='Delete subscriber'>
														<Trash2 className='w-4 h-4' />
													</Button>
												</div>
											</td>
										)}
									</tr>
								))
							)}
						</tbody>
					</table>
				</div>

				<div className='flex justify-between items-center px-6 py-3 border-t border-gray-200 bg-gray-50'>
					<div className='flex gap-2'>
						<Button
							onPress={() => setCurrentPage(currentPage - 1)}
							isDisabled={currentPage === 1}
							variant='flat'
							size='sm'
							color={currentPage === 1 ? 'default' : 'primary'}>
							Previous
						</Button>
						<Button
							onPress={() => setCurrentPage(currentPage + 1)}
							isDisabled={currentPage >= totalPages}
							variant='flat'
							size='sm'
							color={currentPage >= totalPages ? 'default' : 'primary'}>
							Next
						</Button>
					</div>
					<Pagination
						total={totalPages}
						page={currentPage}
						initialPage={1}
						onChange={(page) => setCurrentPage(page)}
					/>
				</div>
			</div>

			{/* Create/Edit Modal */}
			<SubscriberForm
				selectedSubscriber={selectedSubscriber}
				showCreateModal={showCreateModal}
				showEditModal={showEditModal}
				setShowCreateModal={setShowCreateModal}
				setShowEditModal={setShowEditModal}
				formData={formData}
				setFormData={setFormData}
				setSelectedSubscriber={setSelectedSubscriber}
				saveLoading={saveLoading}
				successMessage={successMessage}
				setSuccessMessage={setSuccessMessage}
				handleSave={handleSave}
				isOpen={showCreateModal || showEditModal}
				onClose={() => {
					setShowCreateModal(false);
					setShowEditModal(false);
				}}
			/>

			{/* Delete Confirmation Modal */}
			<SubscriberDelete
				showDeleteModal={showDeleteModal}
				setShowDeleteModal={setShowDeleteModal}
				selectedSubscriber={selectedSubscriber}
				successMessage={successMessage}
				deleteLoading={deleteLoading}
				handleDelete={handleDelete}
			/>
		</div>
	);
}
