export interface Vector2D {
	x: number;
	y: number;
}

export type NetworkFunctionType =
	| 'AMF'
	| 'SMF'
	| 'UPF'
	| 'AUSF'
	| 'UDM'
	| 'NRF' // Core Network Functions
	| 'SEPP' // Security Edge Protection Proxy
	| 'PCF'
	| 'NSSF'
	| 'NEF' // Additional Core Functions (Optional for basic roaming)
	| 'gNodeB' // Radio Access Network
	| 'UE'; // User Equipment

export type NetworkRole = 'home' | 'visited';

export interface PLMN {
	id: string; // e.g., MCC-MNC like "310-260"
	name: string; // e.g., "HPLMN Example" or "VPLMN Example"
	role: NetworkRole;
}

export interface NetworkFunction {
	id: string;
	slug: string; // URL-friendly version of name (e.g., "h-amf-1")
	type: NetworkFunctionType;
	name: string; // e.g., "H-AMF-1", "V-gNodeB-West"
	plmn: PLMN; // Reference to the PLMN this function belongs to
	status: 'active' | 'inactive' | 'error';
	connections: Connection[]; // References to Connection objects or IDs
	position: Vector2D;
	messages?: Message[]; // Optional: References to Message objects or IDs
	ipAddress?: string; // IP Address for relevant functions (UPF, gNodeB, UE)
	description?: string; // Description of the network function's purpose
}

// N1: UE <-> AMF
// N2: gNodeB <-> AMF
// N3: gNodeB <-> UPF
// N4: SMF <-> UPF
// N6: UPF <-> Data Network (DN)
// N8: AMF <-> UDM (Authentication/Subscription)
// N9: V-UPF <-> H-UPF (Home Routed Roaming Data Path)
// N10: V-SMF <-> H-SMF (Session Management Control)
// N11: AMF <-> SMF (Session Management Request)
// N12: AMF <-> AUSF (Authentication)
// N13: UDM <-> AUSF (Authentication Data)
// N14: V-AMF <-> H-AMF (Access Management Control)
// N15: AMF <-> PCF (Policy Control) - Optional for now
// N32: SEPP <-> SEPP (Security Edge Protection Proxy for inter-PLMN N14, N10 etc.) - Simplified for now
export type ProtocolType =
	| 'N1'
	| 'N2'
	| 'N3'
	| 'N4'
	| 'N6'
	| 'N8'
	| 'N9'
	| 'N10'
	| 'N11'
	| 'N12'
	| 'N13'
	| 'N14'
	| 'N15'
	| 'N32';

export interface Connection {
	id: string;
	source: string; // Network Function slug
	target: string; // Network Function slug
	protocol: ProtocolType;
	status: 'active' | 'inactive' | 'error';
	sourceName?: string; // Name of source function for display and lookup
	targetName?: string; // Name of target function for display and lookup
	label?: string; // Optional display label for the connection
	// Handle properties for edges
	sourceHandle?: string; // Optional handle ID for source
	targetHandle?: string; // Optional handle ID for target
}

export enum MessageType {
	REGISTRATION_REQUEST,
	AUTHENTICATION_REQUEST,
	AUTHENTICATION_RESPONSE,
	SECURITY_MODE_COMMAND,
	SECURITY_MODE_COMPLETE,
	REGISTRATION_ACCEPT,
	REGISTRATION_COMPLETE,
	PDU_SESSION_ESTABLISHMENT_REQUEST,
	PDU_SESSION_ESTABLISHMENT_ACCEPT,
	PDU_SESSION_ESTABLISHMENT_REJECT,
	// Add more message types as needed for roaming procedures
}

export interface SecurityContext {
	// Define security context details (e.g., keys, algorithms)
	id?: string; // Original id field made optional for backward compatibility
	keyId?: string; // Identifier for the security context
	algorithm: string; // Algorithm type (e.g., '5G-AKA')
	integrityProtected?: boolean; // Made optional
	cipheringEnabled?: boolean; // Made optional
	cipherKey?: string; // Key for ciphering operations
	integrityKey?: string; // Key for integrity protection
	timestamp?: Date; // When the security context was created
}

export interface Message {
	id: string;
	type: MessageType;
	source: string; // Network Function ID
	destination: string; // Network Function ID
	payload: unknown; // Specific message content
	timestamp: Date;
	securityContext?: SecurityContext;
	description?: string; // Optional description for visualization
	status?: 'sent' | 'received' | 'processing' | 'error'; // Message status tracking
	protocol?: ProtocolType; // The protocol used for the message
	size?: number; // Size of the message in bytes
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
