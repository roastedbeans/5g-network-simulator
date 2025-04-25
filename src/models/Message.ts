import mongoose, { Schema, Document, Model } from 'mongoose';
import { Message as IMessage, MessageType } from '@/types/network';

// Define SecurityContext Schema for embedding (if needed and defined in types)
// Assuming SecurityContext is simple enough to be embedded or handled differently for now
// const SecurityContextSchema = new Schema({...}, { _id: false });

const MessageSchema = new Schema<IMessage & Document>(
	{
		type: {
			type: Number, // Using Number because MessageType is an enum in types
			enum: Object.values(MessageType).filter((v) => typeof v === 'number'),
			required: true,
		},
		source: {
			type: String, // Network Function slug (e.g., "v-amf-1")
			required: true,
			index: true,
		},
		destination: {
			type: String, // Network Function slug
			required: true,
			index: true,
		},
		payload: {
			type: Schema.Types.Mixed, // Payload can be any structure
			required: true,
		},
		timestamp: {
			type: Date,
			default: Date.now,
			required: true,
		},
		securityContext: {
			// Embed or reference SecurityContext if needed
			type: Schema.Types.Mixed, // Placeholder
			required: false,
		},
		description: {
			type: String,
			required: false,
		},
	},
	{ timestamps: { createdAt: 'timestamp' } }
); // Use timestamp field for createdAt

// Fix for client components in Next.js
let MessageModel: Model<IMessage & Document>;

// Only create the model on the server side
if (typeof window === 'undefined') {
	// We're on the server
	MessageModel = mongoose.models.Message || mongoose.model<IMessage & Document>('Message', MessageSchema);
} else {
	// We're on the client - provide a minimal implementation
	MessageModel = {} as Model<IMessage & Document>;
}

export default MessageModel;
