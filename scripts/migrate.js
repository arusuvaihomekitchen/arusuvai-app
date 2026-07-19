/**
 * Migration: Create weekly_menu + subscription_plans tables and seed default data.
 * Run once: node scripts/migrate.js
 */

const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

// Load .env.local manually
const envPath = path.join(__dirname, '..', '.env.local');
if (fs.existsSync(envPath)) {
  fs.readFileSync(envPath, 'utf8')
    .split('\n')
    .filter(line => line && !line.startsWith('#') && line.includes('='))
    .forEach(line => {
      const [key, ...rest] = line.split('=');
      process.env[key.trim()] = rest.join('=').trim();
    });
}

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function run() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // ─────────────────────────────────────────────
    // 1. Create weekly_menu table
    // ─────────────────────────────────────────────
    await client.query(`
      CREATE TABLE IF NOT EXISTS weekly_menu (
        id          SERIAL PRIMARY KEY,
        menu_type   VARCHAR(10)  NOT NULL CHECK (menu_type IN ('veg','non_veg')),
        day_of_week VARCHAR(10)  NOT NULL CHECK (day_of_week IN ('Monday','Tuesday','Wednesday','Thursday','Friday','Saturday')),
        meal_type   VARCHAR(10)  NOT NULL CHECK (meal_type IN ('Lunch','Dinner')),
        items       TEXT[]       NOT NULL DEFAULT '{}',
        updated_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
        UNIQUE (menu_type, day_of_week, meal_type)
      )
    `);
    console.log('✓ weekly_menu table created (or already exists)');

    // ─────────────────────────────────────────────
    // 2. Seed weekly_menu (Mon–Sat, Veg + Non-Veg, Lunch)
    // ─────────────────────────────────────────────
    const vegMenu = [
      { day: 'Monday',    items: ['Rice', 'Sambar', 'Poriyal', 'Rasam', 'Buttermilk', 'Appalam'] },
      { day: 'Tuesday',   items: ['Rice', 'Kara Kulambu', 'Kootu', 'Rasam', 'Buttermilk', 'Appalam'] },
      { day: 'Wednesday', items: ['Lemon Rice', 'Kootu', 'Poriyal', 'Rasam', 'Buttermilk', 'Appalam'] },
      { day: 'Thursday',  items: ['Rice', 'Mor Kulambu', 'Poriyal', 'Rasam', 'Buttermilk', 'Appalam'] },
      { day: 'Friday',    items: ['Tamarind Rice', 'Rajma', 'Poriyal', 'Rasam', 'Buttermilk', 'Appalam'] },
      { day: 'Saturday',  items: ['Coconut Rice', 'Sambar', 'Kootu', 'Rasam', 'Buttermilk', 'Papad'] },
    ];

    const nonVegMenu = [
      { day: 'Monday',    items: ['Rice', 'Chicken Curry', 'Poriyal', 'Rasam', 'Buttermilk', 'Appalam'] },
      { day: 'Tuesday',   items: ['Rice', 'Mutton Gravy', 'Kootu', 'Rasam', 'Buttermilk', 'Appalam'] },
      { day: 'Wednesday', items: ['Rice', 'Chicken Chettinad', 'Poriyal', 'Rasam', 'Buttermilk', 'Appalam'] },
      { day: 'Thursday',  items: ['Rice', 'Fish Curry', 'Poriyal', 'Rasam', 'Buttermilk', 'Appalam'] },
      { day: 'Friday',    items: ['Rice', 'Egg Curry', 'Poriyal', 'Rasam', 'Buttermilk', 'Appalam'] },
      { day: 'Saturday',  items: ['Biryani', 'Chicken Gravy', 'Raita', 'Brinjal Curry', 'Boiled Egg'] },
    ];

    for (const row of vegMenu) {
      await client.query(
        `INSERT INTO weekly_menu (menu_type, day_of_week, meal_type, items)
         VALUES ('veg', $1, 'Lunch', $2)
         ON CONFLICT (menu_type, day_of_week, meal_type) DO NOTHING`,
        [row.day, row.items]
      );
    }
    for (const row of nonVegMenu) {
      await client.query(
        `INSERT INTO weekly_menu (menu_type, day_of_week, meal_type, items)
         VALUES ('non_veg', $1, 'Lunch', $2)
         ON CONFLICT (menu_type, day_of_week, meal_type) DO NOTHING`,
        [row.day, row.items]
      );
    }
    console.log('✓ weekly_menu seeded (12 rows — Mon–Sat × Veg + Non-Veg)');

    // ─────────────────────────────────────────────
    // 3. Create subscription_plans table
    // ─────────────────────────────────────────────
    await client.query(`
      CREATE TABLE IF NOT EXISTS subscription_plans (
        id               SERIAL PRIMARY KEY,
        plan_name        VARCHAR(100)  NOT NULL,
        plan_type        VARCHAR(20)   NOT NULL CHECK (plan_type IN ('veg','non_veg','combo')),
        price            NUMERIC(10,2) NOT NULL,
        duration_days    INTEGER       NOT NULL DEFAULT 26,
        features         TEXT[]        NOT NULL DEFAULT '{}',
        whatsapp_number  VARCHAR(20)   NOT NULL DEFAULT '',
        is_active        BOOLEAN       NOT NULL DEFAULT true,
        sort_order       INTEGER       NOT NULL DEFAULT 1,
        updated_at       TIMESTAMPTZ   NOT NULL DEFAULT NOW()
      )
    `);
    console.log('✓ subscription_plans table created (or already exists)');

    // ─────────────────────────────────────────────
    // 3.5 Create site_settings table
    // ─────────────────────────────────────────────
    await client.query(`
      CREATE TABLE IF NOT EXISTS site_settings (
        setting_key VARCHAR(50) PRIMARY KEY,
        setting_value TEXT NOT NULL,
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);
    console.log('✓ site_settings table created (or already exists)');


    // ─────────────────────────────────────────────
    // 4. Seed subscription_plans (3 default plans)
    // ─────────────────────────────────────────────
    const plans = [
      {
        plan_name: 'Veg Plan',
        plan_type: 'veg',
        price: 2800,
        duration_days: 26,
        features: [
          'Pure Vegetarian Meals',
          'Freshly Cooked Every Morning',
          'Delivered in Steel Tiffin',
          'Monday to Saturday',
          'No Preservatives',
          'WhatsApp Support',
        ],
        whatsapp_number: '919876543210',
        is_active: true,
        sort_order: 1,
      },
      {
        plan_name: 'Non-Veg Plan',
        plan_type: 'non_veg',
        price: 3600,
        duration_days: 26,
        features: [
          'Chicken & Seafood Dishes',
          'Freshly Cooked Every Morning',
          'Delivered in Steel Tiffin',
          'Monday to Saturday',
          'No Preservatives',
          'WhatsApp Support',
        ],
        whatsapp_number: '919876543210',
        is_active: true,
        sort_order: 2,
      },
      {
        plan_name: 'Combo Plan',
        plan_type: 'combo',
        price: 4200,
        duration_days: 26,
        features: [
          'Veg + Non-Veg Mix',
          'Freshly Cooked Every Morning',
          'Delivered in Steel Tiffin',
          'Monday to Saturday',
          'No Preservatives',
          'Priority WhatsApp Support',
          'Flexible Day Skips',
        ],
        whatsapp_number: '919876543210',
        is_active: true,
        sort_order: 3,
      },
    ];

    for (const plan of plans) {
      // Only insert if no plans exist yet (avoid duplicating)
      const existing = await client.query(
        `SELECT id FROM subscription_plans WHERE plan_type = $1`,
        [plan.plan_type]
      );
      if (existing.rowCount === 0) {
        await client.query(
          `INSERT INTO subscription_plans
             (plan_name, plan_type, price, duration_days, features, whatsapp_number, is_active, sort_order)
           VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`,
          [plan.plan_name, plan.plan_type, plan.price, plan.duration_days,
           plan.features, plan.whatsapp_number, plan.is_active, plan.sort_order]
        );
      }
    }
    console.log('✓ subscription_plans seeded (3 default plans)');

    await client.query('COMMIT');
    console.log('\n✅ Migration complete!');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('\n❌ Migration failed, rolled back:', err.message);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

run();
