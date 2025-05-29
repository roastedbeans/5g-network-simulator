import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createBatchSubscribers, DEFAULT_KEY, DEFAULT_OPC } from '@/services/subscriber-service';

// Batch subscriber creation validation schema
const batchSubscriberSchema = z.object({
	imsi_start: z.string().regex(/^\d{15}$/, { message: 'Start IMSI must be 15 digits' }),
	imsi_end: z.string().regex(/^\d{15}$/, { message: 'End IMSI must be 15 digits' }),
	msisdn_start: z.string().regex(/^\d+$/, { message: 'MSISDN must contain only digits' }).optional(),
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

export async function POST(request: NextRequest) {
	try {
		const body = await request.json();

		// Validate request body
		const result = batchSubscriberSchema.safeParse(body);
		if (!result.success) {
			return NextResponse.json({ error: 'Validation failed', details: result.error.format() }, { status: 400 });
		}

		// Check that imsi_end is greater than imsi_start
		const imsiStart = BigInt(result.data.imsi_start);
		const imsiEnd = BigInt(result.data.imsi_end);

		if (imsiEnd <= imsiStart) {
			return NextResponse.json({ error: 'End IMSI must be greater than start IMSI' }, { status: 400 });
		}

		// Check range size limit (prevent creating too many at once)
		const rangeSize = Number(imsiEnd - imsiStart) + 1;
		const MAX_RANGE_SIZE = 1000; // Maximum number of subscribers to create at once

		if (rangeSize > MAX_RANGE_SIZE) {
			return NextResponse.json(
				{ error: `Cannot create more than ${MAX_RANGE_SIZE} subscribers at once` },
				{ status: 400 }
			);
		}

		const results = await createBatchSubscribers(result.data);

		return NextResponse.json(
			{
				message: `Created ${results.length} subscribers successfully`,
				count: results.length,
				subscribers: results,
			},
			{ status: 201 }
		);
	} catch (error) {
		console.error('Error creating batch subscribers:', error);
		return NextResponse.json({ error: 'Failed to create subscribers' }, { status: 500 });
	}
}
