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
    
    const updates = [];
    const values: any[] = [];
    let idx = 1;

    if (body.title !== undefined) {
      updates.push(`title = $${idx++}`);
      values.push(body.title);
    }
    if (body.description !== undefined) {
      updates.push(`description = $${idx++}`);
      values.push(body.description);
    }
    if (body.price !== undefined) {
      updates.push(`price = $${idx++}`);
      values.push(body.price);
    }
    if (body.is_active !== undefined) {
      updates.push(`is_active = $${idx++}`);
      values.push(body.is_active);
    }
    if (body.available_until !== undefined) {
      updates.push(`available_until = $${idx++}`);
      values.push(body.available_until || null);
    }

    if (updates.length > 0) {
      values.push(id);
      await pool.query(
        `UPDATE todays_specials SET ${updates.join(', ')} WHERE id = $${idx}`,
        values
      );
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getSession();
    if (!session || session.role !== 'admin') {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    await pool.query(`DELETE FROM todays_specials WHERE id = $1`, [id]);

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
