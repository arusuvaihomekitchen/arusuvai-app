const { Pool } = require('pg');
const pool = new Pool({ connectionString: 'postgres://postgres:postgres@localhost:5432/arusuvai_db' });
async function check() {
  try {
    const res = await pool.query("SELECT id, name, phone_number FROM users WHERE phone_number IN ('9514868050', '9361025259')");
    if (res.rows.length === 0) {
      console.log("No users found");
      return;
    }
    const ids = res.rows.map(r => r.id);
    console.log("Users:", res.rows);
    const subs = await pool.query("SELECT * FROM subscriptions WHERE client_id = ANY($1)", [ids]);
    console.log("Subs:", subs.rows);
  } catch (e) { console.error(e.message); } finally { pool.end(); }
}
check();
