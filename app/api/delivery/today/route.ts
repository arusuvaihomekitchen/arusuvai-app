import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { getSession } from '@/lib/session';
import { todayIST } from '@/lib/dateUtils';
import type { ApiResponse } from '@/types';

export async function GET(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json<ApiResponse>({ success: false, error: 'Unauthorized' }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const date = searchParams.get('date') ?? todayIST();

    const result = await pool.query(
      `SELECT dd.*,
              u.name as client_name,
              u.phone_number,
              u.location,
              u.pincode,
              u.delivery_note as delivery_note_client,
              sr.status as skip_status,
              sr.id as skip_req_id
       FROM daily_deliveries dd
       JOIN users u ON u.id = dd.client_id
       LEFT JOIN skip_requests sr ON sr.client_id = dd.client_id
         AND sr.date = dd.date AND sr.meal_type = dd.meal_type
       WHERE dd.delivery_person_id = $1
         AND dd.date = $2
         AND dd.status NOT IN ('skipped')
       ORDER BY u.location, u.name, dd.meal_type`,
      [session.id, date]
    );

    return NextResponse.json<ApiResponse>({ success: true, data: result.rows });
  } catch (err) {
    console.error('[delivery/today]', err);
    return NextResponse.json<ApiResponse>({ success: false, error: 'Server error' }, { status: 500 });
  }
}
