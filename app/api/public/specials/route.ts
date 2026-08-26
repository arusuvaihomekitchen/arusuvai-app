import { NextResponse } from 'next/server';
import pool from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const res = await pool.query(
      `SELECT id, title, description, price, available_until, created_at 
       FROM todays_specials 
       WHERE is_active = true 
       ORDER BY created_at DESC`
    );
    return NextResponse.json({ success: true, data: res.rows });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
