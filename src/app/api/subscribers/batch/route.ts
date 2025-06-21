import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createBatchSubscribers, DEFAULT_KEY, DEFAULT_OPC } from '@/services/subscriber-service';

// Session schema for validation
const sessionSchema = z.object({
	name: z.string().min(1),
	type: z.number().int().min(0).max(2),
	pcc_rule: z.array(z.any()).optional().default([]),
	ambr: z
		.object({
			uplink: z.object({
				value: z.number().positive(),
				unit: z.enum(['bps', 'Kbps', 'Mbps', 'Gbps']),
			}),
			downlink: z.object({
				value: z.number().positive(),
				unit: z.enum(['bps', 'Kbps', 'Mbps', 'Gbps']),
			}),
		})
		.optional(),
	qos: z
		.object({
			index: z.number().int().min(1).max(15),
			arp: z.object({
				priority_level: z.number().int().min(1).max(15),
				pre_emption_capability: z.number().int().min(0).max(1),
				pre_emption_vulnerability: z.number().int().min(0).max(1),
			}),
		})
		.optional(),
});

// Slice schema for validation
const sliceSchema = z.object({
	sst: z.number().int().min(1).max(4),
	sd: z.string().optional().or(z.literal('')),
	default_indicator: z.boolean().optional().default(true),
	session: z.array(sessionSchema).optional().default([]),
});

// Enhanced batch subscriber creation validation schema
const batchSubscriberSchema = z.object({
	imsi_start: z.string().regex(/^\d{15}$/, { message: 'Start IMSI must be 15 digits' }),
	imsi_end: z.string().regex(/^\d{15}$/, { message: 'End IMSI must be 15 digits' }),
	msisdn_start: z.string().regex(/^\d+$/, { message: 'MSISDN must contain only digits' }).optional().or(z.literal('')),
	k: z
		.string()
		.regex(/^[0-9A-Fa-f]{32}$/, { message: 'K must be 32 hexadecimal characters' })
		.transform((val) => val.toUpperCase())
		.default(DEFAULT_KEY),
	opc: z
		.string()
		.regex(/^[0-9A-Fa-f]{32}$/, { message: 'OPc must be 32 hexadecimal characters' })
		.transform((val) => val.toUpperCase())
		.default(DEFAULT_OPC),
	amf: z
		.string()
		.regex(/^[0-9A-Fa-f]{4}$/, { message: 'AMF must be 4 hexadecimal characters' })
		.transform((val) => val.toUpperCase())
		.default('8000'),
	sqn: z
		.string()
		.regex(/^[0-9A-Fa-f]{12}$/, { message: 'SQN must be 12 hexadecimal characters' })
		.transform((val) => val.toUpperCase())
		.default('000000000000'),
	status: z.enum(['active', 'inactive', 'suspended']).default('active'),
	subscriber_status: z.number().int().min(0).max(1).optional().default(0),
	operator_determined_barring: z.number().int().min(0).max(2).optional().default(0),
	slice: z.array(sliceSchema).optional().default([]),
});

export async function POST(request: NextRequest) {
	try {
		const body = await request.json();
		console.log('Received batch request body:', JSON.stringify(body, null, 2));

		// Validate request body
		const result = batchSubscriberSchema.safeParse(body);
		if (!result.success) {
			console.error('Validation failed:', result.error.format());
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

		const message =
			results.updatedCount > 0
				? `Processed ${results.totalProcessed} subscribers (${results.createdCount} created, ${results.updatedCount} updated)`
				: `Created ${results.createdCount} subscribers successfully`;

		return NextResponse.json(
			{
				message,
				count: results.totalProcessed,
				createdCount: results.createdCount,
				updatedCount: results.updatedCount,
				subscribers: results.subscribers,
			},
			{ status: results.updatedCount > 0 ? 200 : 201 }
		);
	} catch (error) {
		console.error('Error processing batch subscribers:', error);
		return NextResponse.json({ error: 'Failed to process subscribers' }, { status: 500 });
	}
}
