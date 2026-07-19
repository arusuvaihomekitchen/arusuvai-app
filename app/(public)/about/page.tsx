import React from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'About Us | Arusuvai - The Home Kitchen',
  description: 'Learn about Arusuvai - The Home Kitchen — our story, our values, and why we believe home-cooked food is the best food.',
};

const VALUES = [
  { icon: '🏠', title: 'Made in a Home Kitchen', desc: 'Every dish is prepared in our family kitchen each morning — not a restaurant, not a factory. Real home cooking.' },
  { icon: '🌿', title: 'Zero Preservatives', desc: 'We use only fresh, seasonal ingredients. No packets, no shortcuts — just clean, honest food.' },
  { icon: '♻️', title: 'Eco Steel Tiffin', desc: 'We deliver in reusable stainless steel tiffin carriers. Better for you, better for the planet.' },
  { icon: '🛵', title: 'Doorstep Delivery', desc: 'Your hot meal arrives at your door Monday to Saturday — fresh and ready to eat.' },
  { icon: '🤝', title: 'Personal Service', desc: 'We know our customers by name. Reach us on WhatsApp for changes, feedback, or just to say hi.' },
  { icon: '⚖️', title: 'Balanced Nutrition', desc: 'Every meal is designed to be complete — rice, curry, sides, rasam, buttermilk — a proper South Indian spread.' },
];

const TEAM = [
  {
    name: 'Our Kitchen',
    role: 'Where every meal begins',
    desc: 'Our home kitchen is where we spend our mornings — chopping, grinding, cooking. Every dal is tempered, every rice is steamed fresh.',
    img: '/images/Landing Page.png',
  },
  {
    name: 'Our Menu',
    role: 'Six tastes, every day',
    desc: 'Arusuvai means "six tastes" in Tamil. Our menu is designed to cover every flavor — sweet, sour, salty, bitter, pungent, and astringent.',
    img: '/images/Vegetarian Weekly Menu Page Header.png',
  },
];

export default function AboutPage() {
  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Quicksand:wght@300..700&display=swap');
        .ap { font-family: 'Quicksand', sans-serif; background: #FFFDF7; color: #1C2B1C; }
        .ap * { box-sizing: border-box; }

        /* Hero */
        .ap-hero {
          padding: 80px 80px 64px;
          max-width: 900px;
          margin: 0 auto;
          text-align: center;
        }
        .ap-kicker {
          display: inline-flex; align-items: center; gap: 8px;
          font-size: 10px; font-weight: 800; letter-spacing: 0.18em;
          text-transform: uppercase; color: #E8A020; margin-bottom: 20px;
        }
        .ap-kicker::before, .ap-kicker::after {
          content: ''; display: block; width: 28px; height: 2px;
          background: #E8A020; border-radius: 2px;
        }
        .ap-h1 {
          font-size: clamp(38px, 5.5vw, 66px);
          font-weight: 800; color: #1A2E1A;
          line-height: 1.08; letter-spacing: -0.025em; margin-bottom: 20px;
        }
        .ap-h1 span { color: #2C5E2E; }
        .ap-lead {
          font-size: 16.5px; color: #5C6E5C;
          line-height: 1.75; max-width: 620px; margin: 0 auto;
          font-weight: 500;
        }

        .ap-divider { height: 1px; background: #E8E2D5; }

        /* Story split */
        .ap-story {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 0;
          min-height: 460px;
        }
        .ap-story-img {
          overflow: hidden;
        }
        .ap-story-img img { width: 100%; height: 100%; object-fit: cover; display: block; }
        .ap-story-text {
          padding: 64px 72px;
          display: flex; flex-direction: column; justify-content: center;
          background: #F7F4EE;
        }
        .ap-sec-kicker {
          font-size: 10px; font-weight: 800; letter-spacing: 0.16em;
          text-transform: uppercase; color: #E8A020;
          margin-bottom: 14px;
          display: flex; align-items: center; gap: 7px;
        }
        .ap-sec-kicker::before {
          content: ''; width: 18px; height: 2px; background: #E8A020; border-radius: 2px;
        }
        .ap-h2 {
          font-size: clamp(26px, 3.5vw, 40px);
          font-weight: 800; color: #1A2E1A;
          line-height: 1.15; letter-spacing: -0.02em; margin-bottom: 16px;
        }
        .ap-p {
          font-size: 14px; color: #5C6E5C; line-height: 1.8; margin-bottom: 14px;
        }

        /* Values */
        .ap-values { padding: 80px 80px; }
        .ap-values-inner { max-width: 1160px; margin: 0 auto; }
        .ap-values-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 20px;
          margin-top: 52px;
        }
        .ap-value-card {
          padding: 28px 24px;
          background: #fff;
          border: 1px solid #E8E2D5;
          border-radius: 16px;
          transition: box-shadow 0.2s, transform 0.2s, border-color 0.2s;
        }
        .ap-value-card:hover {
          box-shadow: 0 8px 28px rgba(0,0,0,0.08);
          transform: translateY(-2px);
          border-color: #C8D8C8;
        }
        .ap-value-icon {
          width: 48px; height: 48px; border-radius: 12px;
          background: #EBF5EB; border: 1px solid #C8D8C8;
          display: flex; align-items: center; justify-content: center;
          font-size: 22px; margin-bottom: 16px;
        }
        .ap-value-title {
          font-size: 15px; font-weight: 800; color: #1A2E1A; margin-bottom: 8px;
        }
        .ap-value-desc {
          font-size: 13px; color: #5C6E5C; line-height: 1.65;
        }

        /* Story cards */
        .ap-story-cards {
          padding: 0 80px 80px;
          max-width: 1160px;
          margin: 0 auto;
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 24px;
        }
        .ap-story-card {
          border: 1px solid #E8E2D5;
          border-radius: 20px;
          overflow: hidden;
          background: #fff;
        }
        .ap-story-card-img {
          height: 220px; overflow: hidden;
        }
        .ap-story-card-img img { width: 100%; height: 100%; object-fit: cover; }
        .ap-story-card-body { padding: 24px; }
        .ap-story-card-role {
          font-size: 10px; font-weight: 800; letter-spacing: 0.14em;
          text-transform: uppercase; color: #E8A020; margin-bottom: 7px;
        }
        .ap-story-card-name {
          font-size: 18px; font-weight: 800; color: #1A2E1A; margin-bottom: 8px;
        }
        .ap-story-card-desc {
          font-size: 13px; color: #5C6E5C; line-height: 1.7;
        }

        /* How it works */
        .ap-hiw {
          background: #F7F4EE;
          border-top: 1px solid #E8E2D5;
          border-bottom: 1px solid #E8E2D5;
          padding: 80px 80px;
        }
        .ap-hiw-inner { max-width: 1160px; margin: 0 auto; }
        .ap-hiw-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 2px;
          margin-top: 52px;
          background: #E8E2D5;
          border-radius: 16px;
          overflow: hidden;
        }
        .ap-hiw-card {
          background: #FFFDF7;
          padding: 36px 32px;
        }
        .ap-hiw-num {
          font-size: 52px; font-weight: 900; color: #E8E2D5; line-height: 1; margin-bottom: 12px;
        }
        .ap-hiw-icon { font-size: 28px; margin-bottom: 10px; }
        .ap-hiw-title { font-size: 17px; font-weight: 800; color: #1A2E1A; margin-bottom: 8px; }
        .ap-hiw-desc { font-size: 13px; color: #5C6E5C; line-height: 1.65; }

        /* CTA */
        .ap-cta {
          padding: 80px 80px;
          text-align: center;
          background: #EBF5EB;
          border-top: 1px solid #C8D8C8;
        }
        .ap-cta-inner { max-width: 560px; margin: 0 auto; }
        .ap-btn-green {
          padding: 13px 30px;
          background: #2C5E2E;
          color: #fff; text-decoration: none;
          border-radius: 10px; font-size: 14px; font-weight: 800;
          display: inline-flex; align-items: center; gap: 8px;
          font-family: 'Quicksand', sans-serif;
          transition: background 0.15s, transform 0.15s;
        }
        .ap-btn-green:hover { background: #1A3A1C; transform: translateY(-1px); }
        .ap-btn-ghost {
          padding: 12px 24px;
          background: #fff; color: #2C5E2E;
          border: 1.5px solid #C8D8C8;
          text-decoration: none; border-radius: 10px;
          font-size: 14px; font-weight: 700;
          display: inline-flex; align-items: center; gap: 8px;
          font-family: 'Quicksand', sans-serif;
          transition: border-color 0.15s, background 0.15s;
        }
        .ap-btn-ghost:hover { border-color: #2C5E2E; background: #F0F7F0; }

        @media (max-width: 900px) {
          .ap-hero { padding: 56px 24px 48px; }
          .ap-story { grid-template-columns: 1fr; }
          .ap-story-img { min-height: 260px; max-height: 360px; }
          .ap-story-text { padding: 48px 28px; }
          .ap-values { padding: 56px 24px; }
          .ap-values-grid { grid-template-columns: 1fr 1fr; }
          .ap-story-cards { padding: 0 24px 56px; grid-template-columns: 1fr; }
          .ap-hiw { padding: 56px 24px; }
          .ap-hiw-grid { grid-template-columns: 1fr; }
          .ap-cta { padding: 56px 24px; }
        }
        @media (max-width: 540px) {
          .ap-values-grid { grid-template-columns: 1fr; }
        }
      `}</style>

      <div className="ap">

        {/* Hero */}
        <section className="ap-hero">
          <div className="ap-kicker">Our Story</div>
          <h1 className="ap-h1">Six Tastes.<br /><span>One Kitchen.</span></h1>
          <div className="ap-lead" style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <p>Arusuvai - The Home Kitchen started with a simple love for healthy, homemade food and a dream to share the warmth of home-cooked flavours with every family.</p>
            <p>Every recipe is made with care, using quality ingredients and a personal touch — just like we prepare food for our own loved ones.</p>
            <p style={{ fontWeight: 700, color: '#2C5E2E' }}>Arusuvai - The Home Kitchen — Homemade with Love, Nourishing Every Heart.</p>
          </div>
        </section>

        <div className="ap-divider" />

        {/* Story split */}
        <section className="ap-story">
          <div className="ap-story-img">
            <img src="/images/Landing Page.png" alt="Arusuvai tiffin being packed fresh" />
          </div>
          <div className="ap-story-text">
            <div className="ap-sec-kicker">What We Do</div>
            <h2 className="ap-h2">Food That<br />Feels Like Home</h2>
            <p className="ap-p">
              Home is where the best food is made. At Arusuvai – The Home Kitchen, we bring you the warmth of homemade meals prepared with fresh ingredients, traditional flavours, and heartfelt love—because every bite should feel like home. ❤️
            </p>
            <p className="ap-p">
              Every morning, we cook fresh, pack our meals in traditional steel tiffin carriers, and deliver them straight to your doorstep. No preservatives. No shortcuts. Just honest, home-cooked goodness made with care.
            </p>
            <p className="ap-p" style={{ marginBottom: 0 }}>
              Serving delicious vegetarian and non-vegetarian meals Monday to Saturday—rain or shine, from our kitchen to your home. ❤️
            </p>
          </div>
        </section>

        <div className="ap-divider" />

        {/* Values */}
        <section className="ap-values">
          <div className="ap-values-inner">
            <div style={{ textAlign: 'center' }}>
              <div className="ap-sec-kicker" style={{ justifyContent: 'center' }}>Our Promise</div>
              <h2 className="ap-h2">What We Stand For</h2>
              <p style={{ fontSize: 14, color: '#5C6E5C', maxWidth: 480, margin: '0 auto', lineHeight: 1.7 }}>
                Every decision we make comes back to one thing — giving you the best home-cooked meal possible.
              </p>
            </div>
            <div className="ap-values-grid">
              {VALUES.map(v => (
                <div key={v.title} className="ap-value-card">
                  <div className="ap-value-icon">{v.icon}</div>
                  <div className="ap-value-title">{v.title}</div>
                  <p className="ap-value-desc">{v.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <div className="ap-divider" />

        {/* Story cards */}
        <div style={{ maxWidth: 1160, margin: '0 auto', padding: '72px 80px 0' }}>
          <div style={{ textAlign: 'center', marginBottom: 40 }}>
            <div className="ap-sec-kicker" style={{ justifyContent: 'center' }}>A Closer Look</div>
            <h2 className="ap-h2">Our Kitchen &amp; Our Food</h2>
          </div>
        </div>
        <div className="ap-story-cards">
          {TEAM.map(t => (
            <div key={t.name} className="ap-story-card">
              <div className="ap-story-card-img">
                <img src={t.img} alt={t.name} />
              </div>
              <div className="ap-story-card-body">
                <div className="ap-story-card-role">{t.role}</div>
                <div className="ap-story-card-name">{t.name}</div>
                <p className="ap-story-card-desc">{t.desc}</p>
              </div>
            </div>
          ))}
        </div>

        {/* How it works */}
        <section className="ap-hiw">
          <div className="ap-hiw-inner">
            <div style={{ textAlign: 'center' }}>
              <div className="ap-sec-kicker" style={{ justifyContent: 'center' }}>The Process</div>
              <h2 className="ap-h2">How It Works</h2>
              <p style={{ fontSize: 14, color: '#5C6E5C', maxWidth: 440, margin: '0 auto', lineHeight: 1.7 }}>
                From our kitchen to your door in three simple steps.
              </p>
            </div>
            <div className="ap-hiw-grid">
              {[
                { num: '01', icon: '📝', title: 'Pick a Plan', desc: 'Browse our subscription plans and message us on WhatsApp. We get you set up in minutes.' },
                { num: '02', icon: '🍳', title: 'We Cook Fresh', desc: 'Every morning, our kitchen prepares your meal from scratch. No reheating, no batch cooking.' },
                { num: '03', icon: '🛵', title: 'Delivered Hot', desc: 'Your tiffin arrives at your door Monday to Saturday, piping hot and ready to eat.' },
              ].map(h => (
                <div key={h.title} className="ap-hiw-card">
                  <div className="ap-hiw-num">{h.num}</div>
                  <div className="ap-hiw-icon">{h.icon}</div>
                  <div className="ap-hiw-title">{h.title}</div>
                  <p className="ap-hiw-desc">{h.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="ap-cta">
          <div className="ap-cta-inner">
            <div style={{ fontSize: 38, marginBottom: 16 }}>🍛</div>
            <h2 style={{ fontSize: 'clamp(26px, 4vw, 42px)', fontWeight: 800, color: '#1A2E1A', marginBottom: 12, letterSpacing: '-0.02em' }}>
              Ready to Get Started?
            </h2>
            <p style={{ fontSize: 14, color: '#5C6E5C', marginBottom: 28, lineHeight: 1.7 }}>
              Browse our subscription plans and let us take care of your meals — every single day.
            </p>
            <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
              <Link href="/subscription" className="ap-btn-green">View Subscription Plans →</Link>
              <Link href="/menu" className="ap-btn-ghost">🌿 See This Week&apos;s Menu</Link>
            </div>
          </div>
        </section>

      </div>
    </>
  );
}
