import mongoose, { Schema, model, Model, models } from 'mongoose';
import { NetworkFunction } from '@/types/network';

const NetworkFunctionSchema = new Schema<NetworkFunction>(
	{
		id: { type: String, required: true, unique: true },
		name: { type: String, required: true },
		type: {
			type: String,
			enum: ['5GC', 'RAN', 'UE', 'AMF', 'SMF', 'UPF', 'AUSF', 'UDM'],
			required: true,
		},
		status: {
			type: String,
			enum: ['active', 'inactive', 'error'],
			default: 'inactive',
		},
		connections: [{ type: String, ref: 'Connection' }],
		position: {
			x: { type: Number, required: true },
			y: { type: Number, required: true },
		},
		messages: [{ type: String, ref: 'Message' }],
		description: { type: String },
		ipAddress: { type: String },
	},
	{ timestamps: true }
);

// Fix for client components in Next.js
// Only create the model on the server side
let NetworkFunctionModel: Model<NetworkFunction>;

if (typeof window === 'undefined') {
	// We're on the server
	NetworkFunctionModel =
		(models.NetworkFunction as Model<NetworkFunction>) ||
		model<NetworkFunction>('NetworkFunction', NetworkFunctionSchema);
} else {
	// We're on the client - provide a mock or minimal implementation
	// This prevents the "Cannot read properties of undefined" error
	NetworkFunctionModel = {} as Model<NetworkFunction>;
}

export default NetworkFunctionModel;
