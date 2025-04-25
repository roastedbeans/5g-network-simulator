import mongoose from 'mongoose';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/5g-simulator';

// Connection state
let isConnected = false;

export async function dbConnect() {
	if (isConnected) {
		return mongoose;
	}

	try {
		const connection = await mongoose.connect(MONGODB_URI, {
			bufferCommands: false,
		});

		isConnected = true;
		console.log('MongoDB connected successfully');
		return connection;
	} catch (error) {
		console.error('MongoDB connection error:', error);
		throw error;
	}
}

export default dbConnect;
