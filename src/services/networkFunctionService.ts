import { NetworkFunction, NetworkFunctionType } from '@/types/network';

export async function fetchNetworkFunctions(): Promise<NetworkFunction[]> {
	const response = await fetch('/api/network-functions');

	if (!response.ok) {
		const error = await response.json();
		throw new Error(error.error || 'Failed to fetch network functions');
	}

	return response.json();
}

export async function fetchNetworkFunction(id: string): Promise<NetworkFunction> {
	const response = await fetch(`/api/network-functions/${id}`);

	if (!response.ok) {
		const error = await response.json();
		throw new Error(error.error || 'Failed to fetch network function');
	}

	return response.json();
}

export async function createNetworkFunction(data: {
	name: string;
	type: NetworkFunctionType;
	position: { x: number; y: number };
	description?: string;
}): Promise<NetworkFunction> {
	const response = await fetch('/api/network-functions', {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
		},
		body: JSON.stringify(data),
	});

	if (!response.ok) {
		const error = await response.json();
		throw new Error(error.error || 'Failed to create network function');
	}

	return response.json();
}

export async function updateNetworkFunction(
	id: string,
	data: Partial<Omit<NetworkFunction, 'id'>>
): Promise<NetworkFunction> {
	const response = await fetch(`/api/network-functions/${id}`, {
		method: 'PUT',
		headers: {
			'Content-Type': 'application/json',
		},
		body: JSON.stringify(data),
	});

	if (!response.ok) {
		const error = await response.json();
		throw new Error(error.error || 'Failed to update network function');
	}

	return response.json();
}

export async function deleteNetworkFunction(id: string): Promise<void> {
	const response = await fetch(`/api/network-functions/${id}`, {
		method: 'DELETE',
	});

	if (!response.ok) {
		const error = await response.json();
		throw new Error(error.error || 'Failed to delete network function');
	}
}
