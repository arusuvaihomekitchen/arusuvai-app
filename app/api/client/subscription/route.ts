import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { getSession } from '@/lib/session';
import { countServiceDays, serviceDaysRemaining, getSubscriptionStatus } from '@/lib/dateUtils';
import type { ApiResponse, Subscription } from '@/types';

export async function GET() {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json<ApiResponse>({ success: false, error: 'Unauthorized' }, { status: 401 });

    const result = await pool.query(
      `SELECT * FROM subscriptions
       WHERE client_id = $1
       ORDER BY created_at DESC
       LIMIT 1`,
      [session.id]
    );

    if (result.rows.length === 0) {
      return NextResponse.json<ApiResponse>({ success: true, data: null });
    }

    const sub = result.rows[0] as Subscription;

    const skipsResult = await pool.query(
      `SELECT meal_type, COUNT(*) as count 
       FROM skip_requests 
       WHERE client_id = $1 AND status = 'approved' 
       GROUP BY meal_type`,
      [session.id]
    );

    const skipCounts = skipsResult.rows.map(r => ({
      meal_type: r.meal_type,
      count: parseInt(r.count, 10)
    }));

    const status = getSubscriptionStatus(sub);
    const totalServiceDays = countServiceDays(new Date(sub.start_date), new Date(sub.end_date));
    const remainingServiceDays = serviceDaysRemaining(new Date(sub.end_date));

    return NextResponse.json<ApiResponse>({
      success: true,
      data: {
        ...sub,
        status,
        total_service_days: totalServiceDays,
        remaining_service_days: remainingServiceDays,
        skipCounts,
      },
    });
  } catch (err) {
    console.error('[client/subscription]', err);
    return NextResponse.json<ApiResponse>({ success: false, error: 'Server error' }, { status: 500 });
  }
}
