export type NetworkFunctionType = '5GC' | 'RAN' | 'UE' | 'AMF' | 'SMF' | 'UPF' | 'AUSF' | 'UDM';
export type NetworkFunctionStatus = 'active' | 'inactive' | 'error';
export type ProtocolType = 'N1' | 'N2' | 'N3' | 'N4' | 'N6' | 'N8' | 'N11';
export type MessageType = 'REQUEST' | 'RESPONSE' | 'NOTIFICATION' | 'ERROR';
export type ConnectionStatus = 'active' | 'inactive' | 'error';

export interface Vector2D {
	x: number;
	y: number;
}

export interface SecurityContext {
	keyId: string;
	algorithm: string;
	cipherKey?: string;
	integrityKey?: string;
	timestamp: Date;
}

export interface NetworkFunction {
	id: string;
	name: string;
	type: NetworkFunctionType;
	status: NetworkFunctionStatus;
	connections: string[]; // Connection IDs
	position: Vector2D;
	messages: string[]; // Message IDs
	description?: string;
	ipAddress?: string;
	createdAt?: Date;
	updatedAt?: Date;
}

export interface Connection {
	id: string;
	source: string; // Network Function ID
	target: string; // Network Function ID
	protocol: ProtocolType;
	status: ConnectionStatus;
	latency?: number; // in ms
	bandwidth?: number; // in Mbps
	createdAt?: Date;
	updatedAt?: Date;
}

export interface Message {
	id: string;
	type: MessageType;
	source: string; // Network Function ID
	destination: string; // Network Function ID
	protocol?: ProtocolType;
	payload: unknown;
	timestamp: Date;
	securityContext?: SecurityContext;
	status?: 'sent' | 'received' | 'processing' | 'error';
	size?: number; // in bytes
}

export interface Simulation {
	id: string;
	name: string;
	description?: string;
	networkFunctions: string[]; // NetworkFunction IDs
	connections: string[]; // Connection IDs
	messages: string[]; // Message IDs
	status: 'running' | 'paused' | 'stopped' | 'completed';
	startTime?: Date;
	endTime?: Date;
	createdAt?: Date;
	updatedAt?: Date;
}
