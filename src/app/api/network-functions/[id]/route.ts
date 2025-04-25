import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import NetworkFunctionModel from '@/models/NetworkFunction';

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
	try {
		const { id } = await params;

		if (!id) {
			return NextResponse.json({ error: 'Missing network function ID' }, { status: 400 });
		}

		await dbConnect();
		const networkFunction = await NetworkFunctionModel.findOne({
			id,
		}).lean();

		if (!networkFunction) {
			return NextResponse.json({ error: 'Network function not found' }, { status: 404 });
		}

		return NextResponse.json({ success: true, data: networkFunction }, { status: 200 });
	} catch (error) {
		console.error(`Error fetching network function:`, error);
		return NextResponse.json({ error: 'Failed to fetch network function' }, { status: 500 });
	}
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
	try {
		const { id } = await params;

		if (!id) {
			return NextResponse.json({ error: 'Missing network function ID' }, { status: 400 });
		}

		const body = await request.json();
		if (!body || Object.keys(body).length === 0) {
			return NextResponse.json({ error: 'Request body is empty' }, { status: 400 });
		}

		await dbConnect();
		const updatedNetworkFunction = await NetworkFunctionModel.findOneAndUpdate(
			{ id },
			{ $set: body },
			{ new: true, runValidators: true }
		).lean();

		if (!updatedNetworkFunction) {
			return NextResponse.json({ error: 'Network function not found' }, { status: 404 });
		}

		return NextResponse.json({ success: true, data: updatedNetworkFunction }, { status: 200 });
	} catch (error) {
		console.error(`Error updating network function:`, error);
		return NextResponse.json({ error: 'Failed to update network function' }, { status: 500 });
	}
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
	try {
		const { id } = await params;

		if (!id) {
			return NextResponse.json({ error: 'Missing network function ID' }, { status: 400 });
		}

		await dbConnect();
		const deletedNetworkFunction = await NetworkFunctionModel.findOneAndDelete({
			id,
		}).lean();

		if (!deletedNetworkFunction) {
			return NextResponse.json({ error: 'Network function not found' }, { status: 404 });
		}

		return NextResponse.json({ message: 'Network function deleted successfully' });
	} catch (error) {
		console.error(`Error deleting network function:`, error);
		return NextResponse.json({ error: 'Failed to delete network function' }, { status: 500 });
	}
}
