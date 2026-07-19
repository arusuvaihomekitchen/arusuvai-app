import React from 'react';
import pool from '@/lib/db';
import MenuTabs from '@/components/public/MenuTabs';
import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Our Menu | Arusuvai - The Home Kitchen',
  description: 'See our weekly menus. Fresh, home-cooked South Indian meals delivered daily.',
};

export const revalidate = 60;

export default async function UnifiedMenuPage() {
  const [menuRowsResult, settingsResult] = await Promise.all([
    pool.query(`
      SELECT menu_type, day_of_week, meal_type, items, is_veg_override FROM weekly_menu
      ORDER BY CASE day_of_week
        WHEN 'Monday' THEN 1 WHEN 'Tuesday' THEN 2 WHEN 'Wednesday' THEN 3
        WHEN 'Thursday' THEN 4 WHEN 'Friday' THEN 5 WHEN 'Saturday' THEN 6 ELSE 7 END
    `).catch(() => ({ rows: [] })),
    pool.query("SELECT setting_value FROM site_settings WHERE setting_key = 'menu_date_range'").catch(() => ({ rows: [] }))
  ]);
  
  const menuRows = menuRowsResult.rows;
  const dateRange = settingsResult.rows[0]?.setting_value || 'This Week';

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Quicksand:wght@300..700&display=swap');
        .up { font-family: 'Quicksand', sans-serif; background: #FFFDF7; color: #1C2B1C; }
        .up * { box-sizing: border-box; }

        .up-hero {
          display: grid;
          grid-template-columns: 1fr 1fr;
          min-height: 40vh;
          align-items: stretch;
          background: #FFFDF7;
        }
        .up-hero-left {
          display: flex; flex-direction: column; justify-content: center;
          padding: 72px 56px 72px 80px;
        }
        .up-hero-right {
          position: relative; overflow: hidden;
        }
        .up-hero-right img {
          width: 100%; height: 100%; object-fit: cover; display: block;
        }
        .up-hero-right::after {
          content: '';
          position: absolute; inset: 0;
          background: linear-gradient(to right, rgba(255,253,247,0.3) 0%, transparent 50%);
        }
        .up-kicker {
          font-size: 10px; font-weight: 800; letter-spacing: 0.18em;
          text-transform: uppercase; color: #2C5E2E;
          margin-bottom: 18px;
          display: flex; align-items: center; gap: 8px;
        }
        .up-kicker::before {
          content: ''; width: 20px; height: 2px; background: #E8A020; border-radius: 2px;
        }
        .up-h1 {
          font-size: clamp(34px, 5vw, 58px);
          font-weight: 800; color: #1A2E1A;
          line-height: 1.1; letter-spacing: -0.025em; margin-bottom: 16px;
        }
        .up-sub {
          font-size: 14px; color: #5C6E5C; line-height: 1.7; font-weight: 500; max-width: 380px; margin-bottom: 24px;
        }

        .up-section { padding: 40px 80px 72px; }
        .up-inner { max-width: 1160px; margin: 0 auto; }
        
        .up-cta {
          background: #EBF5EB;
          border-top: 1px solid #C8D8C8;
          padding: 64px 80px;
          text-align: center;
        }
        .up-cta-inner { max-width: 520px; margin: 0 auto; }

        @media (max-width: 860px) {
          .up-hero { grid-template-columns: 1fr; min-height: auto; }
          .up-hero-left { padding: 48px 24px 36px; order: 1; }
          .up-hero-right { min-height: 200px; max-height: 280px; order: 2; aspect-ratio: 16/9; }
          .up-section, .up-cta { padding: 32px 24px 52px; }
        }
      `}</style>

      <div className="up">
        {/* Hero */}
        <section className="up-hero">
          <div className="up-hero-left">
            <div className="up-kicker">Weekly Menu — {dateRange.toUpperCase()}</div>
            <h1 className="up-h1">Explore Our<br />Packages</h1>
            <p className="up-sub">
              Wholesome South Indian meals prepared fresh every morning. Choose your preferred package and see what's cooking this week.
            </p>
          </div>
          <div className="up-hero-right">
            <img src="/images/Vegetarian Weekly Menu Page Header.png" alt="South Indian thali" />
          </div>
        </section>

        {/* Menu Tabs Section */}
        <section className="up-section">
          <div className="up-inner">
            <MenuTabs menuRows={menuRows} dateRange={dateRange} />
          </div>
        </section>

        {/* CTA */}
        <section className="up-cta">
          <div className="up-cta-inner">
            <div style={{ fontSize: 36, marginBottom: 12 }}>🍛</div>
            <h2 style={{ fontSize: 'clamp(24px, 3.5vw, 38px)', fontWeight: 800, color: '#1A2E1A', marginBottom: 10, letterSpacing: '-0.02em' }}>
              Ready to Subscribe?
            </h2>
            <p style={{ fontSize: 14, color: '#5C6E5C', marginBottom: 24, lineHeight: 1.7 }}>
              Get freshly prepared meals at your doorstep Monday to Saturday.
            </p>
            <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
              <Link href="/subscription" style={{
                padding: '12px 26px', background: '#2C5E2E', color: '#fff',
                borderRadius: 10, fontSize: 13.5, fontWeight: 800, textDecoration: 'none',
              }}>View Subscription Plans →</Link>
            </div>
          </div>
        </section>
      </div>
    </>
  );
}
