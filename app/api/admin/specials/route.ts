import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { getSession } from '@/lib/session';
import { randomUUID } from 'crypto';

export async function GET() {
  try {
    const session = await getSession();
    if (!session || session.role !== 'admin') {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const res = await pool.query(`SELECT * FROM todays_specials ORDER BY created_at DESC`);
    return NextResponse.json({ success: true, data: res.rows });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session || session.role !== 'admin') {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { title, description, price, is_active } = await req.json();
    
    if (!title || price === undefined) {
      return NextResponse.json({ success: false, error: 'Missing fields' }, { status: 400 });
    }

    const id = `spec_${randomUUID().replace(/-/g, '').slice(0, 12)}`;
    
    await pool.query(
      `INSERT INTO todays_specials (id, title, description, price, is_active) VALUES ($1, $2, $3, $4, $5)`,
      [id, title, description || '', price, is_active !== false]
    );

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
