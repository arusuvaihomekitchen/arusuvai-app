const { Pool } = require('pg');
const fs = require('fs');
const envFile = fs.readFileSync('.env.local', 'utf8');
const dbUrlMatch = envFile.match(/DATABASE_URL="?([^"\n]+)"?/);
const dbUrl = dbUrlMatch ? dbUrlMatch[1] : null;

if (!dbUrl) {
  console.error('No DATABASE_URL found');
  process.exit(1);
}

const pool = new Pool({ connectionString: dbUrl });

async function check() {
  try {
    const res = await pool.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'site_settings'
    `);
    console.log('Columns in site_settings:', res.rows);
    
    if (res.rows.length > 0) {
      const constraints = await pool.query(`
        SELECT conname, contype 
        FROM pg_constraint 
        WHERE conrelid = 'site_settings'::regclass
      `);
      console.log('Constraints on site_settings:', constraints.rows);
    } else {
      console.log('site_settings table does NOT exist.');
    }
  } catch (err) {
    console.error('Error:', err);
  } finally {
    pool.end();
  }
}

check();
