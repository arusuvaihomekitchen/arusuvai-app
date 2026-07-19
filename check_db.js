const { Pool } = require('pg');
const fs = require('fs');
const envFile = fs.readFileSync('.env.local', 'utf8');
const dbUrlMatch = envFile.match(/DATABASE_URL=([^"\n]+)/);
const dbUrl = dbUrlMatch ? dbUrlMatch[1].trim() : null;

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
      WHERE table_name = 'weekly_menu'
    `);
    console.log('Columns in weekly_menu:', res.rows);
  } catch (err) {
    console.error('Error:', err);
  } finally {
    pool.end();
  }
}

check();
