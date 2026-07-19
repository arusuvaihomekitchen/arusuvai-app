import React from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import PublicNavbar from '@/components/public/PublicNavbar';
import PublicFooter from '@/components/public/PublicFooter';

export const metadata: Metadata = {
  title: 'Arusuvai — The Home Kitchen | Homemade Meal Delivery',
  description: 'Arusuvai - The Home Kitchen delivers freshly prepared home-cooked South Indian meals to your doorstep every day, Monday to Saturday.',
};

export const revalidate = 60;

export default function LandingPage() {

  return (
    <>
      <PublicNavbar />

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Quicksand:wght@300..700&display=swap');

        .lp { font-family: 'Quicksand', sans-serif; background: #FFFDF7; color: #1C2B1C; }
        .lp * { box-sizing: border-box; }

        /* ── HERO ── */
        .hero {
          display: grid;
          grid-template-columns: 1fr 1fr;
          min-height: 88vh;
          align-items: stretch;
        }
        .hero-left {
          display: flex;
          flex-direction: column;
          justify-content: center;
          padding: 80px 64px 80px 80px;
          background: #FFFDF7;
        }
        .hero-right {
          position: relative;
          overflow: hidden;
        }
        .hero-right img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          object-position: center;
          display: block;
        }
        .hero-right-overlay {
          position: absolute;
          inset: 0;
          background: linear-gradient(to right, rgba(255,253,247,0.25) 0%, transparent 40%);
        }
        .hero-kicker {
          display: inline-flex;
          align-items: center;
          gap: 7px;
          font-size: 10px;
          font-weight: 800;
          letter-spacing: 0.18em;
          text-transform: uppercase;
          color: #2C5E2E;
          margin-bottom: 24px;
        }
        .hero-kicker::before {
          content: '';
          width: 24px; height: 2px;
          background: #E8A020;
          border-radius: 2px;
        }
        .hero-h1 {
          font-size: clamp(42px, 5.5vw, 76px);
          font-weight: 800;
          color: #1A2E1A;
          line-height: 1.06;
          letter-spacing: -0.025em;
          margin-bottom: 20px;
        }
        .hero-h1 span {
          color: #2C5E2E;
        }
        .hero-p {
          font-size: 15.5px;
          color: #5C6E5C;
          line-height: 1.7;
          max-width: 400px;
          margin-bottom: 36px;
          font-weight: 500;
        }
        .hero-actions { display: flex; gap: 12px; flex-wrap: wrap; align-items: center; }
        .btn-solid-green {
          padding: 13px 28px;
          background: #2C5E2E;
          color: #fff;
          border-radius: 10px;
          font-size: 13.5px;
          font-weight: 800;
          text-decoration: none;
          display: inline-flex;
          align-items: center;
          gap: 8px;
          transition: background 0.2s, transform 0.15s;
        }
        .btn-solid-green:hover { background: #1A3A1C; transform: translateY(-1px); }
        .btn-link-green {
          padding: 12px 22px;
          background: transparent;
          color: #2C5E2E;
          border: 1.5px solid #C8D8C8;
          border-radius: 10px;
          font-size: 13.5px;
          font-weight: 700;
          text-decoration: none;
          display: inline-flex;
          align-items: center;
          gap: 8px;
          transition: border-color 0.2s, background 0.2s;
        }
        .btn-link-green:hover { border-color: #2C5E2E; background: #F0F7F0; }

        .hero-trust {
          display: flex;
          gap: 28px;
          margin-top: 44px;
          flex-wrap: wrap;
        }
        .trust-item {
          display: flex;
          flex-direction: column;
        }
        .trust-n {
          font-size: 24px;
          font-weight: 900;
          color: #1A2E1A;
          line-height: 1;
        }
        .trust-l {
          font-size: 10px;
          font-weight: 700;
          color: #8FA48F;
          text-transform: uppercase;
          letter-spacing: 0.1em;
          margin-top: 3px;
        }
        .trust-sep {
          width: 1px;
          background: #E8E2D5;
          align-self: stretch;
          margin: 4px 0;
        }

        /* ── SECTION SHARED ── */
        .sec { padding: 90px 80px; }
        .sec-inner { max-width: 1160px; margin: 0 auto; }
        .sec-alt { background: #F7F4EE; }
        .sec-kicker {
          font-size: 10px;
          font-weight: 800;
          letter-spacing: 0.18em;
          text-transform: uppercase;
          color: #E8A020;
          margin-bottom: 14px;
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .sec-kicker::before {
          content: '';
          width: 18px; height: 2px;
          background: #E8A020;
          border-radius: 2px;
        }
        .sec-h2 {
          font-size: clamp(28px, 3.5vw, 46px);
          font-weight: 800;
          color: #1A2E1A;
          line-height: 1.15;
          letter-spacing: -0.02em;
          margin-bottom: 12px;
        }
        .sec-p {
          font-size: 14.5px;
          color: #5C6E5C;
          line-height: 1.7;
          max-width: 500px;
        }
        .divider { height: 1px; background: #E8E2D5; margin: 0; }

        /* ── ABOUT ── */
        .about-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 80px;
          align-items: center;
        }
        .about-img {
          border-radius: 20px;
          overflow: hidden;
          aspect-ratio: 4/3;
          box-shadow: 0 20px 60px rgba(0,0,0,0.1);
        }
        .about-img img { width: 100%; height: 100%; object-fit: cover; }
        .about-pills {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
          margin-top: 28px;
        }
        .pill {
          font-size: 11px;
          font-weight: 700;
          padding: 7px 14px;
          border-radius: 100px;
          background: #EBF5EB;
          color: #2C5E2E;
          border: 1px solid #C8D8C8;
        }
        .about-list {
          margin-top: 28px;
          display: flex;
          flex-direction: column;
          gap: 16px;
        }
        .about-item {
          display: flex;
          gap: 14px;
          align-items: flex-start;
        }
        .about-icon {
          width: 40px; height: 40px;
          border-radius: 10px;
          background: #EBF5EB;
          border: 1px solid #C8D8C8;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 18px;
          flex-shrink: 0;
        }
        .about-title { font-size: 14px; font-weight: 800; color: #1A2E1A; margin-bottom: 2px; }
        .about-desc { font-size: 12.5px; color: #5C6E5C; line-height: 1.6; }

        /* ── MENU PREVIEW ── */
        .menu-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(290px, 1fr));
          gap: 20px;
          margin-top: 44px;
        }
        .menu-nav {
          display: flex;
          gap: 10px;
          flex-wrap: wrap;
        }
        .menu-btn-veg {
          padding: 9px 20px;
          background: #EBF5EB;
          border: 1px solid #C8D8C8;
          color: #2C5E2E;
          border-radius: 8px;
          font-size: 12.5px;
          font-weight: 700;
          text-decoration: none;
        }
        .menu-btn-veg:hover { background: #d6ebd6; }
        .menu-btn-nveg {
          padding: 9px 20px;
          background: #FEF3DC;
          border: 1px solid #F0D090;
          color: #B45309;
          border-radius: 8px;
          font-size: 12.5px;
          font-weight: 700;
          text-decoration: none;
        }
        .menu-btn-nveg:hover { background: #fde9b5; }

        /* ── PLANS ── */
        .plans-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
          gap: 24px;
          margin-top: 52px;
          align-items: center;
        }

        /* ── HOW IT WORKS ── */
        .hiw-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 2px;
          margin-top: 52px;
          background: #E8E2D5;
          border-radius: 16px;
          overflow: hidden;
        }
        .hiw-card {
          background: #FFFDF7;
          padding: 40px 36px;
          display: flex;
          flex-direction: column;
          gap: 12px;
        }
        .hiw-num {
          font-size: 48px;
          font-weight: 900;
          color: #E8E2D5;
          line-height: 1;
        }
        .hiw-icon { font-size: 28px; }
        .hiw-title { font-size: 17px; font-weight: 800; color: #1A2E1A; }
        .hiw-desc { font-size: 13px; color: #5C6E5C; line-height: 1.65; }

        /* ── CTA ── */
        .cta-section {
          position: relative;
          overflow: hidden;
          padding: 90px 80px;
          text-align: center;
        }
        .cta-bg {
          position: absolute; inset: 0;
          background-image: url('/images/Subscription Packages Page Jute Bag Banner.png');
          background-size: cover;
          background-position: center;
          filter: brightness(0.12) saturate(0.5);
        }
        .cta-overlay {
          position: absolute; inset: 0;
          background: rgba(255,253,247,0.92);
        }
        .cta-inner {
          position: relative;
          z-index: 2;
          max-width: 620px;
          margin: 0 auto;
        }
        .cta-h2 {
          font-size: clamp(30px, 4vw, 52px);
          font-weight: 800;
          color: #1A2E1A;
          line-height: 1.1;
          margin-bottom: 14px;
          letter-spacing: -0.02em;
        }
        .cta-p {
          font-size: 15px;
          color: #5C6E5C;
          line-height: 1.7;
          margin-bottom: 36px;
        }
        .cta-pills {
          display: flex;
          gap: 8px;
          justify-content: center;
          flex-wrap: wrap;
          margin-top: 36px;
        }
        .cta-pill {
          font-size: 11px;
          font-weight: 700;
          padding: 7px 14px;
          border-radius: 100px;
          background: #EBF5EB;
          color: #2C5E2E;
          border: 1px solid #C8D8C8;
          display: flex;
          align-items: center;
          gap: 5px;
        }

        @media (max-width: 900px) {
          .hero { grid-template-columns: 1fr; min-height: auto; }
          .hero-left { padding: 48px 24px 32px; order: 1; }
          .hero-right { min-height: 240px; max-height: 320px; order: 2; aspect-ratio: 16/9; }
          .hero-h1 { font-size: clamp(36px, 9vw, 56px); }
          .hero-trust { gap: 20px; }
          .about-grid { grid-template-columns: 1fr; gap: 36px; }
          .hiw-grid { grid-template-columns: 1fr; }
          .hiw-card { padding: 28px 24px; }
          .sec { padding: 56px 24px; }
          .sec-alt { padding: 56px 24px; }
          .cta-section { padding: 64px 24px; }
          .menu-grid { grid-template-columns: 1fr; }
          .plans-grid { grid-template-columns: 1fr; }
        }
        /* ── EXPLORE CARDS ── */
        .explore-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
          gap: 18px;
        }
        .explore-card {
          display: flex; flex-direction: column; gap: 14px;
          padding: 24px;
          background: #fff;
          border: 1px solid #E8E2D5;
          border-radius: 16px;
          text-decoration: none;
          transition: box-shadow 0.2s, transform 0.2s, border-color 0.2s;
        }
        .explore-card:hover {
          box-shadow: 0 8px 28px rgba(0,0,0,0.09);
          transform: translateY(-2px);
          border-color: #C8D8C8;
        }
        .explore-card-icon {
          width: 48px; height: 48px; border-radius: 12px;
          display: flex; align-items: center; justify-content: center;
          font-size: 22px; flex-shrink: 0;
        }
        .explore-card-title { font-size: 15px; font-weight: 800; color: #1A2E1A; margin-bottom: 6px; }
        .explore-card-desc  { font-size: 12.5px; color: #5C6E5C; line-height: 1.65; margin: 0; }
        .explore-card-link  { font-size: 12px; font-weight: 700; margin-top: auto; }

        @media (max-width: 480px) {
          .hero-left { padding: 36px 18px 32px; }
          .hero-right { min-height: 180px; max-height: 240px; }
          .hero-actions { flex-direction: column; }
          .btn-solid-green, .btn-link-green { width: 100%; justify-content: center; }
          .trust-sep { display: none; }
          .hero-trust { flex-wrap: wrap; gap: 16px; }
          .about-pills { display: none; }
          .cta-pills { display: none; }
          .explore-grid { grid-template-columns: 1fr; }
        }
      `}</style>

      <div className="lp">

        {/* ── HERO ── */}
        <section className="hero">
          <div className="hero-left">
            <div className="hero-kicker">Arusuvai - The Home Kitchen</div>
            <h1 className="hero-h1">
              Food That<br />Feels Like<br /><span>Home</span>
            </h1>
            <p className="hero-p">
              Freshly prepared South Indian home-cooked meals delivered to your doorstep Monday to Saturday. No preservatives. Just love.
            </p>
            <div className="hero-actions">
              <Link href="/menu" className="btn-solid-green">🍽️ View This Week&apos;s Menu</Link>
              <Link href="/subscription" className="btn-link-green">Subscription Plans</Link>
            </div>
            <div className="hero-trust">
              {[['70+', 'Subscribers'], ['Mon – Sat', 'Deliveries'], ['0', 'Preservatives']].map(([n, l], i, arr) => (
                <React.Fragment key={l}>
                  <div className="trust-item">
                    <span className="trust-n">{n}</span>
                    <span className="trust-l">{l}</span>
                  </div>
                  {i < arr.length - 1 && <div className="trust-sep" />}
                </React.Fragment>
              ))}
            </div>
          </div>
          <div className="hero-right">
            <img src="/images/Landing Page.png" alt="Arusuvai — Fresh home-cooked meal in steel tiffin" />
            <div className="hero-right-overlay" />
          </div>
        </section>

        {/* ── WHAT WE OFFER — quick links to other pages ── */}
        <section className="sec">
          <div className="sec-inner">
            <div style={{ textAlign: 'center', marginBottom: 48 }}>
              <div className="sec-kicker" style={{ justifyContent: 'center' }}>Explore</div>
              <h2 className="sec-h2" style={{ textAlign: 'center' }}>Everything You Need</h2>
              <p className="sec-p" style={{ margin: '0 auto', textAlign: 'center' }}>Fresh home-cooked meals, delivered to your door every day.</p>
            </div>
            <div className="explore-grid">
              {[
                { href: '/about',        icon: '🏠', title: 'Our Story',         desc: 'Learn about our kitchen, our values, and why we started Arusuvai.',  color: '#2C5E2E', bg: '#EBF5EB', border: '#C8D8C8' },
                { href: '/menu',     icon: '🌿', title: 'Vegetarian Menu',   desc: "Browse this week's fresh vegetarian meals. Updated every week.",       color: '#2C5E2E', bg: '#EBF5EB', border: '#C8D8C8' },
                { href: '/menu', icon: '🍗', title: 'Non-Veg Menu',      desc: 'Rich, hearty non-veg meals prepared fresh every morning.',             color: '#B45309', bg: '#FEF3DC', border: '#F0D090' },
                { href: '/subscription', icon: '💰', title: 'Subscription Plans', desc: 'Pick an affordable plan and get meals delivered every day.',            color: '#6D28D9', bg: '#F0EBFF', border: '#C4B5FD' },
                { href: '/contact',      icon: '💬', title: 'Contact Us',        desc: 'Have questions? Message us on WhatsApp — we reply fast.',             color: '#0891B2', bg: '#E0F2FE', border: '#BAE6FD' },
              ].map(item => (
                <Link key={item.title} href={item.href} className="explore-card">
                  <div className="explore-card-icon" style={{ background: item.bg, border: `1px solid ${item.border}` }}>
                    {item.icon}
                  </div>
                  <div>
                    <div className="explore-card-title">{item.title}</div>
                    <p className="explore-card-desc">{item.desc}</p>
                  </div>
                  <div className="explore-card-link" style={{ color: item.color }}>Explore →</div>
                </Link>
              ))}
            </div>
          </div>
        </section>

        <div className="divider" />

        {/* ── CTA ── */}
        <section className="cta-section">
          <div className="cta-bg" />
          <div className="cta-overlay" />
          <div className="cta-inner">
            <div className="sec-kicker" style={{ justifyContent: 'center', marginBottom: 16 }}>Get Started</div>
            <h2 className="cta-h2">Ready to Eat Better?</h2>
            <p className="cta-p">
              Subscribe today and get fresh home-cooked meals delivered to you Monday to Saturday. Message us on WhatsApp — we respond fast.
            </p>
            <div className="hero-actions" style={{ justifyContent: 'center' }}>
              <Link href="/subscription" className="btn-solid-green">View Plans</Link>
              <Link href="/contact" className="btn-link-green">Contact Us</Link>
            </div>
            <div className="cta-pills">
              {['📅 Monday – Saturday', '🚫 No Preservatives', '♻️ Steel Containers', '🏠 Homemade Daily'].map(t => (
                <span key={t} className="cta-pill">{t}</span>
              ))}
            </div>
          </div>
        </section>

      </div>

      <PublicFooter />
    </>
  );
}
