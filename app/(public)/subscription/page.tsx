import React from 'react';
import pool from '@/lib/db';
import PricingCard from '@/components/public/PricingCard';
import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Subscription Packages | Arusuvai - The Home Kitchen',
  description: 'Choose your Arusuvai meal subscription. Veg Lunch, Non-Veg Lunch, and Dinner packages. Fresh homemade meals delivered daily.',
};

export const revalidate = 60;

interface Plan {
  id: string;
  plan_name: string;
  plan_type: string;
  price: number;
  duration_days: number;
  features: string[];
  whatsapp_number: string;
}

async function getPlans(): Promise<Plan[]> {
  try {
    const result = await pool.query(
      `SELECT 
         id,
         name AS plan_name,
         CASE 
           WHEN meal_type = 'Dinner' THEN 'dinner'
           WHEN diet_type = 'Non-Veg' THEN 'non_veg'
           ELSE 'veg'
         END AS plan_type,
         price,
         days AS duration_days,
         features,
         whatsapp_number
       FROM subscription_packages
       WHERE is_public = true
       ORDER BY sort_order ASC, created_at DESC`
    );
    return result.rows;
  } catch {
    return [];
  }
}

const BENEFITS = [
  { icon: '🏠', title: 'Freshly Cooked Daily', desc: 'Every meal is prepared each morning in our home kitchen' },
  { icon: '🌿', title: 'Zero Preservatives', desc: 'Only natural, seasonal ingredients — nothing artificial' },
  { icon: '🛵', title: 'Doorstep Delivery', desc: 'Your hot meal delivered Monday to Saturday' },
  { icon: '♻️', title: 'Eco Steel Tiffin', desc: 'Reusable stainless steel containers — better for the planet' },
  { icon: '📅', title: 'Monday – Saturday', desc: 'Six days a week, dependable every time' },
  { icon: '💬', title: 'WhatsApp Support', desc: 'Easy ordering and changes directly through WhatsApp' },
];

export default async function SubscriptionPage() {
  const plans = await getPlans();

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Quicksand:wght@300..700&display=swap');
        .sp { font-family: 'Quicksand', sans-serif; background: #FFFDF7; color: #1C2B1C; }
        .sp * { box-sizing: border-box; }

        /* Hero */
        .sp-hero {
          display: grid;
          grid-template-columns: 1fr 1fr;
          min-height: 50vh;
          align-items: stretch;
        }
        .sp-hero-left {
          display: flex; flex-direction: column; justify-content: center;
          padding: 72px 56px 72px 80px;
          background: #FFFDF7;
        }
        .sp-hero-right {
          position: relative; overflow: hidden;
        }
        .sp-hero-right img {
          width: 100%; height: 100%; object-fit: cover; display: block;
        }
        .sp-hero-right::after {
          content: ''; position: absolute; inset: 0;
          background: linear-gradient(to right, rgba(255,253,247,0.3) 0%, transparent 50%);
        }
        .sp-kicker {
          font-size: 10px; font-weight: 800; letter-spacing: 0.18em;
          text-transform: uppercase; color: #E8A020;
          margin-bottom: 18px;
          display: flex; align-items: center; gap: 8px;
        }
        .sp-kicker::before {
          content: ''; width: 20px; height: 2px; background: #E8A020; border-radius: 2px;
        }
        .sp-h1 {
          font-size: clamp(34px, 5vw, 58px);
          font-weight: 800; color: #1A2E1A;
          line-height: 1.1; letter-spacing: -0.025em; margin-bottom: 16px;
        }
        .sp-sub {
          font-size: 14px; color: #5C6E5C; line-height: 1.7; font-weight: 500; max-width: 380px;
        }
        .sp-divider { height: 1px; background: #E8E2D5; }

        /* Plans section */
        .sp-section { padding: 80px 80px; }
        .sp-section-alt { background: #F7F4EE; }
        .sp-inner { max-width: 1160px; margin: 0 auto; }
        .sp-sec-kicker {
          font-size: 10px; font-weight: 800; letter-spacing: 0.18em;
          text-transform: uppercase; color: #E8A020;
          margin-bottom: 12px;
          display: flex; align-items: center; gap: 8px;
        }
        .sp-sec-kicker::before {
          content: ''; width: 18px; height: 2px; background: #E8A020; border-radius: 2px;
        }
        .sp-h2 {
          font-size: clamp(26px, 3.5vw, 44px);
          font-weight: 800; color: #1A2E1A;
          line-height: 1.15; letter-spacing: -0.02em; margin-bottom: 10px;
        }
        .sp-p {
          font-size: 14px; color: #5C6E5C; max-width: 460px; line-height: 1.7;
        }
        .plans-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
          gap: 24px;
          margin-top: 48px;
          align-items: center;
        }

        /* Benefits */
        .benefits-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
          gap: 16px;
          margin-top: 44px;
        }
        .benefit-card {
          display: flex; align-items: flex-start; gap: 14px;
          padding: 20px;
          background: #fff;
          border: 1px solid #E8E2D5;
          border-radius: 14px;
          transition: box-shadow 0.2s;
        }
        .benefit-card:hover { box-shadow: 0 4px 16px rgba(0,0,0,0.06); }
        .benefit-icon {
          width: 42px; height: 42px;
          border-radius: 10px;
          background: #EBF5EB;
          border: 1px solid #C8D8C8;
          display: flex; align-items: center; justify-content: center;
          font-size: 18px; flex-shrink: 0;
        }
        .benefit-title { font-size: 13.5px; font-weight: 800; color: #1A2E1A; margin-bottom: 3px; }
        .benefit-desc { font-size: 12px; color: #5C6E5C; line-height: 1.6; }

        /* Contact CTA */
        .sp-cta {
          background: #EBF5EB;
          border-top: 1px solid #C8D8C8;
          padding: 72px 80px;
          text-align: center;
        }
        .sp-cta-inner { max-width: 560px; margin: 0 auto; }

        @media (max-width: 860px) {
          .sp-hero { grid-template-columns: 1fr; min-height: auto; }
          .sp-hero-left { padding: 48px 24px 36px; order: 1; }
          .sp-hero-right { min-height: 240px; max-height: 320px; order: 2; aspect-ratio: 16/9; }
          .sp-section, .sp-cta { padding: 52px 24px; }
          .plans-grid { grid-template-columns: 1fr; }
          .benefits-grid { grid-template-columns: 1fr; }
        }
        @media (max-width: 480px) {
          .sp-hero-right { min-height: 180px; max-height: 240px; }
          .sp-h1 { font-size: 32px; }
        }
      `}</style>

      <div className="sp">

        {/* Hero */}
        <section className="sp-hero">
          <div className="sp-hero-left">
            <div className="sp-kicker">Subscription Plans</div>
            <h1 className="sp-h1">Eat Well,<br />Every Day</h1>
            <p className="sp-sub">
              Choose a plan that fits you. Fresh home-cooked meals at your doorstep, Monday to Saturday — no fuss, no preservatives.
            </p>
          </div>
          <div className="sp-hero-right">
            <img src="/images/Subscription Packages Page Jute Bag Banner.png" alt="Arusuvai jute bag and tiffin carrier" />
          </div>
        </section>

        <div className="sp-divider" />

        {/* Plans */}
        <section className="sp-section">
          <div className="sp-inner">
            <div className="sp-sec-kicker">Choose Your Plan</div>
            <h2 className="sp-h2">Subscription Packages</h2>
            <p className="sp-p">All plans include fresh daily meals, eco-friendly delivery, and WhatsApp support.</p>
            {plans.length > 0 ? (
              <div className="plans-grid">
                {plans.map((plan, idx) => (
                  <PricingCard key={plan.id} plan={plan} featured={idx === 1} />
                ))}
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: '60px 20px', color: '#5C6E5C' }}>
                <p style={{ fontSize: 15 }}>Plans are being updated. Please contact us on WhatsApp for current pricing.</p>
              </div>
            )}
          </div>
        </section>

        <div className="sp-divider" />

        {/* Benefits */}
        <section className="sp-section sp-section-alt">
          <div className="sp-inner">
            <div className="sp-sec-kicker">Why Arusuvai</div>
            <h2 className="sp-h2">What You Get</h2>
            <p className="sp-p">Every subscription comes with these promises from our kitchen to yours.</p>
            <div className="benefits-grid">
              {BENEFITS.map(b => (
                <div key={b.title} className="benefit-card">
                  <div className="benefit-icon">{b.icon}</div>
                  <div>
                    <div className="benefit-title">{b.title}</div>
                    <div className="benefit-desc">{b.desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <div className="sp-divider" />

        {/* CTA */}
        <section className="sp-cta">
          <div className="sp-cta-inner">
            <div style={{ fontSize: 36, marginBottom: 14 }}>💬</div>
            <h2 style={{ fontSize: 'clamp(24px, 3.5vw, 40px)', fontWeight: 800, color: '#1A2E1A', marginBottom: 12, letterSpacing: '-0.02em' }}>
              Have Questions?
            </h2>
            <p style={{ fontSize: 14, color: '#5C6E5C', marginBottom: 28, lineHeight: 1.7 }}>
              Not sure which plan to choose? Message us on WhatsApp — we&apos;ll help you pick the right one and get you started today.
            </p>
            <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
              <a href="https://wa.me/918667670695" target="_blank" rel="noopener noreferrer" style={{
                padding: '13px 28px', background: '#2C5E2E', color: '#fff',
                borderRadius: 10, fontSize: 13.5, fontWeight: 800, textDecoration: 'none',
                display: 'flex', alignItems: 'center', gap: 8,
              }}>💬 Chat on WhatsApp</a>
              <Link href="/menu" style={{
                padding: '12px 22px', background: '#fff', color: '#2C5E2E',
                border: '1.5px solid #C8D8C8',
                borderRadius: 10, fontSize: 13.5, fontWeight: 700, textDecoration: 'none',
              }}>View Menu →</Link>
            </div>
          </div>
        </section>

      </div>
    </>
  );
}
