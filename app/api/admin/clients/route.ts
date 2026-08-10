import { NextRequest, NextResponse } from 'next/server';
import { randomUUID } from 'crypto';
import bcrypt from 'bcryptjs';
import pool from '@/lib/db';
import { getSession } from '@/lib/session';
import type { ApiResponse } from '@/types';

export async function GET() {
  try {
    const result = await pool.query(
      `SELECT
         u.*,
         s.id as sub_id,
         s.amount as sub_amount,
         s.start_date,
         s.end_date,
         s.status as sub_status,
         s.type as sub_type,
         s.subscribe_lunch,
         s.subscribe_dinner,
         s.subscribe_breakfast,
         p.status as payment_status,
         skips.breakfast_skips,
         skips.lunch_skips,
         skips.dinner_skips
       FROM users u
       LEFT JOIN LATERAL (
         SELECT * FROM subscriptions
         WHERE client_id = u.id
         ORDER BY created_at DESC LIMIT 1
       ) s ON true
       LEFT JOIN LATERAL (
         SELECT status FROM payments
         WHERE client_id = u.id
           AND year = EXTRACT(YEAR FROM NOW())
           AND month = EXTRACT(MONTH FROM NOW())
         LIMIT 1
       ) p ON true
       LEFT JOIN LATERAL (
         SELECT
           COUNT(CASE WHEN meal_type = 'Breakfast' THEN 1 END) as breakfast_skips,
           COUNT(CASE WHEN meal_type = 'Lunch' THEN 1 END) as lunch_skips,
           COUNT(CASE WHEN meal_type = 'Dinner' THEN 1 END) as dinner_skips
         FROM skip_requests sr
         WHERE sr.client_id = u.id AND sr.status = 'approved' AND sr.date >= s.start_date
       ) skips ON true
       WHERE u.role = 'client'
       ORDER BY u.name`
    );

    return NextResponse.json<ApiResponse>({ success: true, data: result.rows });
  } catch (err) {
    console.error('[admin/clients GET]', err);
    return NextResponse.json<ApiResponse>({ success: false, error: 'Server error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json<ApiResponse>({ success: false, error: 'Unauthorized' }, { status: 401 });

    const { name, phone_number, location, password, delivery_note, subscription, diet_preference } = await req.json();

    if (!name || !phone_number || !password) {
      return NextResponse.json<ApiResponse>({ success: false, error: 'Name, phone number, and password are required' }, { status: 400 });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const userId = `client_${randomUUID().replace(/-/g, '').slice(0, 10)}`;

    const db = await pool.connect();
    try {
      await db.query('BEGIN');

      await db.query(
        `INSERT INTO users (id, name, phone_number, role, location, username, password_hash, delivery_note, created_by, diet_preference)
         VALUES ($1, $2, $3, 'client', $4, $5, $6, $7, $8, $9)`,
        [userId, name, phone_number, location ?? '', phone_number, passwordHash, delivery_note ?? '', session.id, diet_preference ?? 'Veg']
      );

      if (subscription) {
        const subId = `sub_${randomUUID().replace(/-/g, '').slice(0, 10)}`;
        await db.query(
          `INSERT INTO subscriptions (id, client_id, type, amount, start_date, end_date, status, subscribe_lunch, subscribe_dinner, subscribe_breakfast, created_by)
           VALUES ($1, $2, 'Monthly', $3, $4, $5, 'active', $6, $7, $8, $9)`,
          [subId, userId, subscription.amount, subscription.start_date, subscription.end_date, subscription.subscribe_lunch !== false, subscription.subscribe_dinner !== false, subscription.subscribe_breakfast === true, session.id]
        );

        // Create payment record for this month
        const now = new Date();
        const payId = `${userId}-${now.getFullYear()}-${now.getMonth() + 1}`;
        await db.query(
          `INSERT INTO payments (id, client_id, subscription_id, month, year, amount, status)
           VALUES ($1, $2, $3, $4, $5, $6, 'unpaid')
           ON CONFLICT DO NOTHING`,
          [payId, userId, subId, now.getMonth() + 1, now.getFullYear(), subscription.amount]
        );
      }

      await db.query('COMMIT');
    } catch (e) {
      await db.query('ROLLBACK');
      throw e;
    } finally {
      db.release();
    }

    return NextResponse.json<ApiResponse>({ success: true, data: { id: userId } }, { status: 201 });
  } catch (err: unknown) {
    console.error('[admin/clients POST]', err);
    if ((err as { code?: string }).code === '23505') {
      return NextResponse.json<ApiResponse>({ success: false, error: 'Phone number already registered' }, { status: 409 });
    }
    return NextResponse.json<ApiResponse>({ success: false, error: 'Server error' }, { status: 500 });
  }
}
