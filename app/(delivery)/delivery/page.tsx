'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Badge from '@/components/ui/Badge';
import type { DailyDelivery } from '@/types';

type MealTab = 'Lunch' | 'Dinner';

function dateStr(d: Date) {
  return d.toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' });
}

function formatDateDisplay(iso: string) {
  const d = new Date(iso);
  const isToday = iso === dateStr(new Date());
  const label = d.toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' });
  return isToday ? `Today — ${label}` : label;
}

export default function DeliveryTodayPage() {
  const router = useRouter();
  const [date, setDate] = useState(dateStr(new Date()));
  const [deliveries, setDeliveries] = useState<(DailyDelivery & { delivery_note_client?: string; skip_status?: string; skip_req_id?: string })[]>([]);
  const [mealTab, setMealTab] = useState<MealTab>('Lunch');
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);
  const [personName, setPersonName] = useState('');
  const [signingOut, setSigningOut] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const res = await fetch(`/api/delivery/today?date=${date}`);
    if (res.status === 401) { router.push('/login'); return; }
    const data = await res.json();
    setDeliveries(data.data ?? []);
    setLoading(false);
  }, [router, date]);

  useEffect(() => { load(); }, [load]);

  function navDate(dir: number) {
    const d = new Date(date + 'T00:00:00');
    d.setDate(d.getDate() + dir);
    setDate(dateStr(d));
  }

  // Get name from cookie
  useEffect(() => {
    fetch('/api/auth/me').then((r) => {
      if (r.ok) r.json().then((d) => setPersonName(d.data?.name ?? ''));
    }).catch(() => {});
  }, []);

  async function markStatus(id: string, status: 'delivered' | 'not_available') {
    setUpdating(id);
    await fetch(`/api/delivery/deliveries/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status, delivery_note: status === 'not_available' ? 'Client not available at site' : undefined }),
    });
    setUpdating(null);
    load();
  }

  async function signOut() {
    setSigningOut(true);
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/login');
    router.refresh();
  }

  const filtered   = deliveries.filter((d) => d.meal_type === mealTab);
  const toDeliver  = filtered.filter((d) => d.status === 'assigned');
  const done       = filtered.filter((d) => ['delivered', 'not_available'].includes(d.status));
  const lunchCount = deliveries.filter((d) => d.meal_type === 'Lunch').length;
  const dinnerCount= deliveries.filter((d) => d.meal_type === 'Dinner').length;
  const doneCount  = filtered.filter((d) => d.status === 'delivered').length;
  const totalCount = filtered.length;
  const progress   = totalCount > 0 ? Math.round((doneCount / totalCount) * 100) : 0;

  return (
    <div style={{ minHeight: '100vh', background: 'var(--color-bg)', display: 'flex', flexDirection: 'column' }}>
      {/* Dark green header */}
      <header style={{
        background: 'linear-gradient(135deg, #2C5E2E, #1E4020)',
        padding: '16px 20px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <div>
          <div style={{ fontSize: 11, color: '#A8D4A8', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Delivery</div>
          <div style={{ fontSize: 19, fontWeight: 800, color: 'white', fontFamily: 'Georgia, serif' }}>
            {personName || 'Delivery Person'}
          </div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: 16, fontWeight: 800, color: 'var(--color-accent)' }}>
            {deliveries.length} assigned
          </div>
          <button
            onClick={signOut}
            disabled={signingOut}
            style={{
              marginTop: 6, background: 'rgba(255,255,255,0.15)',
              border: '1px solid rgba(255,255,255,0.2)', borderRadius: 8,
              padding: '4px 10px', fontSize: 11, fontWeight: 700, color: 'white',
              cursor: 'pointer',
            }}
          >
            Sign Out
          </button>
        </div>
      </header>

      {/* Meal tabs */}
      <div style={{ background: 'white', borderBottom: '1px solid var(--color-border)', display: 'flex', padding: '6px 8px', gap: 4 }}>
        {(['Lunch', 'Dinner'] as MealTab[]).map((tab) => {
          const count = tab === 'Lunch' ? lunchCount : dinnerCount;
          const active = mealTab === tab;
          return (
            <button key={tab} onClick={() => setMealTab(tab)}
              style={{
                flex: 1, padding: '10px 8px',
                background: active ? 'var(--color-primary)' : 'transparent',
                color: active ? 'white' : 'var(--color-text-muted)',
                border: 'none', borderRadius: 10,
                fontSize: 13, fontWeight: active ? 700 : 600, cursor: 'pointer',
              }}
            >
              {tab === 'Lunch' ? '🍱' : '🌙'} {tab} ({count})
            </button>
          );
        })}
      </div>

      {/* Progress bar */}
      <div style={{ background: 'white', padding: '10px 16px', borderBottom: '1px solid var(--color-border)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, marginBottom: 4 }}>
          <span style={{ color: 'var(--color-text-muted)', fontWeight: 600 }}>
            {mealTab} progress
          </span>
          <span style={{ color: 'var(--color-primary)', fontWeight: 800 }}>
            {doneCount} of {totalCount} delivered
          </span>
        </div>
        <div style={{ background: 'var(--color-primary-light)', borderRadius: 4, height: 8 }}>
          <div style={{
            background: 'var(--color-primary)', height: 8, borderRadius: 4,
            width: `${progress}%`, transition: 'width 0.5s ease',
          }} />
        </div>
      </div>

      {/* List */}
      <main style={{ flex: 1, padding: '14px 16px', maxWidth: 600, width: '100%', margin: '0 auto' }}>
        {/* Date navigator */}
        <div style={{
          background: 'white', border: '1px solid var(--color-border)',
          borderRadius: 16, padding: '14px 20px',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          marginBottom: 16,
        }}>
          <button onClick={() => navDate(-1)} style={navBtnStyle}>‹</button>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 10, color: 'var(--color-text-light)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Delivery Date</div>
            <div style={{ fontSize: 16, fontWeight: 800, color: 'var(--color-primary)', fontFamily: 'Georgia, serif' }}>
              {formatDateDisplay(date)}
            </div>
          </div>
          <button onClick={() => navDate(1)} style={navBtnStyle}>›</button>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: 40, color: 'var(--color-text-light)' }}>Loading your list…</div>
        ) : (
          <>
            {toDeliver.length > 0 && (
              <>
                <div style={{
                  fontSize: 11, fontWeight: 700, color: 'var(--color-text-muted)',
                  textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 10,
                }}>
                  To Deliver — {toDeliver.length} remaining
                </div>
                {toDeliver.map((d, idx) => (
                  <div key={d.id} style={{
                    background: 'white', border: '1.5px solid var(--color-border)',
                    borderRadius: 14, padding: 14, marginBottom: 8,
                  }}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 10 }}>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                          <span style={{ fontSize: 16, fontWeight: 800, color: 'var(--color-text)' }}>{d.client_name}</span>
                          {d.skip_status === 'pending' && (
                            <Badge variant="pending">Skip Pending</Badge>
                          )}
                        </div>
                        <div style={{ fontSize: 13, color: 'var(--color-text-muted)', marginTop: 2 }}>📞 {d.phone_number}</div>
                        <div style={{ fontSize: 12, color: 'var(--color-text-light)', marginTop: 2, display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 6 }}>
                          📍 {d.location}
                          {d.gmap_link && (
                            <a href={d.gmap_link} target="_blank" rel="noopener noreferrer" style={{ background: 'var(--color-primary-light)', color: 'var(--color-primary)', textDecoration: 'none', padding: '2px 8px', borderRadius: 12, fontSize: 11, fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                              🗺️ Open in Maps
                            </a>
                          )}
                        </div>
                      </div>
                      <div style={{
                        width: 32, height: 32,
                        background: 'var(--color-primary-light)', borderRadius: 8,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        color: 'var(--color-primary)', fontWeight: 900, fontSize: 16,
                      }}>
                        {idx + 1}
                      </div>
                    </div>

                    {d.delivery_note_client && (
                      <div style={{
                        background: 'var(--color-accent-light)', borderRadius: 8,
                        padding: '7px 10px', fontSize: 11, color: '#78350F', marginBottom: 10,
                      }}>
                        📝 &quot;{d.delivery_note_client}&quot;
                      </div>
                    )}

                    <div style={{ display: 'flex', gap: 8 }}>
                      <button
                        onClick={() => markStatus(d.id, 'delivered')}
                        disabled={updating === d.id}
                        style={{
                          flex: 2, padding: '11px',
                          background: updating === d.id ? '#8FA48F' : 'var(--color-primary)',
                          color: 'white', border: 'none', borderRadius: 10,
                          fontWeight: 700, fontSize: 13, cursor: 'pointer',
                        }}
                      >
                        {updating === d.id ? '…' : '✓ Delivered'}
                      </button>
                      <button
                        onClick={() => markStatus(d.id, 'not_available')}
                        disabled={updating === d.id}
                        style={{
                          flex: 1, padding: '11px',
                          background: 'white', color: 'var(--color-accent-dark)',
                          border: '1.5px solid var(--color-accent)', borderRadius: 10,
                          fontWeight: 700, fontSize: 12, cursor: 'pointer',
                        }}
                      >
                        Not Available
                      </button>
                    </div>
                  </div>
                ))}
              </>
            )}

            {done.length > 0 && (
              <>
                <div style={{
                  fontSize: 11, fontWeight: 700, color: 'var(--color-primary)',
                  textTransform: 'uppercase', letterSpacing: '0.08em',
                  marginTop: 20, marginBottom: 10,
                }}>
                  Completed — {done.length}
                </div>
                {done.map((d) => (
                  <div key={d.id} style={{
                    background: d.status === 'delivered' ? '#F0FDF4' : '#FFF7ED',
                    border: `1px solid ${d.status === 'delivered' ? '#BBF7D0' : '#FED7AA'}`,
                    borderRadius: 14, padding: '11px 14px', marginBottom: 6,
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  }}>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--color-text)' }}>{d.client_name}</div>
                      <div style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>📍 {d.location}</div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <span style={{
                        background: d.status === 'delivered' ? '#22C55E' : 'var(--color-accent)',
                        color: 'white',
                        borderRadius: 20, padding: '3px 10px',
                        fontSize: 11, fontWeight: 700,
                      }}>
                        {d.status === 'delivered' ? '✓ Done' : 'Not at Site'}
                      </span>
                      {d.delivered_at && (
                        <div style={{ fontSize: 10, color: 'var(--color-text-light)', marginTop: 2 }}>
                          {new Date(d.delivered_at).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Kolkata' })}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </>
            )}

            {filtered.length === 0 && (
              <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--color-text-light)' }}>
                <div style={{ fontSize: 40, marginBottom: 12 }}>🎉</div>
                <div style={{ fontSize: 14, fontWeight: 600 }}>No deliveries assigned for {mealTab}.</div>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}

const navBtnStyle: React.CSSProperties = {
  width: 36, height: 36,
  background: 'var(--color-primary-light)', border: 'none',
  borderRadius: 10, fontSize: 18, cursor: 'pointer',
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  color: 'var(--color-primary)', fontWeight: 700,
  transition: 'background 0.15s',
};
