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
	Users,
} from 'lucide-react';
import SubscriberForm from './SubscriberForm';
import BulkSubscriberForm from './BulkSubscriberForm';
import { Subscriber } from '@/services/subscriber-service';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
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
	const [sortColumn, setSortColumn] = useState('imsi');
	const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
	const [currentPage, setCurrentPage] = useState(1);
	const [searchQuery, setSearchQuery] = useState('');
	const [selectedSubscriber, setSelectedSubscriber] = useState<Subscriber | null>(null);
	const [formData, setFormData] = useState<Partial<Subscriber>>({});

	// Modal states
	const [showCreateModal, setShowCreateModal] = useState(false);
	const [showEditModal, setShowEditModal] = useState(false);
	const [showViewModal, setShowViewModal] = useState(false);
	const [showDeleteModal, setShowDeleteModal] = useState(false);
	const [showBulkCreateModal, setShowBulkCreateModal] = useState(false);
	const [showRemoveAllModal, setShowRemoveAllModal] = useState(false);
	const [showColumnModal, setShowColumnModal] = useState(false);
	const [showStatusFilter, setShowStatusFilter] = useState(false);
	const [activeTab, setActiveTab] = useState('basic');

	// Load subscribers
	const loadSubscribers = useCallback(async () => {
		setLoading(true);
		try {
			const response = await fetch(
				`/api/subscribers?page=${currentPage}&limit=${rowsPerPage}&search=${searchQuery}&status=${statusFilter}&sortBy=${sortColumn}&sortOrder=${sortDirection}`
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
	}, [currentPage, rowsPerPage, searchQuery, statusFilter, sortColumn, sortDirection]);

	useEffect(() => {
		loadSubscribers();
	}, [loadSubscribers]);

	// Use API pagination data - subscribers are already sorted and paginated by server
	const totalPages = apiTotalPages || Math.ceil(totalSubscribers / rowsPerPage);
	const paginatedSubscribers = subscribers;

	// Handlers
	const handleSort = (column: string) => {
		if (sortColumn === column) {
			setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
		} else {
			setSortColumn(column);
			setSortDirection('asc');
		}
		// Reset to first page when sorting changes
		setCurrentPage(1);
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
			amf: DEFAULT_AMF,
			sqn: DEFAULT_SQN,
			k: DEFAULT_KEY,
			opc: DEFAULT_OPC,
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
				// Create new subscriber (or update if IMSI exists)
				const response = await fetch('/api/subscribers', {
					method: 'POST',
					headers: {
						'Content-Type': 'application/json',
					},
					body: JSON.stringify(formData),
				});

				if (!response.ok) {
					const errorData = await response.json();
					throw new Error(errorData.error || 'Failed to create/update subscriber');
				}

				const result = await response.json();
				const operation = result._operation || 'created';
				setSuccessMessage(`Subscriber ${formData.imsi} ${operation} successfully`);
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

	const handleRemoveAll = async () => {
		setDeleteLoading(true);
		try {
			const response = await fetch('/api/subscribers', {
				method: 'DELETE',
			});

			if (!response.ok) {
				const errorData = await response.json();
				throw new Error(errorData.error || 'Failed to delete all subscribers');
			}

			const result = await response.json();

			// Refresh the subscriber list
			await loadSubscribers();
			setShowRemoveAllModal(false);
			setSelectedSubscribers(new Set()); // Clear selection

			// Show success message
			alert(result.message || `Successfully deleted ${result.deletedCount} subscribers`);
		} catch (error: any) {
			console.error('Error deleting all subscribers:', error);
			alert(error.message || 'Failed to delete all subscribers');
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
							<div className='relative'>
								<Search className='w-5 h-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2' />
								<Input
									type='text'
									placeholder='Search by IMSI or MSISDN...'
									value={searchQuery}
									onChange={(e) => setSearchQuery(e.target.value)}
									className='pl-10 pr-10'
								/>
								{searchQuery && (
									<Button
										onClick={() => setSearchQuery('')}
										variant='ghost'
										size='sm'
										className='absolute right-1 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0'>
										<X className='w-4 h-4' />
									</Button>
								)}
							</div>
						</div>

						{/* Action Buttons */}
						<div className='flex gap-2 flex-wrap'>
							{/* Status Filter */}
							<div className='relative'>
								<Button
									onClick={() => setShowStatusFilter(!showStatusFilter)}
									variant='outline'>
									<Filter className='w-4 h-4' />
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
									onClick={() => setShowColumnModal(!showColumnModal)}
									variant='outline'
									title='Columns'>
									<MoreVertical className='w-4 h-4' />
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
								onClick={loadSubscribers}
								disabled={loading}
								variant='outline'>
								<RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
								{loading ? 'Loading...' : 'Refresh'}
							</Button>

							{/* Add Subscriber buttons */}
							<Button onClick={openCreateModal}>
								<Plus className='w-4 h-4' />
								Add Subscriber
							</Button>
							<Button
								onClick={() => setShowBulkCreateModal(true)}
								variant='outline'>
								<Users className='w-4 h-4' />
								Bulk Create
							</Button>

							{/* Remove All button - only show if there are subscribers */}
							{totalSubscribers > 0 && (
								<Button
									onClick={() => setShowRemoveAllModal(true)}
									variant='destructive'>
									<X className='w-4 h-4' />
									Remove All
								</Button>
							)}
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
					<Table>
						<TableHeader>
							<TableRow>
								<TableHead className='w-12'>
									<input
										type='checkbox'
										checked={
											selectedSubscribers.size === paginatedSubscribers.length && paginatedSubscribers.length > 0
										}
										onChange={handleSelectAll}
										className='rounded border-gray-300'
									/>
								</TableHead>
								{COLUMNS.filter((col) => visibleColumns.has(col.key)).map((column) => (
									<TableHead key={column.key}>
										{column.sortable ? (
											<Button
												onClick={() => handleSort(column.key)}
												variant='ghost'
												className='px-0 min-w-0 h-auto flex items-center hover:bg-transparent'>
												<span>{column.name}</span>
												{sortColumn === column.key ? (
													sortDirection === 'asc' ? (
														<ChevronUp className='w-4 h-4 ml-1' />
													) : (
														<ChevronDown className='w-4 h-4 ml-1' />
													)
												) : (
													<ChevronsUpDown className='w-4 h-4 ml-1 opacity-50' />
												)}
											</Button>
										) : (
											column.name
										)}
									</TableHead>
								))}
							</TableRow>
						</TableHeader>
						<TableBody>
							{loading ? (
								<TableRow>
									<TableCell
										colSpan={visibleColumns.size + 1}
										className='text-center py-12'>
										<div className='flex items-center justify-center'>
											<RefreshCw className='w-6 h-6 animate-spin text-gray-400 mr-2' />
											<span className='text-gray-500'>Loading...</span>
										</div>
									</TableCell>
								</TableRow>
							) : paginatedSubscribers.length === 0 ? (
								<TableRow>
									<TableCell
										colSpan={visibleColumns.size + 1}
										className='text-center py-12 text-gray-500'>
										No subscribers found
									</TableCell>
								</TableRow>
							) : (
								paginatedSubscribers.map((subscriber) => (
									<TableRow
										key={subscriber.id}
										className='hover:bg-gray-50'>
										<TableCell>
											<input
												type='checkbox'
												checked={selectedSubscribers.has(subscriber.id || '')}
												onChange={() => handleSelectSubscriber(subscriber.id || '')}
												className='rounded border-gray-300'
											/>
										</TableCell>
										{visibleColumns.has('imsi') && (
											<TableCell>
												<div>
													<div className='text-sm font-medium text-gray-900'>{subscriber.imsi}</div>
													<div className='text-sm text-gray-500'>{subscriber.id}</div>
												</div>
											</TableCell>
										)}
										{visibleColumns.has('msisdn') && (
											<TableCell className='text-sm text-gray-900'>{subscriber.msisdn || '-'}</TableCell>
										)}
										{visibleColumns.has('status') && (
											<TableCell>
												<span
													className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(
														subscriber.status
													)}`}>
													{subscriber.status}
												</span>
											</TableCell>
										)}

										{visibleColumns.has('created_at') && (
											<TableCell className='text-sm text-gray-900'>{formatDate(subscriber.created_at)}</TableCell>
										)}
										{visibleColumns.has('actions') && (
											<TableCell>
												<div className='flex items-center space-x-2'>
													<Button
														variant='ghost'
														onClick={() => openEditModal(subscriber)}
														size='sm'
														className='h-8 w-8 p-0'
														title='Edit subscriber'>
														<Edit className='w-4 h-4' />
													</Button>
													<Button
														variant='ghost'
														onClick={() => openDeleteModal(subscriber)}
														size='sm'
														className='h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50'
														title='Delete subscriber'>
														<Trash2 className='w-4 h-4' />
													</Button>
												</div>
											</TableCell>
										)}
									</TableRow>
								))
							)}
						</TableBody>
					</Table>
				</div>

				{/* Simple Pagination */}
				<div className='flex justify-between items-center px-6 py-3 border-t border-gray-200 bg-gray-50'>
					<div className='flex items-center gap-2'>
						<Button
							onClick={() => setCurrentPage(currentPage - 1)}
							disabled={currentPage === 1}
							variant='outline'
							size='sm'>
							Previous
						</Button>
						<span className='text-sm text-gray-600'>
							Page {currentPage} of {totalPages}
						</span>
						<Button
							onClick={() => setCurrentPage(currentPage + 1)}
							disabled={currentPage >= totalPages}
							variant='outline'
							size='sm'>
							Next
						</Button>
					</div>
					<div className='text-sm text-gray-600'>
						Showing {(currentPage - 1) * rowsPerPage + 1} to {Math.min(currentPage * rowsPerPage, totalSubscribers)} of{' '}
						{totalSubscribers} entries
					</div>
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

			{/* Remove All Confirmation Modal */}
			<Dialog
				open={showRemoveAllModal}
				onOpenChange={setShowRemoveAllModal}>
				<DialogContent className='sm:max-w-md'>
					<DialogHeader>
						<DialogTitle className='flex items-center gap-2 text-red-600'>
							<X className='w-5 h-5' />
							Remove All Subscribers
						</DialogTitle>
					</DialogHeader>
					<div className='py-4'>
						<p className='text-gray-700 mb-4'>
							Are you sure you want to remove <strong>all {totalSubscribers} subscribers</strong>? This action cannot be
							undone.
						</p>
						<div className='bg-red-50 border border-red-200 rounded-lg p-3'>
							<p className='text-red-800 text-sm font-medium'>⚠️ Warning</p>
							<p className='text-red-700 text-sm mt-1'>
								This will permanently delete all subscriber data from the database.
							</p>
						</div>
					</div>
					<div className='flex justify-end gap-3'>
						<Button
							onClick={() => setShowRemoveAllModal(false)}
							variant='outline'
							disabled={deleteLoading}>
							Cancel
						</Button>
						<Button
							onClick={handleRemoveAll}
							variant='destructive'
							disabled={deleteLoading}>
							{deleteLoading ? (
								<>
									<RefreshCw className='w-4 h-4 mr-2 animate-spin' />
									Removing...
								</>
							) : (
								<>
									<X className='w-4 h-4 mr-2' />
									Remove All
								</>
							)}
						</Button>
					</div>
				</DialogContent>
			</Dialog>

			{/* Bulk Create Modal */}
			<BulkSubscriberForm
				isOpen={showBulkCreateModal}
				onClose={() => setShowBulkCreateModal(false)}
				onSuccess={() => {
					loadSubscribers(); // Refresh the subscriber list
				}}
			/>
		</div>
	);
}
