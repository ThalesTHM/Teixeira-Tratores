import type { NextRequest } from 'next/server';
import { ExpiredBillsService } from '@/services/expired-bills-service/ExpiredBillsService';

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.NEXT_PUBLIC_CRON_SECRET}`) {
    return new Response('Unauthorized', {
      status: 401,
    });
  }

  try {
    const service = new ExpiredBillsService();
    const result = await service.run();

    return Response.json({
      success: true,
      updatedPay: result.updatedPay,
      updatedReceive: result.updatedReceive,
    });
  } catch (error) {
    console.error('Cron: calculate-expired-bills failed', error);
    return Response.json(
      { success: false, error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}