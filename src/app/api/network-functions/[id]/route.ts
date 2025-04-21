import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import NetworkFunctionModel from '@/models/NetworkFunction';

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
	try {
		await dbConnect();
		const networkFunction = await NetworkFunctionModel.findOne({
			id: params.id,
		}).lean();

		if (!networkFunction) {
			return NextResponse.json({ error: 'Network function not found' }, { status: 404 });
		}

		return NextResponse.json(networkFunction);
	} catch (error) {
		console.error(`Error fetching network function ${params.id}:`, error);
		return NextResponse.json({ error: 'Failed to fetch network function' }, { status: 500 });
	}
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
	try {
		const body = await request.json();
		await dbConnect();

		const updatedNetworkFunction = await NetworkFunctionModel.findOneAndUpdate(
			{ id: params.id },
			{ $set: body },
			{ new: true, runValidators: true }
		).lean();

		if (!updatedNetworkFunction) {
			return NextResponse.json({ error: 'Network function not found' }, { status: 404 });
		}

		return NextResponse.json(updatedNetworkFunction);
	} catch (error) {
		console.error(`Error updating network function ${params.id}:`, error);
		return NextResponse.json({ error: 'Failed to update network function' }, { status: 500 });
	}
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
	try {
		await dbConnect();
		const deletedNetworkFunction = await NetworkFunctionModel.findOneAndDelete({
			id: params.id,
		}).lean();

		if (!deletedNetworkFunction) {
			return NextResponse.json({ error: 'Network function not found' }, { status: 404 });
		}

		return NextResponse.json({ message: 'Network function deleted successfully' });
	} catch (error) {
		console.error(`Error deleting network function ${params.id}:`, error);
		return NextResponse.json({ error: 'Failed to delete network function' }, { status: 500 });
	}
}
