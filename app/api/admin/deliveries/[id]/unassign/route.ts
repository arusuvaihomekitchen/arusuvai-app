import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { getSession } from '@/lib/session';

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getSession();
    if (!session || session.role !== 'admin') {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    await pool.query(
      `UPDATE daily_deliveries 
       SET status = 'pending', delivery_person_id = NULL, assigned_at = NULL 
       WHERE id = $1`,
      [id]
    );

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error('Error unassigning delivery:', err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
