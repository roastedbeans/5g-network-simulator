import mongoose, { Schema, model, Model, models } from 'mongoose';
import { Connection } from '@/types/network';

const ConnectionSchema = new Schema<Connection>(
	{
		id: { type: String, required: true, unique: true },
		source: { type: String, ref: 'NetworkFunction', required: true },
		target: { type: String, ref: 'NetworkFunction', required: true },
		protocol: {
			type: String,
			enum: ['N1', 'N2', 'N3', 'N4', 'N6', 'N8', 'N11'],
			required: true,
		},
		status: {
			type: String,
			enum: ['active', 'inactive', 'error'],
			default: 'inactive',
		},
		latency: { type: Number },
		bandwidth: { type: Number },
	},
	{ timestamps: true }
);

// Fix for client components in Next.js
// Only create the model on the server side
let ConnectionModel: Model<Connection>;

if (typeof window === 'undefined') {
	// We're on the server
	ConnectionModel = (models.Connection as Model<Connection>) || model<Connection>('Connection', ConnectionSchema);
} else {
	// We're on the client - provide a mock or minimal implementation
	ConnectionModel = {} as Model<Connection>;
}

export default ConnectionModel;
