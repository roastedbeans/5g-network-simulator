import React, { useEffect, useRef } from 'react';
import { Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, Button } from '@heroui/react';
import { Spinner } from '@heroui/react';
import { TransformComponent, TransformWrapper, useControls } from 'react-zoom-pan-pinch';
import { LucidePlus, LucideMinus, LucideRefreshCcw } from 'lucide-react';
// We'll use a different approach to import mermaid
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

	// Sample 5G roaming protocol diagram in Mermaid syntax
	const roamingDiagram = `
    sequenceDiagram
      participant UE as UE (HPLMN)
      participant VRAN as Visited RAN
      participant VAMF as V-AMF
      participant VSMF as V-SMF
      participant VUPF as V-UPF
      participant HAMF as H-AMF
      participant HSMF as H-SMF
      participant HUPF as H-UPF
      participant AUSF as AUSF
      participant UDM as UDM
      
      UE->>VRAN: Initial Attach Request
      VRAN->>VAMF: N2 Setup Request
      VAMF->>HAMF: N14 Registration Request
      HAMF->>AUSF: N12 Authentication Request
      AUSF->>UDM: N13 Authentication Info Request
      UDM-->>AUSF: N13 Authentication Info Response
      AUSF-->>HAMF: N12 Authentication Response
      HAMF-->>VAMF: N14 Registration Accept
      VAMF->>VSMF: N11 Session Establishment
      VSMF->>HSMF: N16 Session Establishment
      HSMF->>HUPF: N4 Session Establishment
      VSMF->>VUPF: N4 Session Establishment
      VUPF->>HUPF: N9 User Plane Connection
      VAMF-->>UE: Registration Accept
      UE->>VAMF: PDU Session Request
      VAMF->>VSMF: N11 PDU Session Creation
      VSMF->>HSMF: N16 PDU Session Creation
      HSMF-->>VSMF: N16 PDU Session Confirm
      VSMF-->>VAMF: N11 PDU Session Confirm
      VAMF-->>UE: PDU Session Establish
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

				// Initialize mermaid
				mermaid.initialize({
					startOnLoad: true,
					theme: 'default',
					securityLevel: 'loose',
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
			size='4xl'>
			<ModalContent>
				<TransformWrapper
					initialScale={1}
					initialPositionX={200}
					initialPositionY={100}>
					<ModalHeader>
						<h4>5G Roaming Protocol Diagram</h4>
					</ModalHeader>

					<ModalBody>
						<TransformComponent
							wrapperStyle={{
								width: '100%',
								height: '100%',
							}}>
							<div className='bg-white dark:bg-gray-800 p-4 rounded-lg h-[40vh] w-3xl'>
								{typeof window !== 'undefined' ? (
									<div
										ref={diagramRef}
										className='mermaid'>
										<Spinner size='sm' />
									</div>
								) : (
									<Spinner size='sm' />
								)}
							</div>
						</TransformComponent>
					</ModalBody>
					<ModalFooter className='flex items-center justify-between'>
						<Controls />
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
