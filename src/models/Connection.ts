import mongoose, { Schema, Document, Model } from 'mongoose';
import { Connection as IConnection, ProtocolType } from '@/types/network';

const ConnectionSchema = new Schema<IConnection & Document>(
	{
		id: {
			type: String,
			default: function (this: any) {
				return this._id ? this._id.toString() : null;
			},
		},
		source: {
			type: String, // Use the slug of NetworkFunction
			required: true,
			index: true,
		},
		target: {
			type: String, // Use the slug of NetworkFunction
			required: true,
			index: true,
		},
		protocol: {
			type: String,
			enum: ['N1', 'N2', 'N3', 'N4', 'N6', 'N8', 'N9', 'N10', 'N11', 'N12', 'N13', 'N14', 'N15', 'N27', 'N32', 'SBI'],
			required: true,
		},
		status: {
			type: String,
			enum: ['active', 'inactive', 'error'],
			default: 'inactive',
		},
		// Store source and target names to avoid additional lookups
		sourceName: {
			type: String,
			required: false,
		},
		targetName: {
			type: String,
			required: false,
		},
		// Optional metadata
		label: {
			type: String,
		},
	},
	{ timestamps: true }
);

// Add middleware to auto-populate sourceName and targetName when saving
ConnectionSchema.pre('save', async function (next) {
	// Only update if sourceName or targetName is missing
	if (!this.sourceName || !this.targetName) {
		try {
			// This assumes NetworkFunction model is available and has the expected structure
			const NetworkFunction = mongoose.model('NetworkFunction');

			// Find source and target network functions by slug
			const [sourceNF, targetNF] = await Promise.all([
				NetworkFunction.findOne({ slug: this.source }).select('name'),
				NetworkFunction.findOne({ slug: this.target }).select('name'),
			]);

			// Update names if found
			if (sourceNF && !this.sourceName) {
				this.sourceName = sourceNF.name;
			}

			if (targetNF && !this.targetName) {
				this.targetName = targetNF.name;
			}

			next();
		} catch (error) {
			console.error('Error populating connection names:', error);
			next();
		}
	} else {
		next();
	}
});

// Add a compound index for source and target for efficient lookups
ConnectionSchema.index({ source: 1, target: 1 });

// Fix for client components in Next.js
let ConnectionModel: Model<IConnection & Document>;

// Only create the model on the server side
if (typeof window === 'undefined') {
	// We're on the server
	ConnectionModel =
		mongoose.models.Connection || mongoose.model<IConnection & Document>('Connection', ConnectionSchema);
} else {
	// We're on the client - provide a minimal implementation
	ConnectionModel = {} as Model<IConnection & Document>;
}

export default ConnectionModel;
