import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { addServiceDays } from '@/lib/dateUtils';
import type { ApiResponse } from '@/types';

export async function POST() {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // 1. Fetch all active subscriptions where base end_date is in the past
    const result = await pool.query(
      `SELECT id, client_id, end_date, subscribe_breakfast, subscribe_lunch, subscribe_dinner
       FROM subscriptions
       WHERE status = 'active' AND end_date < CURRENT_DATE`
    );

    let expiredCount = 0;

    for (const sub of result.rows) {
      // 2. Fetch skip counts for this client
      const skipCounts = await pool.query(
        `SELECT meal_type, COUNT(*) as count 
         FROM skip_requests 
         WHERE client_id = $1 AND status = 'approved' 
         GROUP BY meal_type`,
        [sub.client_id]
      );

      const skipsMap = new Map<string, number>();
      for (const row of skipCounts.rows) {
        skipsMap.set(row.meal_type, parseInt(row.count, 10));
      }

      const bSkips = skipsMap.get('Breakfast') || 0;
      const lSkips = skipsMap.get('Lunch') || 0;
      const dSkips = skipsMap.get('Dinner') || 0;

      const baseEnd = new Date(sub.end_date);
      let maxEndDate: Date | null = new Date(sub.end_date);

      if (sub.subscribe_breakfast) {
        const d = addServiceDays(baseEnd, bSkips);
        if (d > maxEndDate) maxEndDate = d;
      }
      if (sub.subscribe_lunch !== false) {
        const d = addServiceDays(baseEnd, lSkips);
        if (d > maxEndDate) maxEndDate = d;
      }
      if (sub.subscribe_dinner !== false) {
        const d = addServiceDays(baseEnd, dSkips);
        if (d > maxEndDate) maxEndDate = d;
      }

      // 3. If maxEndDate is completely in the past, mark as expired
      if (maxEndDate < today) {
        await pool.query(
          `UPDATE subscriptions SET status = 'expired' WHERE id = $1`,
          [sub.id]
        );
        expiredCount++;
      }
    }

    return NextResponse.json<ApiResponse>({
      success: true,
      data: { expired_count: expiredCount },
    });
  } catch (err) {
    console.error('[cron/expire-subscriptions]', err);
    return NextResponse.json<ApiResponse>({ success: false, error: 'Server error' }, { status: 500 });
  }
}
