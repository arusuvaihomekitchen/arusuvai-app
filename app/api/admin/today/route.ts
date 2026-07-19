import { NextRequest, NextResponse } from 'next/server';
import { randomUUID } from 'crypto';
import pool from '@/lib/db';
import { todayIST } from '@/lib/dateUtils';
import type { ApiResponse } from '@/types';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const date = searchParams.get('date') ?? todayIST();

    const dayOfWeek = new Date(date).getDay();
    if (dayOfWeek === 0) {
      // Sunday is a holiday, no deliveries
      return NextResponse.json<ApiResponse>({ success: true, data: [] });
    }

    const db = await pool.connect();
    try {
      await db.query('BEGIN');

      // Get all active clients with valid subscription for this date
      const clients = await db.query(
        `SELECT u.id, u.name, s.subscribe_breakfast, s.subscribe_lunch, s.subscribe_dinner
         FROM users u
         JOIN subscriptions s ON s.client_id = u.id
         WHERE u.role = 'client'
           AND u.is_active = true
           AND s.start_date <= $1
           AND s.end_date >= $1
           AND s.status = 'active'`,
        [date]
      );

      // Fetch all approved skips for this date
      const skipsRes = await db.query(
        `SELECT id, client_id, meal_type FROM skip_requests
         WHERE date = $1 AND status = 'approved'`,
        [date]
      );
      const approvedSkips = new Map<string, string>(); // key: `${client_id}-${meal_type}`, value: skip_id
      for (const row of skipsRes.rows) {
        approvedSkips.set(`${row.client_id}-${row.meal_type}`, row.id);
      }

      // 1. Insert missing active deliveries in batch
      const insertValues: any[] = [];
      let placeholderIdx = 1;
      const insertParts: string[] = [];

      for (const c of clients.rows) {
        const meals = [];
        if (c.subscribe_breakfast === true) meals.push('Breakfast');
        if (c.subscribe_lunch !== false) meals.push('Lunch');
        if (c.subscribe_dinner !== false) meals.push('Dinner');

        for (const meal of meals) {
          const key = `${c.id}-${meal}`;
          const skipId = approvedSkips.get(key) || null;
          const status = skipId ? 'skipped' : 'pending';
          const deliveryId = `del_${randomUUID().replace(/-/g, '').slice(0, 12)}`;

          insertParts.push(`($${placeholderIdx++}, $${placeholderIdx++}, $${placeholderIdx++}, $${placeholderIdx++}, $${placeholderIdx++}, $${placeholderIdx++})`);
          insertValues.push(deliveryId, c.id, date, meal, status, skipId);
        }
      }

      if (insertParts.length > 0) {
        const insertQuery = `
          INSERT INTO daily_deliveries (id, client_id, date, meal_type, status, skip_request_id)
          VALUES ${insertParts.join(', ')}
          ON CONFLICT (client_id, date, meal_type) DO NOTHING
        `;
        await db.query(insertQuery, insertValues);
      }

      // 2. Remove invalid deliveries in batch
      const activeKeys = new Set<string>();
      for (const c of clients.rows) {
        if (c.subscribe_breakfast === true) activeKeys.add(`${c.id}-Breakfast`);
        if (c.subscribe_lunch !== false) activeKeys.add(`${c.id}-Lunch`);
        if (c.subscribe_dinner !== false) activeKeys.add(`${c.id}-Dinner`);
      }

      const existing = await db.query(
        `SELECT id, client_id, meal_type FROM daily_deliveries
         WHERE date = $1 AND status IN ('pending', 'assigned', 'skipped')`,
        [date]
      );

      const idsToDelete: string[] = [];
      for (const row of existing.rows) {
        const key = `${row.client_id}-${row.meal_type}`;
        if (!activeKeys.has(key)) {
          idsToDelete.push(row.id);
        }
      }

      if (idsToDelete.length > 0) {
        await db.query(
          `DELETE FROM daily_deliveries WHERE id = ANY($1)`,
          [idsToDelete]
        );
      }

      await db.query('COMMIT');
    } catch (e) {
      await db.query('ROLLBACK');
      throw e;
    } finally {
      db.release();
    }

    // Now query and return the list
    const deliveries = await pool.query(
      `SELECT dd.*,
              u.name as client_name,
              u.phone_number,
              u.location,
              u.delivery_note as delivery_note_client,
              dp.name as delivery_person_name,
              sr.status as skip_status,
              sr.id as skip_req_id
       FROM daily_deliveries dd
       JOIN users u ON u.id = dd.client_id
       LEFT JOIN users dp ON dp.id = dd.delivery_person_id
       LEFT JOIN skip_requests sr ON sr.client_id = dd.client_id
         AND sr.date = dd.date AND sr.meal_type = dd.meal_type AND sr.status = 'pending'
       WHERE dd.date = $1
       ORDER BY u.location, u.name, dd.meal_type`,
      [date]
    );

    return NextResponse.json<ApiResponse>({ success: true, data: deliveries.rows });
  } catch (err) {
    console.error('[admin/today GET]', err);
    return NextResponse.json<ApiResponse>({ success: false, error: 'Server error' }, { status: 500 });
  }
}
