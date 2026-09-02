import { NextRequest, NextResponse } from 'next/server';
import { randomUUID } from 'crypto';
import pool from '@/lib/db';
import { getSession } from '@/lib/session';
import type { ApiResponse } from '@/types';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json<ApiResponse>({ success: false, error: 'Unauthorized' }, { status: 401 });

    const { id: clientId } = await params;
    const { type, amount, start_date, end_date, notes, subscribe_breakfast, subscribe_lunch, subscribe_dinner } = await req.json();

    const subId = `sub_${randomUUID().replace(/-/g, '').slice(0, 10)}`;

    const result = await pool.query(
      `INSERT INTO subscriptions (id, client_id, type, amount, start_date, end_date, status, notes, created_by, subscribe_breakfast, subscribe_lunch, subscribe_dinner)
       VALUES ($1, $2, $3, $4, $5, $6, 'active', $7, $8, $9, $10, $11)
       RETURNING *`,
      [subId, clientId, type ?? 'Monthly', amount, start_date, end_date, notes ?? '', session.id, subscribe_breakfast ?? false, subscribe_lunch ?? false, subscribe_dinner ?? false]
    );

    // Create payment for the starting month
    const startDate = new Date(start_date);
    const payId = `${clientId}-${startDate.getFullYear()}-${startDate.getMonth() + 1}`;
    await pool.query(
      `INSERT INTO payments (id, client_id, subscription_id, month, year, amount, status)
       VALUES ($1, $2, $3, $4, $5, $6, 'unpaid')
       ON CONFLICT DO NOTHING`,
      [payId, clientId, subId, startDate.getMonth() + 1, startDate.getFullYear(), amount]
    );

    return NextResponse.json<ApiResponse>({ success: true, data: result.rows[0] }, { status: 201 });
  } catch (err) {
    console.error('[admin/clients/[id]/subscription]', err);
    return NextResponse.json<ApiResponse>({ success: false, error: 'Server error' }, { status: 500 });
  }
}
