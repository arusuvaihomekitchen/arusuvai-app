import { NextRequest, NextResponse } from 'next/server';
import { randomUUID } from 'crypto';
import pool from '@/lib/db';
import { todayIST, addServiceDays } from '@/lib/dateUtils';
import type { ApiResponse } from '@/types';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const { searchParams } = new URL(req.url);
    const today = body.date || searchParams.get('date') || todayIST();

    const dayOfWeek = new Date(today).getDay();
    if (dayOfWeek === 0) {
      // Sunday is a holiday, no deliveries
      return NextResponse.json<ApiResponse>({ success: true, data: [] });
    }

    const client = await pool.connect();

    try {
      await client.query('BEGIN');

      // 1. Get all active clients with valid subscription for today, including meal flags
      const clients = await client.query(
        `SELECT u.id, u.name, s.subscribe_breakfast, s.subscribe_lunch, s.subscribe_dinner, s.start_date, s.end_date
         FROM users u
         JOIN subscriptions s ON s.client_id = u.id
         WHERE u.role = 'client'
           AND u.is_active = true
           AND s.start_date <= $1
           AND s.status = 'active'`,
         [today]
      );

      // Fetch skip counts for these clients to adjust end_date
      const skipCounts = await client.query(
        `SELECT sr.client_id, sr.meal_type, COUNT(*) as skips
         FROM skip_requests sr
         JOIN subscriptions s ON s.client_id = sr.client_id
         WHERE sr.status = 'approved' AND sr.date >= s.start_date
         GROUP BY sr.client_id, sr.meal_type`
      );

      const skipsMap = new Map<string, number>();
      for (const row of skipCounts.rows) {
        skipsMap.set(`${row.client_id}-${row.meal_type}`, parseInt(row.skips, 10));
      }

      // We'll need addServiceDays here. Since we're in an API route, we can inline a quick helper or import it.
      // Wait, we can import it at the top of the file.
      // Let's assume addServiceDays is imported.
      
      // Create set of active client_id + meal_type pairs
      const activePairs: { client_id: string; meal_type: string }[] = [];
      for (const c of clients.rows) {
        const baseEnd = new Date(c.end_date);
        
        if (c.subscribe_breakfast === true) {
          const skips = skipsMap.get(`${c.id}-Breakfast`) || 0;
          const adjustedEnd = addServiceDays(baseEnd, skips);
          if (new Date(today) <= adjustedEnd) {
            activePairs.push({ client_id: c.id, meal_type: 'Breakfast' });
          }
        }
        if (c.subscribe_lunch !== false) {
          const skips = skipsMap.get(`${c.id}-Lunch`) || 0;
          const adjustedEnd = addServiceDays(baseEnd, skips);
          if (new Date(today) <= adjustedEnd) {
            activePairs.push({ client_id: c.id, meal_type: 'Lunch' });
          }
        }
        if (c.subscribe_dinner !== false) {
          const skips = skipsMap.get(`${c.id}-Dinner`) || 0;
          const adjustedEnd = addServiceDays(baseEnd, skips);
          if (new Date(today) <= adjustedEnd) {
            activePairs.push({ client_id: c.id, meal_type: 'Dinner' });
          }
        }
      }

      // 2. Insert missing active deliveries
      for (const pair of activePairs) {
        // Check for approved skip
        const skip = await client.query(
          `SELECT id FROM skip_requests
           WHERE client_id = $1 AND date = $2 AND meal_type = $3 AND status = 'approved'`,
          [pair.client_id, today, pair.meal_type]
        );

        const status = skip.rows.length > 0 ? 'skipped' : 'pending';
        const skipId = skip.rows[0]?.id ?? null;
        const id = `del_${randomUUID().replace(/-/g, '').slice(0, 12)}`;

        await client.query(
          `INSERT INTO daily_deliveries
             (id, client_id, date, meal_type, status, skip_request_id)
           VALUES ($1, $2, $3, $4, $5, $6)
           ON CONFLICT (client_id, date, meal_type) DO NOTHING`,
          [id, pair.client_id, today, pair.meal_type, status, skipId]
        );
      }

      // 3. Remove invalid deliveries (if they are pending, assigned, or skipped, but no longer active/subscribed)
      const existing = await client.query(
        `SELECT id, client_id, meal_type FROM daily_deliveries
         WHERE date = $1 AND status IN ('pending', 'assigned', 'skipped')`,
        [today]
      );

      for (const row of existing.rows) {
        const stillActive = activePairs.some(
          (p) => p.client_id === row.client_id && p.meal_type === row.meal_type
        );
        if (!stillActive) {
          await client.query(`DELETE FROM daily_deliveries WHERE id = $1`, [row.id]);
        }
      }

      await client.query('COMMIT');
    } catch (e) {
      await client.query('ROLLBACK');
      throw e;
    } finally {
      client.release();
    }

    // Return today's list
    const deliveries = await pool.query(
      `SELECT dd.*,
              u.name as client_name,
              u.phone_number,
              u.location,
              u.pincode,
              u.gmap_link,
              u.delivery_note as delivery_note_client,
              dp.name as delivery_person_name
       FROM daily_deliveries dd
       JOIN users u ON u.id = dd.client_id
       LEFT JOIN users dp ON dp.id = dd.delivery_person_id
       WHERE dd.date = $1
       ORDER BY u.location, u.name, dd.meal_type`,
      [today]
    );

    return NextResponse.json<ApiResponse>({ success: true, data: deliveries.rows });
  } catch (err) {
    console.error('[admin/generate-today]', err);
    return NextResponse.json<ApiResponse>({ success: false, error: 'Server error' }, { status: 500 });
  }
}
