import { NextRequest, NextResponse } from 'next/server';
import { setupRoamingScenario } from '@/services/simulator/roaming-scenario-service';
import dbConnect from '@/lib/mongodb';

export async function POST(req: NextRequest) {
	try {
		// If you have a dbConnect utility:
		await dbConnect();

		await setupRoamingScenario();

		return NextResponse.json({ success: true, message: '5G roaming scenario successfully set up' }, { status: 200 });
	} catch (error) {
		console.error('Error setting up roaming scenario:', error);
		return NextResponse.json(
			{ success: false, message: 'Failed to set up roaming scenario', error: (error as Error).message },
			{ status: 500 }
		);
	}
}
