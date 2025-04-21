import { useEffect, useRef } from 'react';
import mermaid from 'mermaid';

interface ProtocolDiagramProps {
	diagram: string;
	className?: string;
	config?: any;
}

export default function ProtocolDiagram({ diagram, className = '', config = {} }: ProtocolDiagramProps) {
	const diagramRef = useRef<HTMLDivElement>(null);
	const diagramId = useRef(`mermaid-${Math.random().toString(36).substring(2, 9)}`);

	useEffect(() => {
		if (diagramRef.current) {
			mermaid.initialize({
				startOnLoad: true,
				theme: 'default',
				securityLevel: 'loose',
				...config,
			});

			try {
				diagramRef.current.innerHTML = '';
				mermaid.render(diagramId.current, diagram).then(({ svg }) => {
					if (diagramRef.current) {
						diagramRef.current.innerHTML = svg;
					}
				});
			} catch (error) {
				console.error('Error rendering mermaid diagram:', error);
				if (diagramRef.current) {
					diagramRef.current.innerHTML = `
            <div class="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
              <p>Error rendering diagram: ${error instanceof Error ? error.message : 'Unknown error'}</p>
              <pre class="mt-2 text-xs overflow-auto">${diagram}</pre>
            </div>
          `;
				}
			}
		}
	}, [diagram, config]);

	return (
		<div className={`mermaid-diagram ${className}`}>
			<div
				ref={diagramRef}
				className='w-full overflow-auto'></div>
		</div>
	);
}

// Example: Authentication Flow Diagram
export function AuthenticationFlowDiagram() {
	const authFlowDiagram = `
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

	return <ProtocolDiagram diagram={authFlowDiagram} />;
}

// Example: Registration Procedure
export function RegistrationProcedureDiagram() {
	const registrationDiagram = `
sequenceDiagram
  participant UE as User Equipment
  participant RAN
  participant AMF
  participant SMF
  participant UDM
  participant AUSF
  
  UE->>RAN: RRC Connection Setup
  RAN->>UE: RRC Connection Setup Complete
  UE->>AMF: Registration Request
  AMF->>UE: Authentication Request
  UE->>AMF: Authentication Response
  AMF->>AUSF: Authentication Confirmation
  AUSF->>AMF: Authentication Confirmation Result
  AMF->>UDM: Registration/Location Update
  UDM->>AMF: Subscription Data
  AMF->>UE: Registration Accept
  UE->>AMF: Registration Complete
  `;

	return <ProtocolDiagram diagram={registrationDiagram} />;
}

// Example: PDU Session Establishment
export function PDUSessionEstablishmentDiagram() {
	const pduSessionDiagram = `
sequenceDiagram
  participant UE as User Equipment
  participant AMF
  participant SMF
  participant UPF
  
  UE->>AMF: PDU Session Establishment Request
  AMF->>SMF: Create SM Context Request
  SMF->>UPF: N4 Session Establishment
  UPF->>SMF: N4 Session Establishment Response
  SMF->>AMF: Create SM Context Response
  AMF->>UE: PDU Session Establishment Accept
  `;

	return <ProtocolDiagram diagram={pduSessionDiagram} />;
}

// Example: Key Hierarchy Diagram
export function KeyHierarchyDiagram() {
	const keyHierarchyDiagram = `
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

	return <ProtocolDiagram diagram={keyHierarchyDiagram} />;
}
