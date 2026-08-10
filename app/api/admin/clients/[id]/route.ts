import { NextRequest, NextResponse } from 'next/server';
import { randomUUID } from 'crypto';
import bcrypt from 'bcryptjs';
import pool from '@/lib/db';
import { getSession } from '@/lib/session';
import type { ApiResponse } from '@/types';

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session || session.role !== 'admin') {
      return NextResponse.json<ApiResponse>({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    // Fetch user
    const userRes = await pool.query(
      `SELECT id, name, phone_number, location, delivery_note, diet_preference, is_active, created_at FROM users WHERE id = $1 AND role = 'client'`,
      [id]
    );

    if (userRes.rows.length === 0) {
      return NextResponse.json<ApiResponse>({ success: false, error: 'Client not found' }, { status: 404 });
    }

    const user = userRes.rows[0];

    // Fetch latest subscription
    const subRes = await pool.query(
      `SELECT * FROM subscriptions WHERE client_id = $1 ORDER BY created_at DESC LIMIT 1`,
      [id]
    );

    const subscription = subRes.rows[0] || null;

    let skipCounts = [];
    if (subscription) {
      const countsRes = await pool.query(
        `SELECT meal_type, COUNT(*) as count
         FROM skip_requests
         WHERE client_id = $1 AND status = 'approved' AND date >= $2
         GROUP BY meal_type`,
        [id, subscription.start_date]
      );
      skipCounts = countsRes.rows;
    }

    // Fetch skip requests
    const skipsRes = await pool.query(
      `SELECT * FROM skip_requests WHERE client_id = $1 ORDER BY date DESC LIMIT 10`,
      [id]
    );

    // Fetch delivery history
    const deliveriesRes = await pool.query(
      `SELECT d.*, u.name as delivery_person_name
       FROM daily_deliveries d
       LEFT JOIN users u ON d.delivery_person_id = u.id
       WHERE d.client_id = $1
       ORDER BY d.date DESC, d.meal_type DESC
       LIMIT 15`,
      [id]
    );

    return NextResponse.json<ApiResponse>({
      success: true,
      data: {
        client: user,
        subscription,
        skips: skipsRes.rows,
        skipCounts,
        deliveries: deliveriesRes.rows,
      },
    });
  } catch (err) {
    console.error('[admin/clients/[id] GET]', err);
    return NextResponse.json<ApiResponse>({ success: false, error: 'Server error' }, { status: 500 });
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json<ApiResponse>({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const body = await req.json();
    const { name, phone_number, location, password, delivery_note, diet_preference, is_active, sub_amount, start_date, end_date, subscribe_lunch, subscribe_dinner, subscribe_breakfast } = body;

    const db = await pool.connect();
    try {
      await db.query('BEGIN');

      // Update user fields
      const updates: string[] = [];
      const values: any[] = [id];
      let placeholderIdx = 2;

      if (name !== undefined) {
        updates.push(`name = $${placeholderIdx++}`);
        values.push(name);
      }
      if (phone_number !== undefined) {
        updates.push(`phone_number = $${placeholderIdx++}`);
        values.push(phone_number);
        updates.push(`username = $${placeholderIdx++}`);
        values.push(phone_number);
      }
      if (location !== undefined) {
        updates.push(`location = $${placeholderIdx++}`);
        values.push(location);
      }
      if (delivery_note !== undefined) {
        updates.push(`delivery_note = $${placeholderIdx++}`);
        values.push(delivery_note);
      }
      if (diet_preference !== undefined) {
        updates.push(`diet_preference = $${placeholderIdx++}`);
        values.push(diet_preference);
      }
      if (is_active !== undefined) {
        updates.push(`is_active = $${placeholderIdx++}`);
        values.push(!!is_active);
      }
      if (password) {
        const passwordHash = await bcrypt.hash(password, 10);
        updates.push(`password_hash = $${placeholderIdx++}`);
        values.push(passwordHash);
      }

      if (updates.length > 0) {
        const userQuery = `UPDATE users SET ${updates.join(', ')} WHERE id = $1 AND role = 'client' RETURNING id`;
        const userResult = await db.query(userQuery, values);
        if (userResult.rows.length === 0) {
          await db.query('ROLLBACK');
          return NextResponse.json<ApiResponse>({ success: false, error: 'Client not found' }, { status: 404 });
        }
      }

      // Update subscription if details are provided
      if (sub_amount !== undefined || start_date !== undefined || end_date !== undefined || subscribe_lunch !== undefined || subscribe_dinner !== undefined) {
        // Find latest subscription for the client
        const subRes = await db.query(
          `SELECT id FROM subscriptions WHERE client_id = $1 ORDER BY created_at DESC LIMIT 1`,
          [id]
        );

        if (subRes.rows.length > 0) {
          const subId = subRes.rows[0].id;
          const subUpdates: string[] = [];
          const subValues: any[] = [subId];
          let subPlaceholderIdx = 2;

          if (sub_amount !== undefined) {
            subUpdates.push(`amount = $${subPlaceholderIdx++}`);
            subValues.push(sub_amount ? parseFloat(sub_amount) : null);
          }
          if (start_date !== undefined) {
            subUpdates.push(`start_date = $${subPlaceholderIdx++}`);
            subValues.push(start_date || null);
          }
          if (end_date !== undefined) {
            subUpdates.push(`end_date = $${subPlaceholderIdx++}`);
            subValues.push(end_date || null);
          }
          if (subscribe_lunch !== undefined) {
            subUpdates.push(`subscribe_lunch = $${subPlaceholderIdx++}`);
            subValues.push(!!subscribe_lunch);
          }
          if (subscribe_dinner !== undefined) {
            subUpdates.push(`subscribe_dinner = $${subPlaceholderIdx++}`);
            subValues.push(!!subscribe_dinner);
          }
          if (subscribe_breakfast !== undefined) {
            subUpdates.push(`subscribe_breakfast = $${subPlaceholderIdx++}`);
            subValues.push(!!subscribe_breakfast);
          }

          if (subUpdates.length > 0) {
            await db.query(
              `UPDATE subscriptions SET ${subUpdates.join(', ')} WHERE id = $1`,
              subValues
            );
          }
        } else if (sub_amount && start_date && end_date) {
          // No subscription exists, create one!
          const subId = `sub_${randomUUID().replace(/-/g, '').slice(0, 10)}`;
          await db.query(
            `INSERT INTO subscriptions (id, client_id, type, amount, start_date, end_date, status, subscribe_lunch, subscribe_dinner, subscribe_breakfast, created_by)
             VALUES ($1, $2, 'Monthly', $3, $4, $5, 'active', $6, $7, $8, $9)`,
            [subId, id, parseFloat(sub_amount), start_date, end_date, subscribe_lunch !== false, subscribe_dinner !== false, subscribe_breakfast === true, session.id]
          );

          // Create payment for the starting month
          const startDateObj = new Date(start_date);
          const payId = `${id}-${startDateObj.getFullYear()}-${startDateObj.getMonth() + 1}`;
          await db.query(
            `INSERT INTO payments (id, client_id, subscription_id, month, year, amount, status)
             VALUES ($1, $2, $3, $4, $5, $6, 'unpaid')
             ON CONFLICT DO NOTHING`,
            [payId, id, subId, startDateObj.getMonth() + 1, startDateObj.getFullYear(), parseFloat(sub_amount)]
          );
        }
      }

      await db.query('COMMIT');
    } catch (e) {
      await db.query('ROLLBACK');
      throw e;
    } finally {
      db.release();
    }

    return NextResponse.json<ApiResponse>({ success: true });
  } catch (err: unknown) {
    console.error('[admin/clients/[id] PATCH]', err);
    if ((err as { code?: string }).code === '23505') {
      return NextResponse.json<ApiResponse>({ success: false, error: 'Phone number already registered' }, { status: 409 });
    }
    return NextResponse.json<ApiResponse>({ success: false, error: 'Server error' }, { status: 500 });
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await pool.query(
      `DELETE FROM users WHERE id = $1 AND role = 'client'`,
      [id]
    );
    return NextResponse.json<ApiResponse>({ success: true });
  } catch (err) {
    console.error('[admin/clients/[id] DELETE]', err);
    return NextResponse.json<ApiResponse>({ success: false, error: 'Server error' }, { status: 500 });
  }
}
