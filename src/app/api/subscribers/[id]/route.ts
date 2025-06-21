import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getSubscriberById, updateSubscriber, deleteSubscriber } from '@/services/subscriber-service';

// Subscriber update validation schema
const subscriberUpdateSchema = z.object({
	msisdn: z.string().regex(/^\d+$/, { message: 'MSISDN must contain only digits' }).optional().or(z.literal('')),
	k: z
		.string()
		.regex(/^[0-9A-Fa-f]{32}$/, { message: 'K must be 32 hexadecimal characters' })
		.transform((val) => val.toUpperCase())
		.optional(),
	opc: z
		.string()
		.regex(/^[0-9A-Fa-f]{32}$/, { message: 'OPc must be 32 hexadecimal characters' })
		.transform((val) => val.toUpperCase())
		.optional(),
	amf: z
		.string()
		.regex(/^[0-9A-Fa-f]{4}$/, { message: 'AMF must be 4 hexadecimal characters' })
		.transform((val) => val.toUpperCase())
		.optional(),
	sqn: z
		.string()
		.regex(/^[0-9A-Fa-f]{12}$/, { message: 'SQN must be 12 hexadecimal characters' })
		.transform((val) => val.toUpperCase())
		.optional(),
	status: z.enum(['active', 'inactive', 'suspended']).optional(),
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
