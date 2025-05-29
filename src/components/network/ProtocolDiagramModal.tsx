import React, { useEffect, useRef } from 'react';
import { Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, Button } from '@heroui/react';
import { Spinner } from '@heroui/react';
import { TransformComponent, TransformWrapper, useControls } from 'react-zoom-pan-pinch';
import { LucidePlus, LucideMinus, LucideRefreshCcw } from 'lucide-react';

interface ProtocolDiagramModalProps {
	isOpen: boolean;
	onClose: () => void;
}

// Define the type for mermaid render result
interface MermaidRenderResult {
	svg: string;
	bindFunctions?: (element: Element) => void;
}

const Controls = () => {
	const { zoomIn, zoomOut, resetTransform } = useControls();

	return (
		<div className='flex items-center gap-2'>
			<Button
				onPress={() => zoomIn()}
				isIconOnly
				variant='bordered'>
				<LucidePlus size={16} />
			</Button>
			<Button
				onPress={() => zoomOut()}
				isIconOnly
				variant='bordered'>
				<LucideMinus size={16} />
			</Button>
			<Button
				onPress={() => resetTransform()}
				isIconOnly
				variant='bordered'>
				<LucideRefreshCcw size={16} />
			</Button>
		</div>
	);
};

const ProtocolDiagramModal: React.FC<ProtocolDiagramModalProps> = ({ isOpen, onClose }) => {
	const diagramRef = useRef<HTMLDivElement>(null);

	// Updated 5G roaming protocol diagram with SCP Model D
	const roamingDiagram = `
    sequenceDiagram
      participant UE as UE (HPLMN)
      participant VRAN as Visited RAN
      participant VAMF as V-AMF
      participant VSCP as V-SCP<br/>(Model D)
      participant VSMF as V-SMF
      participant VUPF as V-UPF
      participant HSCP as H-SCP<br/>(Model D)
      participant HAMF as H-AMF
      participant HSMF as H-SMF
      participant HUPF as H-UPF
      participant AUSF as AUSF
      participant UDM as UDM
      
      Note over VSCP,HSCP: SCP Model D provides indirect communication<br/>between visited and home network functions
      
      UE->>VRAN: Initial Attach Request
      VRAN->>VAMF: N2 Setup Request
      
      rect rgb(240, 248, 255)
        Note over VAMF,HAMF: Inter-PLMN Communication via SCP
        VAMF->>VSCP: N14 Registration Request
        VSCP->>HSCP: SBI Request (via SEPP)
        HSCP->>HAMF: N14 Registration Request
        HAMF->>HSCP: Forward to AUSF
        HSCP->>AUSF: N12 Authentication Request
        AUSF->>UDM: N13 Authentication Info Request
        UDM-->>AUSF: N13 Authentication Info Response
        AUSF-->>HSCP: N12 Authentication Response
        HSCP-->>HAMF: Authentication Complete
        HAMF-->>HSCP: N14 Registration Accept
        HSCP-->>VSCP: SBI Response (via SEPP)
        VSCP-->>VAMF: N14 Registration Accept
      end
      
      VAMF->>VSMF: N11 Session Establishment
      
      rect rgb(255, 248, 240)
        Note over VSMF,HSMF: Session Management via SCP
        VSMF->>VSCP: N16 Session Request
        VSCP->>HSCP: SBI Request (via SEPP)
        HSCP->>HSMF: N16 Session Establishment
        HSMF->>HUPF: N4 Session Establishment
        HSMF-->>HSCP: N16 Session Response
        HSCP-->>VSCP: SBI Response (via SEPP)
        VSCP-->>VSMF: N16 Session Confirm
      end
      
      VSMF->>VUPF: N4 Session Establishment
      VUPF->>HUPF: N9 User Plane Connection
      VAMF-->>UE: Registration Accept
      
      UE->>VAMF: PDU Session Request
      VAMF->>VSMF: N11 PDU Session Creation
      
      rect rgb(240, 255, 240)
        Note over VSMF,HSMF: PDU Session Creation via SCP
        VSMF->>VSCP: N16 PDU Session Request
        VSCP->>HSCP: SBI Request (via SEPP)
        HSCP->>HSMF: N16 PDU Session Creation
        HSMF-->>HSCP: N16 PDU Session Confirm
        HSCP-->>VSCP: SBI Response (via SEPP)
        VSCP-->>VSMF: N16 PDU Session Confirm
      end
      
      VSMF-->>VAMF: N11 PDU Session Confirm
      VAMF-->>UE: PDU Session Establish
      
      Note over UE,UDM: SCP Model D enables scalable, load-balanced<br/>communication in roaming scenarios
  `;

	useEffect(() => {
		// Check if both conditions are met to avoid null checks in nested code
		if (!isOpen || !diagramRef.current) return;

		// Dynamically import mermaid within useEffect to ensure client-side only
		import('mermaid')
			.then((mermaidModule) => {
				const mermaid = mermaidModule.default;
				const element = diagramRef.current;

				// Additional null check to satisfy TypeScript
				if (!element) return;

				// Initialize mermaid with updated config for better SCP visualization
				mermaid.initialize({
					startOnLoad: true,
					theme: 'default',
					securityLevel: 'loose',
					sequence: {
						diagramMarginX: 50,
						diagramMarginY: 10,
						actorMargin: 50,
						width: 150,
						height: 65,
						boxMargin: 10,
						boxTextMargin: 5,
						noteMargin: 10,
						messageMargin: 35,
						mirrorActors: true,
						bottomMarginAdj: 1,
						useMaxWidth: true,
						rightAngles: false,
						showSequenceNumbers: false,
					},
				});

				// Clear previous renders
				element.innerHTML = '';

				// Render the diagram
				mermaid
					.render('mermaid-diagram', roamingDiagram)
					.then((result: MermaidRenderResult) => {
						// Check again in case element was removed during async operation
						if (element && diagramRef.current) {
							diagramRef.current.innerHTML = result.svg;
						}
					})
					.catch((error: Error) => console.error('Mermaid rendering failed:', error));
			})
			.catch((error) => {
				console.error('Failed to load mermaid library:', error);
			});
	}, [isOpen, roamingDiagram]);

	return (
		<Modal
			isOpen={isOpen}
			onClose={onClose}
			size='5xl'>
			<ModalContent>
				<TransformWrapper
					initialScale={2.5}
					initialPositionX={100}
					initialPositionY={0}>
					<ModalHeader>
						<div>
							<h4>5G Roaming Protocol Diagram with SCP Model D</h4>
							<p className='text-sm text-gray-600 dark:text-gray-400'>
								Service Communication Proxy enables indirect communication between network functions
							</p>
						</div>
					</ModalHeader>

					<ModalBody>
						<TransformComponent
							wrapperStyle={{
								width: '100%',
								height: '100%',
							}}>
							<div className='bg-white dark:bg-gray-800 p-4 rounded-lg h-[50vh] w-full overflow-auto'>
								{typeof window !== 'undefined' ? (
									<div
										ref={diagramRef}
										className='mermaid w-full'>
										<div className='flex items-center justify-center h-full'>
											<Spinner size='lg' />
										</div>
									</div>
								) : (
									<div className='flex items-center justify-center h-full'>
										<Spinner size='lg' />
									</div>
								)}
							</div>
						</TransformComponent>
					</ModalBody>
					<ModalFooter className='flex items-center justify-between'>
						<div className='flex flex-col gap-1'>
							<Controls />
							<div className='text-xs text-gray-500'>
								<div className='flex gap-4'>
									<span>🔵 Authentication Flow</span>
									<span>🟠 Session Management</span>
									<span>🟢 PDU Session</span>
								</div>
							</div>
						</div>
						<Button
							onPress={onClose}
							variant='solid'>
							Close
						</Button>
					</ModalFooter>
				</TransformWrapper>
			</ModalContent>
		</Modal>
	);
};

export default ProtocolDiagramModal;
