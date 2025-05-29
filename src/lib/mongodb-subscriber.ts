import mongoose from 'mongoose';

// Use a clear default URI and allow override from environment variables
const MONGODB_URI = process.env.DB_URI || 'mongodb://localhost:27017/open5gs';

// Connection state
let isConnected = false;

export async function dbConnect() {
	if (isConnected) {
		console.log('Using existing MongoDB connection');
		return mongoose;
	}

	try {
		console.log('Connecting to MongoDB at:', MONGODB_URI);

		// Set strictQuery to false to allow querying fields that aren't in the schema
		mongoose.set('strictQuery', false);

		const connection = await mongoose.connect(MONGODB_URI, {
			bufferCommands: false,
			// Enable retry on initial connection
			serverSelectionTimeoutMS: 5000,
			// Set up connection timeout
			connectTimeoutMS: 10000,
		});

		isConnected = true;
		console.log('MongoDB connected successfully to:', MONGODB_URI);

		// Log database and collections if available
		if (connection && connection.connection && connection.connection.db) {
			console.log('Connected to database:', connection.connection.db.databaseName);

			// Log available collections
			try {
				const collections = await connection.connection.db.listCollections().toArray();
				console.log(
					'Available collections:',
					collections.map((c) => c.name)
				);
			} catch (err) {
				console.warn('Could not list collections:', err);
			}
		}

		return connection;
	} catch (error) {
		console.error('MongoDB connection error:', error);
		isConnected = false;
		throw error;
	}
}

export default dbConnect;
