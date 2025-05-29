import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getSubscribers, createSubscriber, DEFAULT_KEY, DEFAULT_OPC } from '@/services/subscriber-service';

// Subscriber validation schema
const subscriberSchema = z.object({
	imsi: z.string().regex(/^\d{15}$/, { message: 'IMSI must be 15 digits' }),
	msisdn: z.string().regex(/^\d+$/, { message: 'MSISDN must contain only digits' }).optional(),
	k: z
		.string()
		.regex(/^[0-9A-F]{32}$/, { message: 'K must be 32 hexadecimal characters' })
		.default(DEFAULT_KEY),
	opc: z
		.string()
		.regex(/^[0-9A-F]{32}$/, { message: 'OPc must be 32 hexadecimal characters' })
		.default(DEFAULT_OPC),
	amf: z
		.string()
		.regex(/^[0-9A-F]{4}$/, { message: 'AMF must be 4 hexadecimal characters' })
		.default('8000'),
	sqn: z
		.string()
		.regex(/^[0-9A-F]{12}$/, { message: 'SQN must be 12 hexadecimal characters' })
		.default('000000000000'),
	status: z.enum(['active', 'inactive', 'suspended']).default('active'),
	roaming_allowed: z.boolean().default(true),
});

export async function GET(request: NextRequest) {
	try {
		// Extract query parameters
		const searchParams = request.nextUrl.searchParams;
		const page = parseInt(searchParams.get('page') || '1');
		const limit = parseInt(searchParams.get('limit') || '10');
		const search = searchParams.get('search') || '';
		const status = searchParams.get('status') || 'all';

		const result = await getSubscribers({ page, limit, search, status });

		// Ensure we return the expected structure
		return NextResponse.json({
			subscribers: result.subscribers,
			pagination: result.pagination,
			// Add these for backward compatibility
			totalSubscribers: result.pagination.total,
			totalPages: result.pagination.pages,
		});
	} catch (error) {
		console.error('Error fetching subscribers:', error);
		return NextResponse.json(
			{
				error: 'Failed to fetch subscribers',
				subscribers: [],
				pagination: { total: 0, page: 1, limit: 10, pages: 0 },
			},
			{ status: 500 }
		);
	}
}

export async function POST(request: NextRequest) {
	try {
		const body = await request.json();

		// Validate request body
		const result = subscriberSchema.safeParse(body);
		if (!result.success) {
			return NextResponse.json({ error: 'Validation failed', details: result.error.format() }, { status: 400 });
		}

		const subscriber = await createSubscriber(result.data);

		return NextResponse.json(subscriber, { status: 201 });
	} catch (error) {
		console.error('Error creating subscriber:', error);
		return NextResponse.json({ error: 'Failed to create subscriber' }, { status: 500 });
	}
}
