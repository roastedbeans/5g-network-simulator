'use client';

import React from 'react';
import { X, RefreshCw } from 'lucide-react';
import { Subscriber } from '@/services/subscriber-service';
import { Modal, ModalBody, ModalContent, ModalHeader, ModalFooter } from '@heroui/react';
import { Button } from '@heroui/react';

interface SubscriberDeleteProps {
	showDeleteModal: boolean;
	setShowDeleteModal: (showDeleteModal: boolean) => void;
	selectedSubscriber: Subscriber | null;
	successMessage: string | null;
	deleteLoading: boolean;
	handleDelete: () => void;
}
const SubscriberDelete = ({
	showDeleteModal,
	setShowDeleteModal,
	selectedSubscriber,
	successMessage,
	deleteLoading,
	handleDelete,
}: SubscriberDeleteProps) => {
	return (
		<Modal
			isOpen={showDeleteModal}
			onClose={() => setShowDeleteModal(false)}
			isDismissable>
			<ModalContent>
				<ModalHeader>
					<h3 className='text-lg font-semibold text-gray-900 mb-4'>Confirm Deletion</h3>
				</ModalHeader>
				<ModalBody>
					<p className='text-gray-600'>
						Are you sure you want to delete subscriber with IMSI{' '}
						<strong className='font-mono'>{selectedSubscriber?.imsi}</strong>? This action cannot be undone.
					</p>
					<div className='flex justify-between'>
						{successMessage && (
							<div className='flex items-center text-green-600'>
								<div className='w-5 h-5 mr-2 rounded-full bg-green-100 flex items-center justify-center'>
									<svg
										xmlns='http://www.w3.org/2000/svg'
										className='h-3 w-3'
										viewBox='0 0 20 20'
										fill='currentColor'>
										<path
											fillRule='evenodd'
											d='M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z'
											clipRule='evenodd'
										/>
									</svg>
								</div>
								<span className='text-sm'>{successMessage}</span>
							</div>
						)}
					</div>
				</ModalBody>
				<ModalFooter>
					<Button
						onPress={() => setShowDeleteModal(false)}
						isDisabled={deleteLoading}
						variant='flat'
						color='default'>
						Cancel
					</Button>
					<Button
						onPress={handleDelete}
						isDisabled={deleteLoading}
						color='danger'>
						{deleteLoading ? (
							<>
								<RefreshCw className='w-4 h-4 mr-2 animate-spin' />
								Deleting...
							</>
						) : (
							'Delete'
						)}
					</Button>
				</ModalFooter>
			</ModalContent>
		</Modal>
	);
};

export default SubscriberDelete;
