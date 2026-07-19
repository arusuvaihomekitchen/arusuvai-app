'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const NAV_LINKS = [
  { href: '/',             label: 'Home' },
  { href: '/about',        label: 'About' },
  { href: '/subscription', label: 'Subscription' },
  { href: '/contact',      label: 'Contact' },
];

export default function PublicNavbar() {
  const pathname = usePathname();
  const [scrolled, setScrolled]     = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const headerRef = useRef<HTMLElement>(null);

  // Scroll shadow
  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', fn, { passive: true });
    return () => window.removeEventListener('scroll', fn);
  }, []);

  // Close everything on route change
  useEffect(() => {
    const t = setTimeout(() => setMobileOpen(false), 0);
    return () => clearTimeout(t);
  }, [pathname]);

  // Close mobile menu on outside click
  useEffect(() => {
    const handler = (e: MouseEvent | TouchEvent) => {
      const target = e.target as Node;
      // Close mobile drawer if click is outside the entire header
      if (mobileOpen && headerRef.current && !headerRef.current.contains(target)) {
        setMobileOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    document.addEventListener('touchstart', handler);
    return () => {
      document.removeEventListener('mousedown', handler);
      document.removeEventListener('touchstart', handler);
    };
  }, [mobileOpen]);

  const isActive = (href: string) => pathname === href;
  const isMenu   = pathname.startsWith('/menu');

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Quicksand:wght@300..700&display=swap');

        .pnav-link {
          padding: 8px 14px;
          font-size: 13px;
          font-weight: 700;
          color: #3A4E3A;
          text-decoration: none;
          border-radius: 8px;
          white-space: nowrap;
          font-family: 'Quicksand', sans-serif;
          transition: color 0.15s, background 0.15s;
        }
        .pnav-link:hover          { color: #2C5E2E; background: #EBF5EB; }
        .pnav-link.nav-active     { color: #2C5E2E; background: #EBF5EB; font-weight: 800; }

        .pnav-menu-btn {
          padding: 8px 14px;
          font-size: 13px;
          font-weight: 700;
          color: #3A4E3A;
          background: transparent;
          border: none;
          border-radius: 8px;
          cursor: pointer;
          white-space: nowrap;
          font-family: 'Quicksand', sans-serif;
          display: flex;
          align-items: center;
          gap: 5px;
          transition: color 0.15s, background 0.15s;
        }
        .pnav-menu-btn:hover      { color: #2C5E2E; background: #EBF5EB; }
        .pnav-menu-btn.nav-active { color: #2C5E2E; background: #EBF5EB; font-weight: 800; }

        .pnav-desktop { display: flex; align-items: center; gap: 2px; }

        @media (max-width: 820px) {
          .pnav-desktop    { display: none !important; }
          .pnav-hamburger  { display: flex !important; }
        }
        .pnav-hamburger { display: none; }

        /* Dropdown */
        .pnav-dropdown {
          position: absolute;
          top: calc(100% + 8px);
          left: 50%;
          transform: translateX(-50%);
          background: #fff;
          border: 1px solid #E8E2D5;
          border-radius: 14px;
          box-shadow: 0 16px 48px rgba(0,0,0,0.1);
          min-width: 210px;
          padding: 6px;
          z-index: 300;
          animation: dropIn 0.15s ease;
        }
        @keyframes dropIn {
          from { opacity: 0; transform: translateX(-50%) translateY(-6px); }
          to   { opacity: 1; transform: translateX(-50%) translateY(0); }
        }
        .pnav-drop-item {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 12px 14px;
          font-size: 13px;
          font-weight: 700;
          color: #1C2B1C;
          text-decoration: none;
          border-radius: 9px;
          font-family: 'Quicksand', sans-serif;
          transition: background 0.12s;
        }
        .pnav-drop-item:hover         { background: #EBF5EB; color: #2C5E2E; }
        .pnav-drop-item.drop-active   { background: #EBF5EB; color: #2C5E2E; font-weight: 800; }
        .pnav-drop-divider { height: 1px; background: #F0EDE5; margin: 4px 0; }

        /* Mobile drawer */
        .pnav-drawer {
          background: #fff;
          border-top: 1px solid #E8E2D5;
          padding: 8px 20px 20px;
          animation: slideDown 0.18s ease;
        }
        @keyframes slideDown {
          from { opacity: 0; transform: translateY(-6px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .pnav-drawer-item {
          display: block;
          padding: 14px 8px;
          font-size: 14px;
          font-weight: 700;
          color: #1C2B1C;
          text-decoration: none;
          border-bottom: 1px solid #F0EDE5;
          font-family: 'Quicksand', sans-serif;
          transition: color 0.12s, padding-left 0.12s;
        }
        .pnav-drawer-item:hover        { color: #2C5E2E; padding-left: 14px; }
        .pnav-drawer-item.nav-active   { color: #2C5E2E; font-weight: 800; }
        .pnav-drawer-sub {
          display: block;
          padding: 12px 8px 12px 22px;
          font-size: 13px;
          font-weight: 600;
          color: #5C6E5C;
          text-decoration: none;
          border-bottom: 1px solid #F0EDE5;
          font-family: 'Quicksand', sans-serif;
          transition: color 0.12s;
        }
        .pnav-drawer-sub:hover       { color: #2C5E2E; }
        .pnav-drawer-sub.nav-active  { color: #2C5E2E; font-weight: 700; }
        .pnav-drawer-subscribe {
          display: block;
          margin-top: 16px;
          padding: 14px;
          background: #2C5E2E;
          color: #fff;
          border-radius: 10px;
          font-size: 14px;
          font-weight: 800;
          text-align: center;
          text-decoration: none;
          font-family: 'Quicksand', sans-serif;
          transition: background 0.15s;
        }
        .pnav-drawer-subscribe:hover { background: #1A3A1C; }
      `}</style>

      <header ref={headerRef} style={{
        position: 'sticky',
        top: 0,
        zIndex: 200,
        background: scrolled ? 'rgba(255,255,255,0.97)' : 'rgba(255,253,247,0.93)',
        backdropFilter: 'blur(18px)',
        WebkitBackdropFilter: 'blur(18px)',
        borderBottom: '1px solid #E8E2D5',
        boxShadow: scrolled ? '0 2px 18px rgba(0,0,0,0.07)' : 'none',
        transition: 'background 0.25s, box-shadow 0.25s',
        fontFamily: 'Quicksand, sans-serif',
      }}>
        <div style={{
          maxWidth: 1200,
          margin: '0 auto',
          padding: '0 28px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          height: 68,
        }}>

          {/* ── Logo ── */}
          <Link href="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 11, flexShrink: 0 }}>
            <div style={{ width: 42, height: 42, borderRadius: 10, overflow: 'hidden', border: '1px solid #E8E2D5', flexShrink: 0 }}>
              <img src="/logo.jpg" alt="Arusuvai" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            </div>
            <div>
              <div style={{ fontSize: 18, fontWeight: 800, color: '#1A2E1A', lineHeight: 1.1, letterSpacing: '-0.01em' }}>Arusuvai</div>
              <div style={{ fontSize: 8.5, fontWeight: 700, color: '#E8A020', textTransform: 'uppercase', letterSpacing: '0.15em' }}>The Home Kitchen</div>
            </div>
          </Link>

          {/* ── Desktop Nav ── */}
          <nav className="pnav-desktop">

            {/* Simple page links */}
            {NAV_LINKS.map(({ href, label }) => (
              <Link
                key={href}
                href={href}
                className={`pnav-link${isActive(href) ? ' nav-active' : ''}`}
              >
                {label}
              </Link>
            ))}

            {/* Weekly Menu Link */}
            <Link
              href="/menu"
              className={`pnav-link${isActive('/menu') ? ' nav-active' : ''}`}
            >
              Our Menu
            </Link>

            {/* Login Link */}
            <Link
              href="/login"
              className={`pnav-link${isActive('/login') ? ' nav-active' : ''}`}
              style={{ marginLeft: 10 }}
            >
              Login
            </Link>

            {/* Subscribe CTA */}
            <Link
              href="/subscription"
              style={{
                marginLeft: 10,
                padding: '10px 22px',
                background: '#2C5E2E',
                color: '#fff',
                textDecoration: 'none',
                borderRadius: 10,
                fontSize: 13,
                fontWeight: 800,
                fontFamily: 'Quicksand, sans-serif',
                whiteSpace: 'nowrap',
                transition: 'background 0.15s, transform 0.15s',
              }}
              onMouseEnter={e => { e.currentTarget.style.background = '#1A3A1C'; e.currentTarget.style.transform = 'translateY(-1px)'; }}
              onMouseLeave={e => { e.currentTarget.style.background = '#2C5E2E'; e.currentTarget.style.transform = 'translateY(0)'; }}
            >
              Subscribe
            </Link>
          </nav>

          {/* ── Hamburger ── */}
          <button
            className="pnav-hamburger"
            onClick={() => setMobileOpen(p => !p)}
            aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
            style={{
              background: mobileOpen ? '#EBF5EB' : 'transparent',
              border: '1.5px solid #E8E2D5',
              borderRadius: 9,
              padding: '8px 12px',
              cursor: 'pointer',
              fontSize: 16,
              color: '#2C5E2E',
              transition: 'background 0.15s',
            }}
          >
            {mobileOpen ? '✕' : '☰'}
          </button>
        </div>

        {/* ── Mobile Drawer ── */}
        {mobileOpen && (
          <div className="pnav-drawer">
            {NAV_LINKS.map(({ href, label }) => (
              <Link
                key={href}
                href={href}
                className={`pnav-drawer-item${isActive(href) ? ' nav-active' : ''}`}
                onClick={() => setMobileOpen(false)}
              >
                {label}
              </Link>
            ))}

            {/* Menu sub-links in mobile */}
            <Link
              href="/menu"
              className={`pnav-drawer-item${isActive('/menu') ? ' nav-active' : ''}`}
              onClick={() => setMobileOpen(false)}
            >
              Our Menu
            </Link>

            <Link
              href="/login"
              className={`pnav-drawer-item${isActive('/login') ? ' nav-active' : ''}`}
              onClick={() => setMobileOpen(false)}
            >
              Login
            </Link>

            <Link href="/subscription" className="pnav-drawer-subscribe" onClick={() => setMobileOpen(false)}>
              Subscribe Now
            </Link>
          </div>
        )}
      </header>
    </>
  );
}
