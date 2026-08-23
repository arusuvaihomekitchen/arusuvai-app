import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { getSession } from '@/lib/session';

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getSession();
    if (!session || session.role !== 'admin') {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const body = await req.json();
    const { diet_override } = body;

    await pool.query(
      `UPDATE daily_deliveries SET diet_override = $1 WHERE id = $2`,
      [diet_override || null, id]
    );

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error('Error updating diet override:', err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
