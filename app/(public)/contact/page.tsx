import React from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Contact Us | Arusuvai Home Kitchen',
  description: 'Get in touch with Arusuvai Home Kitchen. Message us on WhatsApp to subscribe, ask questions, or give feedback.',
};

const INFO_ITEMS = [
  {
    icon: '💬',
    title: 'WhatsApp (Fastest)',
    desc: 'Message us to subscribe, make changes, or ask anything. We reply quickly.',
    link: { label: 'Chat on WhatsApp', href: 'https://wa.me/918667670695' },
    color: '#25D366',
    bg: '#E8F8EE',
    border: '#B4DFC4',
  },
  {
    icon: '📅',
    title: 'Delivery Days',
    desc: 'We deliver fresh meals every Monday to Saturday. No deliveries on Sundays.',
    link: null,
    color: '#2C5E2E',
    bg: '#EBF5EB',
    border: '#C8D8C8',
  },
  {
    icon: '⏰',
    title: 'Delivery Timing',
    desc: 'Lunch deliveries are made every morning. Timings may vary by your area.',
    link: null,
    color: '#B45309',
    bg: '#FEF3DC',
    border: '#F0D090',
  },
  {
    icon: '📍',
    title: 'Service Area',
    desc: 'We currently serve selected areas. Message us to confirm if we deliver to your location.',
    link: null,
    color: '#6D28D9',
    bg: '#F0EBFF',
    border: '#C4B5FD',
  },
];

const FAQS = [
  {
    q: 'How do I subscribe?',
    a: 'Just message us on WhatsApp with your preferred plan. We\'ll confirm your address, start date, and payment details.',
  },
  {
    q: 'Can I skip a day?',
    a: 'Yes! Let us know at least one day before and we\'ll skip your delivery for that day without any charge.',
  },
  {
    q: 'What if I want to change my plan?',
    a: 'No problem — message us on WhatsApp and we\'ll adjust your subscription from the next billing cycle.',
  },
  {
    q: 'Do you offer both veg and non-veg?',
    a: 'Yes, we offer separate Vegetarian and Non-Vegetarian meal plans. You can subscribe to either or both.',
  },
  {
    q: 'How is payment handled?',
    a: 'Payment is collected monthly in advance via UPI or bank transfer. Details are shared when you subscribe.',
  },
  {
    q: 'What are the tiffin containers made of?',
    a: 'We use food-grade stainless steel tiffin carriers. They are collected, cleaned, and reused — eco-friendly.',
  },
];

export default function ContactPage() {
  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Quicksand:wght@300..700&display=swap');
        .cp { font-family: 'Quicksand', sans-serif; background: #FFFDF7; color: #1C2B1C; }
        .cp * { box-sizing: border-box; }

        /* Hero */
        .cp-hero {
          padding: 72px 80px 64px;
          text-align: center;
          max-width: 800px;
          margin: 0 auto;
        }
        .cp-kicker {
          display: inline-flex; align-items: center; gap: 8px;
          font-size: 10px; font-weight: 800; letter-spacing: 0.18em;
          text-transform: uppercase; color: #E8A020; margin-bottom: 20px;
        }
        .cp-kicker::before, .cp-kicker::after {
          content: ''; display: block; width: 28px; height: 2px;
          background: #E8A020; border-radius: 2px;
        }
        .cp-h1 {
          font-size: clamp(36px, 5vw, 60px);
          font-weight: 800; color: #1A2E1A;
          line-height: 1.1; letter-spacing: -0.025em; margin-bottom: 18px;
        }
        .cp-lead {
          font-size: 15.5px; color: #5C6E5C; line-height: 1.75; font-weight: 500;
        }
        .cp-divider { height: 1px; background: #E8E2D5; }

        /* Info grid */
        .cp-info { padding: 72px 80px; }
        .cp-info-inner { max-width: 1160px; margin: 0 auto; }
        .cp-info-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 20px;
          margin-top: 48px;
        }
        .cp-info-card {
          display: flex; gap: 18px; align-items: flex-start;
          padding: 28px 24px;
          background: #fff;
          border: 1px solid #E8E2D5;
          border-radius: 16px;
          transition: box-shadow 0.2s, transform 0.2s;
        }
        .cp-info-card:hover {
          box-shadow: 0 6px 24px rgba(0,0,0,0.07);
          transform: translateY(-2px);
        }
        .cp-info-icon {
          width: 52px; height: 52px; border-radius: 12px;
          display: flex; align-items: center; justify-content: center;
          font-size: 24px; flex-shrink: 0;
        }
        .cp-info-title {
          font-size: 15px; font-weight: 800; color: #1A2E1A; margin-bottom: 6px;
        }
        .cp-info-desc {
          font-size: 13px; color: #5C6E5C; line-height: 1.65; margin-bottom: 10px;
        }
        .cp-info-link {
          display: inline-flex; align-items: center; gap: 6px;
          font-size: 12.5px; font-weight: 800;
          text-decoration: none;
          padding: 7px 14px;
          border-radius: 8px;
          transition: opacity 0.15s;
        }
        .cp-info-link:hover { opacity: 0.82; }

        /* WhatsApp CTA */
        .cp-wa {
          margin: 0 80px 72px;
          border-radius: 20px;
          overflow: hidden;
          background: #EBF5EB;
          border: 1px solid #C8D8C8;
          display: grid;
          grid-template-columns: 1fr 1fr;
          align-items: stretch;
        }
        .cp-wa-left {
          padding: 52px 56px;
        }
        .cp-wa-right {
          background: #2C5E2E;
          display: flex; flex-direction: column;
          justify-content: center; align-items: center;
          padding: 52px 40px;
          text-align: center;
          gap: 12px;
        }
        .cp-wa-btn {
          display: inline-flex; align-items: center; gap: 10px;
          padding: 14px 32px;
          background: #fff; color: #2C5E2E;
          border-radius: 12px; font-size: 15px; font-weight: 800;
          text-decoration: none; font-family: 'Quicksand', sans-serif;
          transition: background 0.15s, transform 0.15s;
          width: 100%; justify-content: center;
        }
        .cp-wa-btn:hover { background: #EBF5EB; transform: translateY(-1px); }
        .cp-wa-wrapper { padding: 72px 80px 0; }

        /* FAQ */
        .cp-faq { background: #F7F4EE; border-top: 1px solid #E8E2D5; padding: 72px 80px; }
        .cp-faq-inner { max-width: 860px; margin: 0 auto; }
        .cp-faq-grid { margin-top: 48px; display: flex; flex-direction: column; gap: 2px; }
        .cp-faq-item {
          background: #fff; border: 1px solid #E8E2D5;
          padding: 22px 26px;
          border-radius: 0;
          transition: background 0.15s;
        }
        .cp-faq-item:first-child { border-radius: 14px 14px 0 0; }
        .cp-faq-item:last-child  { border-radius: 0 0 14px 14px; }
        .cp-faq-item:hover { background: #FAFAF6; }
        .cp-faq-q { font-size: 14.5px; font-weight: 800; color: #1A2E1A; margin-bottom: 8px; }
        .cp-faq-a { font-size: 13px; color: #5C6E5C; line-height: 1.7; }

        /* Sec heading shared */
        .cp-sec-kicker {
          font-size: 10px; font-weight: 800; letter-spacing: 0.16em;
          text-transform: uppercase; color: #E8A020;
          display: flex; align-items: center; gap: 7px; margin-bottom: 12px;
        }
        .cp-sec-kicker::before {
          content: ''; width: 18px; height: 2px; background: #E8A020; border-radius: 2px;
        }
        .cp-h2 {
          font-size: clamp(24px, 3.5vw, 40px);
          font-weight: 800; color: #1A2E1A;
          letter-spacing: -0.02em; margin-bottom: 10px;
        }

        @media (max-width: 860px) {
          .cp-hero { padding: 52px 24px 48px; }
          .cp-info { padding: 52px 24px; }
          .cp-info-grid { grid-template-columns: 1fr; }
          .cp-wa-wrapper { padding: 52px 0 0; }
          .cp-wa { margin: 0 24px 52px; grid-template-columns: 1fr; }
          .cp-wa-left { padding: 40px 24px; }
          .cp-wa-right { padding: 36px 24px; }
          .cp-faq { padding: 52px 24px; }
        }
      `}</style>

      <div className="cp">

        {/* Hero */}
        <section className="cp-hero">
          <div className="cp-kicker">Get in Touch</div>
          <h1 className="cp-h1">We&apos;re Here<br />for You</h1>
          <p className="cp-lead">
            Have a question, want to subscribe, or just want to say hi? The fastest way to reach us is WhatsApp. We respond quickly and personally — no bots.
          </p>
        </section>

        <div className="cp-divider" />

        {/* Info cards */}
        <section className="cp-info">
          <div className="cp-info-inner">
            <div className="cp-sec-kicker">Contact Info</div>
            <h2 className="cp-h2">Everything You Need to Know</h2>
            <div className="cp-info-grid">
              {INFO_ITEMS.map(item => (
                <div key={item.title} className="cp-info-card">
                  <div className="cp-info-icon" style={{ background: item.bg, border: `1px solid ${item.border}` }}>
                    {item.icon}
                  </div>
                  <div>
                    <div className="cp-info-title">{item.title}</div>
                    <p className="cp-info-desc">{item.desc}</p>
                    {item.link && (
                      <a
                        href={item.link.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="cp-info-link"
                        style={{ background: item.bg, color: item.color, border: `1px solid ${item.border}` }}
                      >
                        {item.link.label} →
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <div className="cp-divider" />

        {/* WhatsApp banner */}
        <div className="cp-wa-wrapper">
          <div className="cp-wa">
            <div className="cp-wa-left">
              <div className="cp-sec-kicker">Quickest Way</div>
              <h2 className="cp-h2">Message Us on WhatsApp</h2>
              <p style={{ fontSize: 14, color: '#5C6E5C', lineHeight: 1.7, maxWidth: 380 }}>
                Whether you&apos;re ready to subscribe or just have a question about our meals — WhatsApp is the fastest way. We typically reply within minutes.
              </p>
              <div style={{ marginTop: 20, display: 'flex', flexDirection: 'column', gap: 8 }}>
                {['✓ Get plan details', '✓ Confirm your address', '✓ Make day skips or changes', '✓ Share feedback'].map(t => (
                  <div key={t} style={{ fontSize: 13, color: '#2C5E2E', fontWeight: 700 }}>{t}</div>
                ))}
              </div>
            </div>
            <div className="cp-wa-right">
              <div style={{ fontSize: 52 }}>💬</div>
              <div style={{ fontSize: 20, fontWeight: 800, color: '#fff', lineHeight: 1.2 }}>
                Ready to Order?
              </div>
              <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.7)', margin: 0, lineHeight: 1.6 }}>
                Tap below to open WhatsApp and start your subscription today.
              </p>
              <a
                href="https://wa.me/918667670695"
                target="_blank"
                rel="noopener noreferrer"
                className="cp-wa-btn"
              >
                💬 Open WhatsApp
              </a>
              <div style={{ display: 'flex', gap: 16, marginTop: 4 }}>
                <Link href="/subscription" style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)', textDecoration: 'underline', fontWeight: 600 }}>
                  View plans first
                </Link>
                <Link href="/menu" style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)', textDecoration: 'underline', fontWeight: 600 }}>
                  See menu
                </Link>
              </div>
            </div>
          </div>
        </div>

        <div style={{ height: 72 }} />
        <div className="cp-divider" />

        {/* FAQ */}
        <section className="cp-faq">
          <div className="cp-faq-inner">
            <div style={{ textAlign: 'center', marginBottom: 4 }}>
              <div className="cp-sec-kicker" style={{ justifyContent: 'center' }}>FAQ</div>
              <h2 className="cp-h2" style={{ textAlign: 'center' }}>Common Questions</h2>
              <p style={{ fontSize: 14, color: '#5C6E5C', maxWidth: 420, margin: '0 auto', lineHeight: 1.7 }}>
                Can&apos;t find your answer here? Just message us on WhatsApp.
              </p>
            </div>
            <div className="cp-faq-grid">
              {FAQS.map(faq => (
                <div key={faq.q} className="cp-faq-item">
                  <div className="cp-faq-q">🌿 {faq.q}</div>
                  <p className="cp-faq-a">{faq.a}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

      </div>
    </>
  );
}
