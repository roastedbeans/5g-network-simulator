import mongoose, { Schema, model, Model, models } from 'mongoose';
import { Simulation } from '@/types/network';

const SimulationSchema = new Schema<Simulation>(
	{
		id: { type: String, required: true, unique: true },
		name: { type: String, required: true },
		description: { type: String },
		networkFunctions: [{ type: String, ref: 'NetworkFunction' }],
		connections: [{ type: String, ref: 'Connection' }],
		messages: [{ type: String, ref: 'Message' }],
		status: {
			type: String,
			enum: ['running', 'paused', 'stopped', 'completed'],
			default: 'stopped',
			required: true,
		},
		startTime: { type: Date },
		endTime: { type: Date },
	},
	{ timestamps: true }
);

// Fix for client components in Next.js
// Only create the model on the server side
let SimulationModel: Model<Simulation>;

if (typeof window === 'undefined') {
	// We're on the server
	SimulationModel = (models.Simulation as Model<Simulation>) || model<Simulation>('Simulation', SimulationSchema);
} else {
	// We're on the client - provide a mock or minimal implementation
	SimulationModel = {} as Model<Simulation>;
}

export default SimulationModel;
