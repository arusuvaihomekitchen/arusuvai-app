-- ================================================================
-- ARUSUVAI — THE HOME KITCHEN
-- Database Schema v2.0
-- Compatible with: Neon DB (current) or Supabase (PostgreSQL)
-- Service days: Monday – Friday (excludes Sat + Sun)
-- Roles: client | admin | delivery_person
-- ================================================================

-- ----------------------------------------------------------------
-- CLEANUP (safe re-run)
-- ----------------------------------------------------------------
DROP TABLE IF EXISTS payments          CASCADE;
DROP TABLE IF EXISTS daily_deliveries  CASCADE;
DROP TABLE IF EXISTS skip_requests     CASCADE;
DROP TABLE IF EXISTS subscriptions     CASCADE;
DROP TABLE IF EXISTS location_fares    CASCADE;
DROP TABLE IF EXISTS users             CASCADE;

-- ----------------------------------------------------------------
-- 1. USERS
--    Stores all three roles. Delivery note is client-only (ignored
--    for admin / delivery_person rows).
-- ----------------------------------------------------------------
CREATE TABLE users (
    id               VARCHAR(50)  PRIMARY KEY,
    name             VARCHAR(100) NOT NULL,
    phone_number     VARCHAR(20),
    role             VARCHAR(20)  NOT NULL
                       CHECK (role IN ('client', 'admin', 'delivery_person')),
    location         VARCHAR(255),          -- delivery area / address (clients)
    pincode          VARCHAR(20),           -- grouping area for deliveries
    diet_preference  VARCHAR(20)  DEFAULT 'Veg', -- Veg or Non-Veg
    username         VARCHAR(50)  UNIQUE NOT NULL,
    password_hash    VARCHAR(255) NOT NULL,
    delivery_note    TEXT,                  -- e.g. "Not available on Fridays"
    is_active        BOOLEAN      NOT NULL DEFAULT true,
    created_at       TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_by       VARCHAR(50)  REFERENCES users(id) ON DELETE SET NULL
);

-- ----------------------------------------------------------------
-- 2. SUBSCRIPTIONS
--    One active subscription per client at a time.
--    Admin sets amount + date range manually.
--    Service-day count (Mon–Fri) is computed in the application layer.
-- ----------------------------------------------------------------
CREATE TABLE subscriptions (
    id               VARCHAR(50)  PRIMARY KEY,
    client_id        VARCHAR(50)  NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    type             VARCHAR(50)  NOT NULL DEFAULT 'Monthly',  -- extensible later
    amount           NUMERIC(10,2) NOT NULL,
    start_date       DATE         NOT NULL,
    end_date         DATE         NOT NULL,
    status           VARCHAR(20)  NOT NULL DEFAULT 'active'
                       CHECK (status IN ('active', 'expired', 'cancelled')),
    notes            TEXT,
    created_at       TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_by       VARCHAR(50)  REFERENCES users(id) ON DELETE SET NULL,
    CONSTRAINT valid_date_range CHECK (end_date >= start_date)
);

-- ----------------------------------------------------------------
-- 3. SKIP REQUESTS
--    Created by client (pending → admin approves/rejects).
--    Admin-initiated skips set is_admin_initiated = true and are
--    inserted directly with status = 'approved' (silent, no client
--    notification).
--    UNIQUE constraint prevents duplicate skips for same
--    client / date / meal combination.
-- ----------------------------------------------------------------
CREATE TABLE skip_requests (
    id                   VARCHAR(50)  PRIMARY KEY,
    client_id            VARCHAR(50)  NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    date                 DATE         NOT NULL,
    meal_type            VARCHAR(10)  NOT NULL CHECK (meal_type IN ('Lunch', 'Dinner')),
    status               VARCHAR(20)  NOT NULL DEFAULT 'pending'
                           CHECK (status IN ('pending', 'approved', 'rejected')),
    is_admin_initiated   BOOLEAN      NOT NULL DEFAULT false,
    requested_by         VARCHAR(50)  REFERENCES users(id) ON DELETE SET NULL,
    requested_at         TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    approved_at          TIMESTAMP WITH TIME ZONE,
    approved_by          VARCHAR(50)  REFERENCES users(id) ON DELETE SET NULL,
    CONSTRAINT unique_skip_per_meal UNIQUE (client_id, date, meal_type)
);

-- ----------------------------------------------------------------
-- 4. DAILY DELIVERIES
--    One row per client / date / meal_type.
--
--    Lifecycle:
--      pending      → created when admin opens Today view (auto-generated
--                     for all active subscribers without an approved skip)
--      assigned     → admin assigns a delivery person
--      delivered    → delivery person marks it done
--      not_available→ delivery person marks "client not at site"
--      skipped      → linked to an approved skip_request
--
--    Admin can also manually insert a row (override / reversal).
-- ----------------------------------------------------------------
CREATE TABLE daily_deliveries (
    id                   VARCHAR(50)  PRIMARY KEY,
    client_id            VARCHAR(50)  NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    delivery_person_id   VARCHAR(50)  REFERENCES users(id) ON DELETE SET NULL,
    date                 DATE         NOT NULL,
    meal_type            VARCHAR(10)  NOT NULL CHECK (meal_type IN ('Lunch', 'Dinner')),
    status               VARCHAR(20)  NOT NULL DEFAULT 'pending'
                           CHECK (status IN (
                               'pending',
                               'assigned',
                               'delivered',
                               'not_available',
                               'skipped'
                           )),
    skip_request_id      VARCHAR(50)  REFERENCES skip_requests(id) ON DELETE SET NULL,
    assigned_at          TIMESTAMP WITH TIME ZONE,
    delivered_at         TIMESTAMP WITH TIME ZONE,
    delivery_note        TEXT,         -- e.g. "client not available at site"
    created_at           TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT unique_delivery_per_meal UNIQUE (client_id, date, meal_type)
);

-- ----------------------------------------------------------------
-- 5. LOCATION FARES
--    Base delivery charge per location area.
--    Used for admin pricing configuration.
-- ----------------------------------------------------------------
CREATE TABLE location_fares (
    location        VARCHAR(255) PRIMARY KEY,
    charge          NUMERIC(10,2) NOT NULL,
    effective_from  DATE          NOT NULL DEFAULT CURRENT_DATE,
    created_at      TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ----------------------------------------------------------------
-- 6. PAYMENTS
--    Monthly reconciliation per client.
--    Linked to the subscription that covers that billing cycle.
-- ----------------------------------------------------------------
CREATE TABLE payments (
    id               VARCHAR(100) PRIMARY KEY,  -- "{client_id}-{year}-{month}"
    client_id        VARCHAR(50)  NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    subscription_id  VARCHAR(50)  REFERENCES subscriptions(id) ON DELETE SET NULL,
    month            INTEGER      NOT NULL CHECK (month BETWEEN 1 AND 12),
    year             INTEGER      NOT NULL,
    amount           NUMERIC(10,2),             -- snapshot of subscription amount
    status           VARCHAR(10)  NOT NULL DEFAULT 'unpaid'
                       CHECK (status IN ('paid', 'unpaid')),
    settled_at       DATE,
    created_at       TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT unique_payment_cycle UNIQUE (client_id, year, month)
);

-- ----------------------------------------------------------------
-- INDEXES
-- ----------------------------------------------------------------

-- Skip requests: admin Today view queries by date + status
CREATE INDEX idx_skip_date_status
    ON skip_requests(date, status);

-- Skip requests: client "my skips" view
CREATE INDEX idx_skip_client_date
    ON skip_requests(client_id, date);

-- Daily deliveries: Today view — all deliveries for a given date
CREATE INDEX idx_delivery_date
    ON daily_deliveries(date);

-- Daily deliveries: delivery person's list for today
CREATE INDEX idx_delivery_person_date
    ON daily_deliveries(delivery_person_id, date);

-- Daily deliveries: client history
CREATE INDEX idx_delivery_client_date
    ON daily_deliveries(client_id, date);

-- Subscriptions: find active subscription for a client
CREATE INDEX idx_subscription_client_status
    ON subscriptions(client_id, status);

-- ----------------------------------------------------------------
-- SEED DATA
-- ----------------------------------------------------------------

-- Default admin account (change password after first login)
INSERT INTO users (id, name, phone_number, role, location, username, password_hash)
VALUES (
    'admin_1',
    'Arusuvai Admin',
    '',
    'admin',
    'Kitchen HQ',
    'admin',
    '$2b$10$11O4CyAAVe84igQE1gFgSOHu2vkbtZ4jXRaKeViOWz/6qgM9cbwP2'
);

-- ----------------------------------------------------------------
-- 7. WEEKLY MENU
--    Stores the weekly menu items for each day per type (veg/non_veg)
--    and meal (Lunch/Dinner). Admin manages this from the admin panel.
-- ----------------------------------------------------------------
CREATE TABLE IF NOT EXISTS weekly_menu (
    id          SERIAL PRIMARY KEY,
    menu_type   VARCHAR(10) NOT NULL CHECK (menu_type IN ('veg', 'non_veg')),
    day_of_week VARCHAR(10) NOT NULL CHECK (day_of_week IN ('Monday','Tuesday','Wednesday','Thursday','Friday')),
    meal_type   VARCHAR(10) NOT NULL CHECK (meal_type IN ('Lunch','Dinner')),
    items       TEXT[]      NOT NULL DEFAULT '{}',
    updated_at  TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT unique_menu_day_meal UNIQUE (menu_type, day_of_week, meal_type)
);

-- ----------------------------------------------------------------
-- 8. SUBSCRIPTION PLANS
--    Public-facing pricing cards managed by admin.
-- ----------------------------------------------------------------
CREATE TABLE IF NOT EXISTS subscription_plans (
    id              SERIAL PRIMARY KEY,
    plan_name       VARCHAR(50)   NOT NULL,
    plan_type       VARCHAR(20)   NOT NULL,
    price           NUMERIC(10,2) NOT NULL,
    duration_days   INTEGER       NOT NULL DEFAULT 26,
    features        TEXT[]        NOT NULL DEFAULT '{}',
    whatsapp_number VARCHAR(20)   NOT NULL DEFAULT '',
    is_active       BOOLEAN       NOT NULL DEFAULT true,
    sort_order      INTEGER       NOT NULL DEFAULT 0,
    updated_at      TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ----------------------------------------------------------------
-- SEED: Weekly Menu (Veg — Lunch)
-- ----------------------------------------------------------------
INSERT INTO weekly_menu (menu_type, day_of_week, meal_type, items) VALUES
  ('veg', 'Monday',    'Lunch', ARRAY['Rice', 'Sambar', 'Poriyal', 'Rasam', 'Buttermilk', 'Appalam']),
  ('veg', 'Tuesday',   'Lunch', ARRAY['Rice', 'Kootu', 'Poriyal', 'Rasam', 'Buttermilk', 'Appalam']),
  ('veg', 'Wednesday', 'Lunch', ARRAY['Rice', 'Kara Kulambu', 'Poriyal', 'Rasam', 'Buttermilk', 'Appalam']),
  ('veg', 'Thursday',  'Lunch', ARRAY['Rice', 'Sambar', 'Kootu', 'Rasam', 'Buttermilk', 'Appalam']),
  ('veg', 'Friday',    'Lunch', ARRAY['Lemon Rice', 'Kootu', 'Poriyal', 'Rasam', 'Buttermilk', 'Appalam'])
ON CONFLICT (menu_type, day_of_week, meal_type) DO NOTHING;

-- ----------------------------------------------------------------
-- SEED: Weekly Menu (Veg — Dinner)
-- ----------------------------------------------------------------
INSERT INTO weekly_menu (menu_type, day_of_week, meal_type, items) VALUES
  ('veg', 'Monday',    'Dinner', ARRAY['Chapati', 'Dal', 'Sabzi']),
  ('veg', 'Tuesday',   'Dinner', ARRAY['Rice', 'Rasam', 'Papad']),
  ('veg', 'Wednesday', 'Dinner', ARRAY['Chapati', 'Kurma', 'Rice']),
  ('veg', 'Thursday',  'Dinner', ARRAY['Rice', 'Sambar', 'Sabzi']),
  ('veg', 'Friday',    'Dinner', ARRAY['Chapati', 'Dal Fry', 'Salad'])
ON CONFLICT (menu_type, day_of_week, meal_type) DO NOTHING;

-- ----------------------------------------------------------------
-- SEED: Weekly Menu (Non-Veg — Lunch)
-- ----------------------------------------------------------------
INSERT INTO weekly_menu (menu_type, day_of_week, meal_type, items) VALUES
  ('non_veg', 'Monday',    'Lunch', ARRAY['Rice', 'Chicken Kulambu', 'Poriyal', 'Rasam', 'Buttermilk', 'Appalam']),
  ('non_veg', 'Tuesday',   'Lunch', ARRAY['Rice', 'Sambar', 'Kootu', 'Poriyal', 'Rasam', 'Buttermilk', 'Appalam']),
  ('non_veg', 'Wednesday', 'Lunch', ARRAY['Rice', 'Kara Kulambu', 'Poriyal', 'Rasam', 'Buttermilk', 'Appalam']),
  ('non_veg', 'Thursday',  'Lunch', ARRAY['Rice', 'Sambar', 'Kootu', 'Poriyal', 'Rasam', 'Buttermilk', 'Appalam']),
  ('non_veg', 'Friday',    'Lunch', ARRAY['Lemon Rice', 'Egg Curry', 'Poriyal', 'Rasam', 'Buttermilk', 'Appalam'])
ON CONFLICT (menu_type, day_of_week, meal_type) DO NOTHING;

-- ----------------------------------------------------------------
-- SEED: Weekly Menu (Non-Veg — Dinner)
-- ----------------------------------------------------------------
INSERT INTO weekly_menu (menu_type, day_of_week, meal_type, items) VALUES
  ('non_veg', 'Monday',    'Dinner', ARRAY['Chapati', 'Chicken Curry', 'Rice']),
  ('non_veg', 'Tuesday',   'Dinner', ARRAY['Rice', 'Fish Curry', 'Papad']),
  ('non_veg', 'Wednesday', 'Dinner', ARRAY['Chapati', 'Egg Masala', 'Rice']),
  ('non_veg', 'Thursday',  'Dinner', ARRAY['Rice', 'Mutton Kulambu', 'Sabzi']),
  ('non_veg', 'Friday',    'Dinner', ARRAY['Chapati', 'Chicken Gravy', 'Salad'])
ON CONFLICT (menu_type, day_of_week, meal_type) DO NOTHING;

-- ----------------------------------------------------------------
-- SEED: Subscription Plans
-- ----------------------------------------------------------------
INSERT INTO subscription_plans (plan_name, plan_type, price, duration_days, features, whatsapp_number, is_active, sort_order) VALUES
  (
    'Lunch (Veg)', 'veg', 3600, 26,
    ARRAY['Pure Vegetarian Meals', 'Freshly Cooked Daily', 'Delivered in Steel Containers', 'Lunch Delivery'],
    '919876543210', true, 1
  ),
  (
    'Lunch (Non Veg)', 'non_veg', 4200, 26,
    ARRAY['Non Vegetarian Meals', 'Freshly Cooked Daily', 'Delivered in Steel Containers', 'Lunch Delivery'],
    '919876543210', true, 2
  ),
  (
    'Dinner', 'dinner', 2000, 26,
    ARRAY['Homely Dinner Meals', 'Freshly Cooked Daily', 'Delivered in Steel Containers', 'Dinner Delivery'],
    '919876543210', true, 3
  )
ON CONFLICT DO NOTHING;

-- ================================================================
-- NOTES FOR APPLICATION LAYER
-- ================================================================
--
-- SERVICE DAY COUNT (Mon–Fri, excl. Sat + Sun):
--   SELECT COUNT(*) FROM generate_series(start_date, end_date, '1 day'::interval) AS d
--   WHERE EXTRACT(DOW FROM d) NOT IN (0, 6);
--   DOW: 0 = Sunday, 6 = Saturday
--
-- DAYS REMAINING (from today to end_date, Mon–Fri):
--   Same query with start = CURRENT_DATE
--
-- TODAY VIEW GENERATION (admin):
--   For each active subscriber (subscription active for CURRENT_DATE),
--   insert a daily_deliveries row for Lunch and Dinner if one does not
--   already exist and no approved skip_request exists for that meal.
--   Use ON CONFLICT DO NOTHING for idempotency.
--
-- SUBSCRIPTION STATUS AUTO-EXPIRE:
--   Run nightly: UPDATE subscriptions SET status = 'expired'
--   WHERE end_date < CURRENT_DATE AND status = 'active';
--   (Or compute in application layer on read.)
--
-- ================================================================
