import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import pool from '@/lib/db';
import { getSession } from '@/lib/session';
import type { ApiResponse } from '@/types';

export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session || session.role !== 'admin') {
      return NextResponse.json<ApiResponse>({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { password } = await req.json();
    if (!password || password.trim().length < 4) {
      return NextResponse.json<ApiResponse>({ success: false, error: 'Password must be at least 4 characters long' }, { status: 400 });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    
    const result = await pool.query(
      `UPDATE users SET password_hash = $1 WHERE id = $2 AND role = 'admin' RETURNING id`,
      [passwordHash, session.id]
    );

    if (result.rows.length === 0) {
      return NextResponse.json<ApiResponse>({ success: false, error: 'Admin user not found' }, { status: 404 });
    }

    return NextResponse.json<ApiResponse>({ success: true });
  } catch (err) {
    console.error('[admin/change-password POST]', err);
    return NextResponse.json<ApiResponse>({ success: false, error: 'Server error' }, { status: 500 });
  }
}
