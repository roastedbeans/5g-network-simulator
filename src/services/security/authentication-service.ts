import { v4 as uuidv4 } from 'uuid';
import { SecurityContext } from '@/types/network';
import { createMessage } from '../simulator/message-service';

/**
 * Implements the 5G-AKA (Authentication and Key Agreement) protocol
 *
 * Flow:
 * 1. UE -> AMF: Authentication Request
 * 2. AMF -> AUSF: Authentication Request
 * 3. AUSF -> UDM: Authentication Info Request
 * 4. UDM -> AUSF: Authentication Info Response (with vectors)
 * 5. AUSF -> AMF: Authentication Response
 * 6. AMF -> UE: Authentication Challenge
 * 7. UE -> AMF: Authentication Response
 * 8. AMF -> AUSF: Confirmation Request
 * 9. AUSF -> AMF: Confirmation Response
 * 10. AMF -> UE: Success/Failure
 */
export async function simulate5GAKA(ueId: string, amfId: string, ausfId: string, udmId: string) {
	// Step 1: UE -> AMF: Authentication Request
	const authRequest = await createMessage(
		ueId,
		amfId,
		'REQUEST',
		{
			supi: `imsi-${Math.floor(100000000000000 + Math.random() * 900000000000000)}`,
			authType: '5G-AKA',
		},
		'N1'
	);

	// Step 2: AMF -> AUSF: Authentication Request
	const amfToAusfRequest = await createMessage(
		amfId,
		ausfId,
		'REQUEST',
		{
			supi: (authRequest.payload as any).supi,
			servingNetworkName: 'open5gs.org',
		},
		'N8'
	);

	// Step 3: AUSF -> UDM: Authentication Info Request
	const ausfToUdmRequest = await createMessage(
		ausfId,
		udmId,
		'REQUEST',
		{
			supi: (amfToAusfRequest.payload as any).supi,
			servingNetworkName: (amfToAusfRequest.payload as any).servingNetworkName,
			resynchronizationInfo: null,
		},
		'N8'
	);

	// Step 4: UDM -> AUSF: Authentication Info Response
	const authVectors = generateAuthVectors();
	const udmToAusfResponse = await createMessage(
		udmId,
		ausfId,
		'RESPONSE',
		{
			authType: '5G-AKA',
			authenticationVector: authVectors,
		},
		'N8'
	);

	// Step 5: AUSF -> AMF: Authentication Response
	const ausfToAmfResponse = await createMessage(
		ausfId,
		amfId,
		'RESPONSE',
		{
			authType: '5G-AKA',
			authData: {
				rand: authVectors.rand,
				autn: authVectors.autn,
			},
		},
		'N8'
	);

	// Step 6: AMF -> UE: Authentication Challenge
	const amfToUeChallenge = await createMessage(
		amfId,
		ueId,
		'REQUEST',
		{
			authType: '5G-AKA',
			rand: authVectors.rand,
			autn: authVectors.autn,
		},
		'N1'
	);

	// Step 7: UE -> AMF: Authentication Response
	const ueResponse = generateUEAuthResponse(authVectors.rand, authVectors.autn, authVectors.xres);
	const ueToAmfResponse = await createMessage(
		ueId,
		amfId,
		'RESPONSE',
		{
			res: ueResponse.res,
		},
		'N1'
	);

	// Step 8: AMF -> AUSF: Confirmation Request
	const amfToAusfConfirmRequest = await createMessage(
		amfId,
		ausfId,
		'REQUEST',
		{
			supi: (authRequest.payload as any).supi,
			res: (ueToAmfResponse.payload as any).res,
		},
		'N8'
	);

	// Step 9: AUSF -> AMF: Confirmation Response
	const isAuthenticated = ueResponse.res === authVectors.xres;
	const ausfToAmfConfirmResponse = await createMessage(
		ausfId,
		amfId,
		'RESPONSE',
		{
			authResult: isAuthenticated ? 'SUCCESS' : 'FAILURE',
			supi: (authRequest.payload as any).supi,
		},
		'N8'
	);

	// Step 10: AMF -> UE: Success/Failure
	const securityContext = isAuthenticated ? generateSecurityContext(authVectors) : undefined;

	const amfToUeFinal = await createMessage(
		amfId,
		ueId,
		isAuthenticated ? 'RESPONSE' : 'ERROR',
		{
			authResult: isAuthenticated ? 'SUCCESS' : 'FAILURE',
			...(isAuthenticated ? { kseaf: authVectors.kseaf } : {}),
		},
		'N1',
		securityContext
	);

	return {
		isAuthenticated,
		securityContext,
		messageFlow: [
			authRequest,
			amfToAusfRequest,
			ausfToUdmRequest,
			udmToAusfResponse,
			ausfToAmfResponse,
			amfToUeChallenge,
			ueToAmfResponse,
			amfToAusfConfirmRequest,
			ausfToAmfConfirmResponse,
			amfToUeFinal,
		],
	};
}

/**
 * Generate authentication vectors for 5G-AKA
 */
function generateAuthVectors() {
	// In a real implementation, these would be generated using cryptographic functions
	return {
		rand: generateRandomHex(32), // 128-bit random challenge
		autn: generateRandomHex(32), // 128-bit authentication token
		xres: generateRandomHex(16), // 64-bit expected response
		kseaf: generateRandomHex(64), // 256-bit key for SEAF
		kausf: generateRandomHex(64), // 256-bit key for AUSF
	};
}

/**
 * Simulate UE authentication response
 */
function generateUEAuthResponse(rand: string, autn: string, xres: string) {
	// In a real implementation, these would be calculated using the USIM and cryptographic functions
	// For simulation, we'll just return the expected response with a small chance of error
	const errorRate = 0.05; // 5% chance of authentication error for simulation purposes
	const shouldFail = Math.random() < errorRate;

	return {
		res: shouldFail ? generateRandomHex(16) : xres,
	};
}

/**
 * Generate a security context from authentication vectors
 */
function generateSecurityContext(authVectors: any): SecurityContext {
	return {
		keyId: uuidv4(),
		algorithm: '5G-AKA',
		cipherKey: authVectors.kseaf.substring(0, 32),
		integrityKey: authVectors.kseaf.substring(32, 64),
		timestamp: new Date(),
	};
}

/**
 * Generate a random hex string of specified length
 */
function generateRandomHex(length: number): string {
	let result = '';
	const characters = '0123456789abcdef';
	for (let i = 0; i < length; i++) {
		result += characters.charAt(Math.floor(Math.random() * characters.length));
	}
	return result;
}

/**
 * Get Authentication and Security Event flow as a mermaid diagram
 */
export function getAuthenticationFlowDiagram() {
	return `
sequenceDiagram
  participant UE as User Equipment
  participant AMF
  participant AUSF
  participant UDM
  
  UE->>AMF: Authentication Request (SUPI)
  AMF->>AUSF: Authentication Request
  AUSF->>UDM: Authentication Info Request
  UDM-->>AUSF: Authentication Vectors
  AUSF-->>AMF: Authentication Response (RAND, AUTN)
  AMF-->>UE: Authentication Challenge
  UE->>AMF: Authentication Response (RES)
  AMF->>AUSF: Confirmation Request
  AUSF-->>AMF: Confirmation Response
  AMF-->>UE: Authentication Success/Failure
  
  Note over UE,AMF: Security Context Established
  `;
}

/**
 * Get Key Hierarchy diagram as a mermaid diagram
 */
export function getKeyHierarchyDiagram() {
	return `
graph TD
  K["K (USIM Permanent Key)"]
  CK["CK (Cipher Key)"]
  IK["IK (Integrity Key)"]
  K --> CK
  K --> IK
  CK --> KAUSF["KAUSF (AUSF Key)"]
  IK --> KAUSF
  KAUSF --> KSEAF["KSEAF (SEAF Key)"]
  KSEAF --> KAMF["KAMF (AMF Key)"]
  KAMF --> KNASint["KNASint (NAS Integrity Key)"]
  KAMF --> KNASenc["KNASenc (NAS Encryption Key)"]
  KAMF --> KgNBenc["KgNB (gNB Encryption Key)"]
  KgNBenc --> KUPenc["KUPenc (User Plane Encryption)"]
  KgNBenc --> KRRCint["KRRCint (RRC Integrity)"]
  KgNBenc --> KRRCenc["KRRCenc (RRC Encryption)"]
  `;
}
