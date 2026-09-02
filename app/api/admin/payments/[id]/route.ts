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
    if (!session || session.role !== 'admin') {
      return NextResponse.json<ApiResponse>({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const { status } = await req.json();

    if (!['paid', 'unpaid'].includes(status)) {
      return NextResponse.json<ApiResponse>({ success: false, error: 'Invalid status' }, { status: 400 });
    }

    const result = await pool.query(
      `UPDATE payments SET status = $1 WHERE id = $2 RETURNING *`,
      [status, id]
    );

    if (result.rowCount === 0) {
      return NextResponse.json<ApiResponse>({ success: false, error: 'Payment not found' }, { status: 404 });
    }

    return NextResponse.json<ApiResponse>({ success: true, data: result.rows[0] });
  } catch (err) {
    console.error('[admin/payments/[id] PATCH]', err);
    return NextResponse.json<ApiResponse>({ success: false, error: 'Server error' }, { status: 500 });
  }
}
