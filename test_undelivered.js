const { Pool } = require('pg');
require('dotenv').config({ path: '.env.local' });
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function test() {
  const todayStr = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' });
  console.log('Today:', todayStr);
  const res = await pool.query(`
    SELECT 
        d.id, d.date, d.meal_type, d.status, d.delivery_note, d.delivery_note_client,
        u.name as client_name, dp.name as delivery_person_name
      FROM daily_deliveries d
      JOIN users u ON d.client_id = u.id
      LEFT JOIN users dp ON d.delivery_person_id = dp.id
      WHERE d.status = 'not_available' 
         OR (d.status IN ('assigned', 'pending') AND d.date < $1)
      ORDER BY d.date DESC, d.meal_type, u.name
  `, [todayStr]);
  console.log('Found:', res.rows.length);
  console.dir(res.rows, { depth: null });
  process.exit(0);
}
test();
