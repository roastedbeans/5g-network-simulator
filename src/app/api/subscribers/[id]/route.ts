import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getSubscriberById, updateSubscriber, deleteSubscriber } from '@/services/subscriber-service';

// Subscriber update validation schema
const subscriberUpdateSchema = z.object({
	msisdn: z.string().regex(/^\d+$/, { message: 'MSISDN must contain only digits' }).optional(),
	k: z
		.string()
		.regex(/^[0-9A-F]{32}$/, { message: 'K must be 32 hexadecimal characters' })
		.optional(),
	opc: z
		.string()
		.regex(/^[0-9A-F]{32}$/, { message: 'OPc must be 32 hexadecimal characters' })
		.optional(),
	amf: z
		.string()
		.regex(/^[0-9A-F]{4}$/, { message: 'AMF must be 4 hexadecimal characters' })
		.optional(),
	sqn: z
		.string()
		.regex(/^[0-9A-F]{12}$/, { message: 'SQN must be 12 hexadecimal characters' })
		.optional(),
	status: z.enum(['active', 'inactive', 'suspended']).optional(),
	roaming_allowed: z.boolean().optional(),
});

type Params = {
	params: Promise<{
		id: string;
	}>;
};

export async function GET(request: NextRequest, context: Params) {
	try {
		const { id } = await context.params;
		const subscriber = await getSubscriberById(id);

		if (!subscriber) {
			return NextResponse.json({ error: 'Subscriber not found' }, { status: 404 });
		}

		return NextResponse.json(subscriber);
	} catch (error) {
		console.error('Error fetching subscriber:', error);
		return NextResponse.json({ error: 'Failed to fetch subscriber' }, { status: 500 });
	}
}

export async function PUT(request: NextRequest, context: Params) {
	try {
		const { id } = await context.params;
		const body = await request.json();

		// Validate request body
		const result = subscriberUpdateSchema.safeParse(body);
		if (!result.success) {
			return NextResponse.json({ error: 'Validation failed', details: result.error.format() }, { status: 400 });
		}

		const subscriber = await updateSubscriber(id, result.data);

		if (!subscriber) {
			return NextResponse.json({ error: 'Subscriber not found' }, { status: 404 });
		}

		return NextResponse.json(subscriber);
	} catch (error) {
		console.error('Error updating subscriber:', error);
		return NextResponse.json({ error: 'Failed to update subscriber' }, { status: 500 });
	}
}

export async function DELETE(request: NextRequest, context: Params) {
	try {
		const { id } = await context.params;
		const result = await deleteSubscriber(id);

		if (!result) {
			return NextResponse.json({ error: 'Subscriber not found' }, { status: 404 });
		}

		return NextResponse.json({ message: 'Subscriber deleted successfully' }, { status: 200 });
	} catch (error) {
		console.error('Error deleting subscriber:', error);
		return NextResponse.json({ error: 'Failed to delete subscriber' }, { status: 500 });
	}
}
