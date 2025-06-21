import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import {
	getSubscribers,
	createSubscriber,
	deleteAllSubscribers,
	DEFAULT_KEY,
	DEFAULT_OPC,
} from '@/services/subscriber-service';

// Subscriber validation schema
const subscriberSchema = z.object({
	imsi: z.string().regex(/^\d{15}$/, { message: 'IMSI must be 15 digits' }),
	msisdn: z.string().regex(/^\d+$/, { message: 'MSISDN must contain only digits' }).optional().or(z.literal('')),
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
	subscriber_status: z.number().int().min(0).max(1).optional(),
	operator_determined_barring: z.number().int().min(0).max(2).optional(),
	access_restriction_data: z.number().optional(),
	network_access_mode: z.number().optional(),
	subscribed_rau_tau_timer: z.number().optional(),
	slice: z
		.array(
			z.object({
				sst: z.number().int().min(1).max(4),
				sd: z.string().optional().or(z.literal('')),
				default_indicator: z.boolean().optional(),
				session: z
					.array(
						z.object({
							name: z.string().min(1),
							type: z.number().int().min(0).max(2),
							pcc_rule: z.array(z.any()).optional(),
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
						})
					)
					.optional(),
			})
		)
		.optional(),
});

export async function GET(request: NextRequest) {
	try {
		// Extract query parameters
		const searchParams = request.nextUrl.searchParams;
		const page = parseInt(searchParams.get('page') || '1');
		const limit = parseInt(searchParams.get('limit') || '10');
		const search = searchParams.get('search') || '';
		const status = searchParams.get('status') || 'all';
		const sortBy = searchParams.get('sortBy') || 'imsi';
		const sortOrder = (searchParams.get('sortOrder') || 'asc') as 'asc' | 'desc';

		const result = await getSubscribers({ page, limit, search, status, sortBy, sortOrder });

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

		const { subscriber, isUpdate } = await createSubscriber(result.data);

		return NextResponse.json(
			{
				...subscriber,
				_operation: isUpdate ? 'updated' : 'created',
			},
			{ status: isUpdate ? 200 : 201 }
		);
	} catch (error) {
		console.error('Error creating/updating subscriber:', error);
		return NextResponse.json({ error: 'Failed to create/update subscriber' }, { status: 500 });
	}
}

export async function DELETE(request: NextRequest) {
	try {
		const result = await deleteAllSubscribers();

		return NextResponse.json(
			{
				message: `Successfully deleted ${result.deletedCount} subscribers`,
				deletedCount: result.deletedCount,
			},
			{ status: 200 }
		);
	} catch (error) {
		console.error('Error deleting all subscribers:', error);
		return NextResponse.json({ error: 'Failed to delete all subscribers' }, { status: 500 });
	}
}
