import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { getSession } from '@/lib/session';

export async function GET(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session || session.role !== 'admin') {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    // Query for undelivered meals:
    // 1. Explicitly marked 'not_available'
    // 2. 'assigned' or 'pending' but date is strictly in the past (missed)
    const todayStr = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' }); // YYYY-MM-DD
    
    const res = await pool.query(`
      SELECT 
        d.id, d.date, d.meal_type, d.status, d.delivery_note, d.delivery_note_client,
        u.name as client_name, u.phone_number, u.location, u.pincode, u.gmap_link,
        dp.name as delivery_person_name
      FROM daily_deliveries d
      JOIN users u ON d.client_id = u.id
      LEFT JOIN users dp ON d.delivery_person_id = dp.id
      WHERE d.status = 'not_available' 
         OR (d.status IN ('assigned', 'pending') AND d.date < $1)
      ORDER BY d.date DESC, d.meal_type, u.name
    `, [todayStr]);

    return NextResponse.json({ success: true, data: res.rows });
  } catch (error: any) {
    console.error('Error fetching undelivered:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
