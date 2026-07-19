'use client';

import React, { useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useTranslation } from '@/i18n';

const adminTabs = [
  { href: '/admin',                       label: 'nav.today',    icon: '📦' },
  { href: '/admin/clients',               label: 'nav.clients',  icon: '👥' },
  { href: '/admin/delivery-persons',      label: 'nav.delivery', icon: '🛵' },
  { href: '/admin/packages',              label: 'nav.packages', icon: '🏷️' },
  { href: '/admin/weekly-menu',           label: 'nav.menu',     icon: '🍛' },
];


export default function AdminLayoutInner({ name, children }: { name: string; children: React.ReactNode }) {
  const { t } = useTranslation();
  const router = useRouter();
  const pathname = usePathname();
  const [signingOut, setSigningOut] = useState(false);

  // Change password states
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [pwError, setPwError] = useState('');
  const [pwSuccess, setPwSuccess] = useState('');
  const [updatingPw, setUpdatingPw] = useState(false);

  async function handleSignOut() {
    setSigningOut(true);
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/login');
    router.refresh();
  }

  async function handleChangePassword() {
    setPwError('');
    setPwSuccess('');
    
    if (!newPassword || newPassword.trim().length < 4) {
      setPwError('Password must be at least 4 characters long');
      return;
    }
    if (newPassword !== confirmPassword) {
      setPwError('Passwords do not match');
      return;
    }

    setUpdatingPw(true);
    try {
      const res = await fetch('/api/admin/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: newPassword }),
      });
      const data = await res.json();
      if (data.success) {
        setPwSuccess('Password changed successfully!');
        setNewPassword('');
        setConfirmPassword('');
        setTimeout(() => setShowPasswordModal(false), 1500);
      } else {
        setPwError(data.error || 'Failed to update password');
      }
    } catch {
      setPwError('Failed to change password. Please check connection.');
    } finally {
      setUpdatingPw(false);
    }
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--color-bg)', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <header style={{
        background: 'white',
        borderBottom: '1px solid var(--color-border)',
        padding: '12px 20px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12,
        position: 'sticky', top: 0, zIndex: 20,
        boxShadow: '0 1px 8px rgba(0,0,0,0.06)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <img
            src="/logo.jpg"
            alt="Arusuvai Logo"
            style={{
              width: 38,
              height: 38,
              borderRadius: 10,
              objectFit: 'cover',
            }}
          />
          <div>
            <div style={{ fontSize: 10, color: 'var(--color-text-light)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Admin</div>
            <div style={{ fontSize: 17, fontWeight: 900, color: 'var(--color-primary)', fontFamily: 'Georgia, serif' }}>Arusuvai</div>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          <span style={{ fontSize: 12, color: 'var(--color-text-muted)', fontWeight: 600 }}>{name}</span>
          <button
            onClick={() => {
              setPwError('');
              setPwSuccess('');
              setNewPassword('');
              setConfirmPassword('');
              setShowPasswordModal(true);
            }}
            style={{
              background: 'none', border: '1px solid var(--color-border)',
              borderRadius: 8, padding: '6px 12px',
              fontSize: 12, fontWeight: 700, color: 'var(--color-text-muted)',
              cursor: 'pointer',
            }}
          >
            🔑 Change Password
          </button>
          <button
            onClick={handleSignOut}
            disabled={signingOut}
            style={{
              background: 'none', border: '1px solid var(--color-border)',
              borderRadius: 8, padding: '6px 12px',
              fontSize: 12, fontWeight: 700, color: 'var(--color-text-muted)',
              cursor: 'pointer',
            }}
          >
            {t('auth.signOut')}
          </button>
        </div>
      </header>

      {/* Nav tabs — horizontal scroll */}
      <nav style={{
        background: 'white',
        borderBottom: '1px solid var(--color-border)',
        display: 'flex', padding: '6px 8px', gap: 4,
        overflowX: 'auto',
        position: 'sticky', top: 62, zIndex: 10,
      }}>
        {adminTabs.map((tab) => {
          const active = pathname === tab.href;
          return (
            <button
              key={tab.href}
              onClick={() => router.push(tab.href)}
              style={{
                padding: '9px 14px',
                background: active ? 'var(--color-primary)' : 'transparent',
                color: active ? 'white' : 'var(--color-text-muted)',
                border: 'none', borderRadius: 10,
                fontSize: 12, fontWeight: active ? 700 : 600,
                cursor: 'pointer', whiteSpace: 'nowrap',
                transition: 'all 0.15s ease',
              }}
            >
              {tab.icon} {t(tab.label)}
            </button>
          );
        })}
      </nav>

      {/* Content */}
      <main style={{ flex: 1, maxWidth: 960, width: '100%', margin: '0 auto', padding: '20px 16px' }}>
        {children}
      </main>

      {showPasswordModal && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 9999
        }}>
          <div style={{
            background: 'white', borderRadius: 20, padding: 24,
            width: '90%', maxWidth: 400, boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
            border: '1.5px solid var(--color-border)', position: 'relative'
          }}>
            <h3 style={{ fontSize: 16, fontWeight: 800, color: 'var(--color-text)', margin: '0 0 4px' }}>Change Admin Password</h3>
            <p style={{ fontSize: 12, color: 'var(--color-text-light)', margin: '0 0 16px' }}>Update password for {name}</p>
            
            {pwError && (
              <div style={{
                background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 10,
                padding: '8px 12px', fontSize: 12, fontWeight: 600, color: '#DC2626', marginBottom: 12
              }}>{pwError}</div>
            )}
            {pwSuccess && (
              <div style={{
                background: '#ECFDF5', border: '1px solid #A7F3D0', borderRadius: 10,
                padding: '8px 12px', fontSize: 12, fontWeight: 600, color: '#059669', marginBottom: 12
              }}>{pwSuccess}</div>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 20 }}>
              <div>
                <label style={{ display: 'block', fontSize: 10, fontWeight: 700, color: 'var(--color-text-light)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>New Password</label>
                <input
                  type="password"
                  placeholder="New password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  style={{
                    width: '100%', padding: '9px 12px', border: '1.5px solid var(--color-border)',
                    borderRadius: 10, fontSize: 13, fontWeight: 500, color: 'var(--color-text)',
                    background: 'var(--color-bg)', boxSizing: 'border-box'
                  }}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 10, fontWeight: 700, color: 'var(--color-text-light)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>Confirm New Password</label>
                <input
                  type="password"
                  placeholder="Confirm password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  style={{
                    width: '100%', padding: '9px 12px', border: '1.5px solid var(--color-border)',
                    borderRadius: 10, fontSize: 13, fontWeight: 500, color: 'var(--color-text)',
                    background: 'var(--color-bg)', boxSizing: 'border-box'
                  }}
                />
              </div>
            </div>

            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
              <button
                type="button"
                onClick={() => setShowPasswordModal(false)}
                style={{
                  background: 'none', border: '1px solid var(--color-border)', borderRadius: 10,
                  padding: '9px 16px', fontSize: 12, fontWeight: 700, color: 'var(--color-text-muted)',
                  cursor: 'pointer'
                }}
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={updatingPw}
                onClick={handleChangePassword}
                style={{
                  background: 'var(--color-primary)', border: 'none', borderRadius: 10,
                  padding: '9px 16px', fontSize: 12, fontWeight: 700, color: 'white',
                  cursor: 'pointer'
                }}
              >
                {updatingPw ? 'Updating...' : 'Update Password'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
