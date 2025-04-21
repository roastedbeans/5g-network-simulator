import { v4 as uuidv4 } from 'uuid';
import { Message, MessageType, ProtocolType, SecurityContext } from '@/types/network';
import MessageModel from '@/models/Message';
import NetworkFunctionModel from '@/models/NetworkFunction';
import ConnectionModel from '@/models/Connection';

/**
 * Create a new message between network functions
 */
export async function createMessage(
	sourceId: string,
	destinationId: string,
	type: MessageType,
	payload: unknown,
	protocol?: ProtocolType,
	securityContext?: SecurityContext,
	size?: number
): Promise<Message> {
	// Validate that both network functions exist
	const [source, destination] = await Promise.all([
		NetworkFunctionModel.findOne({ id: sourceId }),
		NetworkFunctionModel.findOne({ id: destinationId }),
	]);

	if (!source || !destination) {
		throw new Error('Source or destination network function not found');
	}

	// Validate that a connection exists between the network functions
	if (protocol) {
		const connection = await ConnectionModel.findOne({
			source: sourceId,
			target: destinationId,
			protocol,
		});

		if (!connection) {
			throw new Error(`No ${protocol} connection exists between the specified network functions`);
		}

		if (connection.status !== 'active') {
			throw new Error(`Connection is not active (status: ${connection.status})`);
		}
	}

	const message = await MessageModel.create({
		id: uuidv4(),
		type,
		source: sourceId,
		destination: destinationId,
		protocol,
		payload,
		timestamp: new Date(),
		securityContext,
		status: 'sent',
		size,
	});

	// Update the messages array in both network functions
	await Promise.all([
		NetworkFunctionModel.findOneAndUpdate({ id: sourceId }, { $push: { messages: message.id } }),
		NetworkFunctionModel.findOneAndUpdate({ id: destinationId }, { $push: { messages: message.id } }),
	]);

	return message;
}

/**
 * Get all messages
 */
export async function getMessages(): Promise<Message[]> {
	return MessageModel.find({}).sort({ timestamp: -1 });
}

/**
 * Get message by ID
 */
export async function getMessageById(id: string): Promise<Message | null> {
	return MessageModel.findOne({ id });
}

/**
 * Update message status
 */
export async function updateMessageStatus(
	id: string,
	status: 'sent' | 'received' | 'processing' | 'error'
): Promise<Message | null> {
	return MessageModel.findOneAndUpdate({ id }, { status }, { new: true });
}

/**
 * Get messages for a network function
 */
export async function getMessagesForNetworkFunction(networkFunctionId: string, limit = 50): Promise<Message[]> {
	return MessageModel.find({
		$or: [{ source: networkFunctionId }, { destination: networkFunctionId }],
	})
		.sort({ timestamp: -1 })
		.limit(limit);
}

/**
 * Get messages for a connection
 */
export async function getMessagesForConnection(
	sourceId: string,
	destinationId: string,
	protocol?: ProtocolType,
	limit = 50
): Promise<Message[]> {
	const query: any = {
		source: sourceId,
		destination: destinationId,
	};

	if (protocol) {
		query.protocol = protocol;
	}

	return MessageModel.find(query).sort({ timestamp: -1 }).limit(limit);
}

/**
 * Generate a security context for a message
 */
export function generateSecurityContext(algorithm = '5G-AKA'): SecurityContext {
	return {
		keyId: uuidv4(),
		algorithm,
		cipherKey: uuidv4(),
		integrityKey: uuidv4(),
		timestamp: new Date(),
	};
}

/**
 * Get message type description
 */
export function getMessageTypeInfo(type: MessageType) {
	const messageTypeInfo: Record<MessageType, { description: string }> = {
		REQUEST: {
			description: 'Request message that expects a response',
		},
		RESPONSE: {
			description: 'Response to a previous request',
		},
		NOTIFICATION: {
			description: 'One-way notification that does not expect a response',
		},
		ERROR: {
			description: 'Error message indicating a failure',
		},
	};

	return messageTypeInfo[type];
}
