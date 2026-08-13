import { Pool } from 'pg';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

async function main() {
  try {
    await pool.query('ALTER TABLE users ADD COLUMN map_url TEXT;');
    console.log('Added map_url to users successfully.');
  } catch (err: any) {
    if (err.code === '42701') {
      console.log('Column map_url already exists.');
    } else {
      console.error(err);
    }
  } finally {
    await pool.end();
  }
}
main();
