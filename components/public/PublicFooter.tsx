'use client';

import React from 'react';
import Link from 'next/link';

export default function PublicFooter() {
  return (
    <footer style={{
      background: 'linear-gradient(150deg, #0F2210 0%, #1A3A1C 50%, #2C5E2E 100%)',
      color: '#fff',
      padding: '56px 24px 24px',
      fontFamily: 'Quicksand, sans-serif',
    }}>
      <div style={{ maxWidth: 1160, margin: '0 auto' }}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
          gap: 40,
          marginBottom: 48,
        }}>
          {/* Brand */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 11, marginBottom: 16 }}>
              <div style={{
                width: 40, height: 40,
                borderRadius: 10,
                overflow: 'hidden',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
              }}>
                <img src="/logo.jpg" alt="Arusuvai Logo" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              </div>
              <div>
                <div style={{ fontSize: 18, fontWeight: 800, color: '#fff', lineHeight: 1, letterSpacing: '-0.02em' }}>Arusuvai</div>
                <div style={{ fontSize: 8, fontWeight: 700, color: '#F5A623', textTransform: 'uppercase', letterSpacing: '0.14em', marginTop: 2 }}>The Home Kitchen</div>
              </div>
            </div>
            <p style={{ fontSize: 13.5, color: 'rgba(255,255,255,0.6)', lineHeight: 1.6, margin: 0, maxWidth: 280 }}>
              Wholesome, home-cooked South Indian meals delivered to your doorstep daily. No preservatives, just love.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h3 style={{ fontSize: 11, fontWeight: 800, color: '#F5A623', textTransform: 'uppercase', letterSpacing: '0.12em', margin: '0 0 16px' }}>
              Explore
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              {[['/', 'Home'], ['/about', 'Our Story'], ['/menu', 'Our Menu'], ['/subscription', 'Subscriptions'], ['/contact', 'Contact']].map(([href, label]) => (
                <Link key={href} href={href} style={{
                  fontSize: 13.5, color: 'rgba(255,255,255,0.7)', textDecoration: 'none',
                  fontWeight: 600, transition: 'color 0.15s',
                }}
                onMouseEnter={e => e.currentTarget.style.color = '#fff'}
                onMouseLeave={e => e.currentTarget.style.color = 'rgba(255,255,255,0.7)'}
                >
                  {label}
                </Link>
              ))}
            </div>
          </div>

          {/* Contact */}
          <div>
            <h3 style={{ fontSize: 11, fontWeight: 800, color: '#F5A623', textTransform: 'uppercase', letterSpacing: '0.12em', margin: '0 0 16px' }}>
              Contact Us
            </h3>
            <p style={{ fontSize: 13.5, color: 'rgba(255,255,255,0.6)', lineHeight: 1.6, margin: '0 0 16px' }}>
              Have questions? We reply quickly on WhatsApp.
            </p>
            <a href="https://wa.me/918667670695" target="_blank" rel="noopener noreferrer" style={{
              display: 'inline-flex',
              padding: '10px 18px',
              background: 'rgba(255,255,255,0.1)',
              border: '1px solid rgba(255,255,255,0.2)',
              color: '#fff', textDecoration: 'none',
              borderRadius: 8, fontSize: 13, fontWeight: 700,
              alignItems: 'center', gap: 8,
              transition: 'background 0.15s',
            }}
            onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.15)'}
            onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}
            >
              <span style={{ color: '#25D366', fontSize: 16 }}>💬</span> Chat on WhatsApp
            </a>
          </div>
        </div>

        {/* Bottom */}
        <div style={{
          borderTop: '1px solid rgba(255,255,255,0.1)',
          paddingTop: 24,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}>
          <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', margin: 0, fontWeight: 500 }}>
            © {new Date().getFullYear()} Arusuvai - The Home Kitchen. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
