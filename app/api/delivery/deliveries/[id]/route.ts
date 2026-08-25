import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { getSession } from '@/lib/session';
import type { ApiResponse } from '@/types';

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json<ApiResponse>({ success: false, error: 'Unauthorized' }, { status: 401 });

    const { id } = await params;
    const { status, delivery_note } = await req.json();

    if (!['delivered', 'not_available', 'assigned'].includes(status)) {
      return NextResponse.json<ApiResponse>({ success: false, error: 'Invalid status' }, { status: 400 });
    }

    const delivered_at = status === 'delivered' ? 'NOW()' : 'NULL';

    const result = await pool.query(
      `UPDATE daily_deliveries
       SET status = $1,
           delivery_note = COALESCE($2, delivery_note),
           delivered_at = ${delivered_at}
       WHERE id = $3 AND delivery_person_id = $4
       RETURNING *`,
      [status, delivery_note ?? null, id, session.id]
    );

    if (result.rows.length === 0) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'Delivery not found or not assigned to you' },
        { status: 404 }
      );
    }

    return NextResponse.json<ApiResponse>({ success: true, data: result.rows[0] });
  } catch (err) {
    console.error('[delivery/deliveries/[id]]', err);
    return NextResponse.json<ApiResponse>({ success: false, error: 'Server error' }, { status: 500 });
  }
}
