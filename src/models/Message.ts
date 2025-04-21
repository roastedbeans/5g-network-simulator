import mongoose, { Schema, model, Model, models } from 'mongoose';
import { Message } from '@/types/network';

const SecurityContextSchema = new Schema({
	keyId: { type: String, required: true },
	algorithm: { type: String, required: true },
	cipherKey: { type: String },
	integrityKey: { type: String },
	timestamp: { type: Date, required: true },
});

const MessageSchema = new Schema<Message>(
	{
		id: { type: String, required: true, unique: true },
		type: {
			type: String,
			enum: ['REQUEST', 'RESPONSE', 'NOTIFICATION', 'ERROR'],
			required: true,
		},
		source: { type: String, ref: 'NetworkFunction', required: true },
		destination: { type: String, ref: 'NetworkFunction', required: true },
		protocol: {
			type: String,
			enum: ['N1', 'N2', 'N3', 'N4', 'N6', 'N8', 'N11'],
		},
		payload: { type: Schema.Types.Mixed },
		timestamp: { type: Date, required: true, default: Date.now },
		securityContext: { type: SecurityContextSchema },
		status: {
			type: String,
			enum: ['sent', 'received', 'processing', 'error'],
			default: 'sent',
		},
		size: { type: Number },
	},
	{ timestamps: true }
);

// Fix for client components in Next.js
// Only create the model on the server side
let MessageModel: Model<Message>;

if (typeof window === 'undefined') {
	// We're on the server
	MessageModel = (models.Message as Model<Message>) || model<Message>('Message', MessageSchema);
} else {
	// We're on the client - provide a mock or minimal implementation
	MessageModel = {} as Model<Message>;
}

export default MessageModel;
