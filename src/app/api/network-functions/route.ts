import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import NetworkFunctionModel from '@/models/NetworkFunction';
import { v4 as uuidv4 } from 'uuid';
import { NetworkFunctionType } from '@/types/network';
import slugify from 'slugify';

export async function GET() {
	try {
		await dbConnect();
		const networkFunctions = await NetworkFunctionModel.find({}).lean();

		return NextResponse.json({ success: true, data: { networkFunctions } }, { status: 200 });
	} catch (error) {
		console.error('Error fetching network functions:', error);
		return NextResponse.json({ error: 'Failed to fetch network functions' }, { status: 500 });
	}
}

export async function POST(request: NextRequest) {
	try {
		const body = await request.json();
		const { name, type, position, description, ipAddress } = body;

		if (!name || !type || !position) {
			return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
		}

		await dbConnect();

		const networkFunction = await NetworkFunctionModel.create({
			id: uuidv4(),
			slug: slugify(name),
			name,
			type: type as NetworkFunctionType,
			status: 'inactive',
			connections: [],
			position,
			messages: [],
			description,
			ipAddress,
		});

		return NextResponse.json({ success: true, data: networkFunction }, { status: 201 });
	} catch (error) {
		console.error('Error creating network function:', error);
		return NextResponse.json({ error: 'Failed to create network function' }, { status: 500 });
	}
}
