import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { getSession } from '@/lib/session';

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session || session.role !== 'admin') {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const { id } = await params;

    // Fetch client
    const userRes = await pool.query(
      `SELECT name, phone_number, location FROM users WHERE id = $1 AND role = 'client'`,
      [id]
    );

    if (userRes.rows.length === 0) {
      return new NextResponse('Client not found', { status: 404 });
    }
    const client = userRes.rows[0];

    // Fetch skips
    const skipsRes = await pool.query(
      `SELECT date, meal_type, status, requested_at FROM skip_requests WHERE client_id = $1 ORDER BY date DESC`,
      [id]
    );

    // Fetch deliveries
    const deliveriesRes = await pool.query(
      `SELECT d.date, d.meal_type, d.status, u.name as delivery_person_name
       FROM daily_deliveries d
       LEFT JOIN users u ON d.delivery_person_id = u.id
       WHERE d.client_id = $1
       ORDER BY d.date DESC, d.meal_type DESC`,
      [id]
    );

    // Generate CSV
    const rows: string[] = [];
    
    // Header
    rows.push(`Client Name: ${client.name},Phone: ${client.phone_number},Location: ${client.location.replace(/,/g, ' ')}`);
    rows.push('');
    
    // Deliveries Section
    rows.push('--- RECENT DELIVERIES ---');
    rows.push('Date,Meal Type,Status,Delivery Person');
    
    if (deliveriesRes.rows.length === 0) {
      rows.push('No deliveries recorded');
    } else {
      deliveriesRes.rows.forEach(d => {
        const dateStr = new Date(d.date).toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' });
        rows.push(`${dateStr},${d.meal_type},${d.status},${d.delivery_person_name || 'N/A'}`);
      });
    }

    rows.push('');
    
    // Skips Section
    rows.push('--- SKIP REQUESTS ---');
    rows.push('Date,Meal Type,Status,Requested At');
    
    if (skipsRes.rows.length === 0) {
      rows.push('No skip requests recorded');
    } else {
      skipsRes.rows.forEach(s => {
        const dateStr = new Date(s.date).toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' });
        const reqStr = new Date(s.requested_at).toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' });
        rows.push(`${dateStr},${s.meal_type},${s.status},${reqStr}`);
      });
    }

    const csvText = rows.join('\r\n');

    // Return as a downloadable file
    return new NextResponse(csvText, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="Client_${client.name.replace(/\\s+/g, '_')}_Logs.csv"`,
      },
    });

  } catch (err) {
    console.error('[admin/clients/[id]/export GET]', err);
    return new NextResponse('Server error', { status: 500 });
  }
}
