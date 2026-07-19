import { NextRequest, NextResponse } from 'next/server';
import { randomUUID } from 'crypto';
import pool from '@/lib/db';
import { getSession } from '@/lib/session';
import type { ApiResponse } from '@/types';

export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json<ApiResponse>({ success: false, error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const { date, meal_type } = body;

    if (!date || !meal_type) {
      return NextResponse.json<ApiResponse>({ success: false, error: 'date and meal_type are required' }, { status: 400 });
    }

    const db = await pool.connect();
    try {
      await db.query('BEGIN');

      // Find all pending or assigned deliveries for this date and meal type
      const deliveries = await db.query(
        `SELECT id, client_id FROM daily_deliveries
         WHERE date = $1 AND meal_type = $2 AND status IN ('pending', 'assigned')`,
        [date, meal_type]
      );

      for (const row of deliveries.rows) {
        const skipId = `skip_${randomUUID().replace(/-/g, '').slice(0, 12)}`;

        // Insert skip request
        await db.query(
          `INSERT INTO skip_requests (id, client_id, date, meal_type, status, is_admin_initiated, requested_by, approved_by, approved_at)
           VALUES ($1, $2, $3, $4, 'approved', true, $5, $5, NOW())
           ON CONFLICT (client_id, date, meal_type) DO UPDATE SET status = 'approved', approved_by = $5, approved_at = NOW()`,
          [skipId, row.client_id, date, meal_type, session.id]
        );

        const skip = await db.query(
          `SELECT id FROM skip_requests WHERE client_id = $1 AND date = $2 AND meal_type = $3`,
          [row.client_id, date, meal_type]
        );

        // Update delivery status
        await db.query(
          `UPDATE daily_deliveries
           SET status = 'skipped', skip_request_id = $1
           WHERE id = $2`,
          [skip.rows[0].id, row.id]
        );
      }

      await db.query('COMMIT');
      return NextResponse.json<ApiResponse>({ success: true, data: { skippedCount: deliveries.rowCount } });
    } catch (e) {
      await db.query('ROLLBACK');
      throw e;
    } finally {
      db.release();
    }
  } catch (err) {
    console.error('[admin/skip-all POST]', err);
    return NextResponse.json<ApiResponse>({ success: false, error: 'Server error' }, { status: 500 });
  }
}
