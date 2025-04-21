import { NetworkFunction, NetworkFunctionType, Vector2D } from '@/types/network';

// Client-side API service for network functions
// This avoids the "Cannot read properties of undefined (reading 'NetworkFunction')" error
// by providing a clean separation between client and server code

/**
 * Get all network functions
 */
export async function getAllNetworkFunctions(): Promise<NetworkFunction[]> {
	try {
		const response = await fetch('/api/network-functions');
		if (!response.ok) {
			throw new Error(`Error: ${response.status}`);
		}
		return await response.json();
	} catch (error) {
		console.error('Failed to fetch network functions:', error);
		return [];
	}
}

/**
 * Get a network function by ID
 */
export async function getNetworkFunctionById(id: string): Promise<NetworkFunction | null> {
	try {
		const response = await fetch(`/api/network-functions/${id}`);
		if (!response.ok) {
			if (response.status === 404) {
				return null;
			}
			throw new Error(`Error: ${response.status}`);
		}
		return await response.json();
	} catch (error) {
		console.error(`Failed to fetch network function ${id}:`, error);
		return null;
	}
}

/**
 * Create a new network function
 */
export async function createNetworkFunction(networkFunction: {
	name: string;
	type: NetworkFunctionType;
	position: Vector2D;
	description?: string;
	ipAddress?: string;
}): Promise<NetworkFunction | null> {
	try {
		const response = await fetch('/api/network-functions', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
			},
			body: JSON.stringify(networkFunction),
		});

		if (!response.ok) {
			throw new Error(`Error: ${response.status}`);
		}

		return await response.json();
	} catch (error) {
		console.error('Failed to create network function:', error);
		return null;
	}
}

/**
 * Update a network function
 */
export async function updateNetworkFunction(
	id: string,
	data: Partial<Omit<NetworkFunction, 'id'>>
): Promise<NetworkFunction | null> {
	try {
		const response = await fetch(`/api/network-functions/${id}`, {
			method: 'PUT',
			headers: {
				'Content-Type': 'application/json',
			},
			body: JSON.stringify(data),
		});

		if (!response.ok) {
			throw new Error(`Error: ${response.status}`);
		}

		return await response.json();
	} catch (error) {
		console.error(`Failed to update network function ${id}:`, error);
		return null;
	}
}

/**
 * Delete a network function
 */
export async function deleteNetworkFunction(id: string): Promise<boolean> {
	try {
		const response = await fetch(`/api/network-functions/${id}`, {
			method: 'DELETE',
		});

		if (!response.ok) {
			throw new Error(`Error: ${response.status}`);
		}

		return true;
	} catch (error) {
		console.error(`Failed to delete network function ${id}:`, error);
		return false;
	}
}

/**
 * Change network function status
 */
export async function changeNetworkFunctionStatus(
	id: string,
	status: 'active' | 'inactive' | 'error'
): Promise<NetworkFunction | null> {
	return updateNetworkFunction(id, { status });
}
