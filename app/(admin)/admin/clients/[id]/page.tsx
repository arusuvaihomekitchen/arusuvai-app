'use client';
/* eslint-disable @typescript-eslint/no-explicit-any */

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';
import CustomConfirmModal from '@/components/ui/CustomConfirmModal';
import { countServiceDays, addServiceDays } from '@/lib/dateUtils';
import { swrFetch, invalidateCache } from '@/lib/clientCache';

interface ClientDetailProps {
  params: Promise<{ id: string }>;
}

function calculateEndDate(startDateStr: string, serviceDays: number): string {
  if (serviceDays <= 0) return startDateStr;
  const d = new Date(startDateStr + 'T00:00:00');
  const current = new Date(d);
  let serviceCount = 0;
  while (serviceCount < serviceDays) {
    if (current.getDay() !== 0) { // Not Sunday
      serviceCount++;
    }
    if (serviceCount < serviceDays) {
      current.setDate(current.getDate() + 1);
    }
  }
  return current.toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' });
}

export default function ClientDetailPage({ params }: ClientDetailProps) {
  const router = useRouter();
  const { id } = React.use(params);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [data, setData] = useState<any>(null);

  // Modal controls
  const [showRenewModal, setShowRenewModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showSkipModal, setShowSkipModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Packages list
  const [packages, setPackages] = useState<{ id: string; name: string; days: number; price: number; meal_type: string; diet_type: string }[]>([]);
  const [selectedRenewPkgId, setSelectedRenewPkgId] = useState<string>('custom');

  // Form states
  const [renewForm, setRenewForm] = useState({
    amount: '', start_date: '', end_date: '',
  });

  const [editForm, setEditForm] = useState({
    name: '', phone_number: '', location: '', pincode: '', gmap_link: '', password: '', delivery_note: '',
    is_active: true,
    sub_amount: '', start_date: '', end_date: '',
    subscribe_breakfast: false, subscribe_lunch: true, subscribe_dinner: true,
    diet_preference: 'Veg',
  });

  const [skipForm, setSkipForm] = useState({
    start_date: '', end_date: '',
    subscribe_breakfast: false, subscribe_lunch: true, subscribe_dinner: false,
  });

  const loadData = (bypassCache = false) => {
    setLoading(true);
    const unsub = swrFetch(`/api/admin/clients/${id}`, (json) => {
      if (json.success) {
        setData(json.data);
      } else {
        setError(json.error ?? 'Failed to load client');
      }
      setLoading(false);
    }, { bypassCache });
    return unsub;
  };

  useEffect(() => {
    const unsubData = loadData();
    const unsubPkgs = swrFetch('/api/admin/packages', (json) => {
      setPackages(json.data ?? []);
    });
    return () => {
      unsubData();
      unsubPkgs();
    };
  }, [id]);

  const todayStr = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' });

  function getAdjustedEndDates(sub: any) {
    const dates: Record<string, Date> = {};
    if (!sub || !sub.end_date) return dates;
    const baseEnd = new Date(sub.end_date);
    const skips = data?.skipCounts || [];
    
    if (sub.subscribe_breakfast) {
      const bSkips = parseInt(skips.find((s: any) => s.meal_type === 'Breakfast')?.count || '0', 10);
      dates['Breakfast'] = addServiceDays(baseEnd, bSkips);
    }
    if (sub.subscribe_lunch !== false) {
      const lSkips = parseInt(skips.find((s: any) => s.meal_type === 'Lunch')?.count || '0', 10);
      dates['Lunch'] = addServiceDays(baseEnd, lSkips);
    }
    if (sub.subscribe_dinner !== false) {
      const dSkips = parseInt(skips.find((s: any) => s.meal_type === 'Dinner')?.count || '0', 10);
      dates['Dinner'] = addServiceDays(baseEnd, dSkips);
    }
    return dates;
  }

  function getSubStatus(c: any, sub: any) {
    if (!sub || !sub.end_date) return 'expired';
    if (!sub.start_date) return 'expired';
    const today = new Date(todayStr);
    today.setHours(0,0,0,0);
    const start = new Date(sub.start_date);
    start.setHours(0,0,0,0);
    if (today < start) return 'not_started';
    
    const adjustedDates = getAdjustedEndDates(sub);
    const hasActiveMeal = Object.values(adjustedDates).some(d => {
      d.setHours(0,0,0,0);
      return today <= d;
    });
    
    return hasActiveMeal ? 'active' : 'expired';
  }

  function remainingDaysPerMeal(sub: any) {
    if (!sub || !sub.end_date) return {};
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const start = sub.start_date ? new Date(sub.start_date) : today;
    const fromDate = start > today ? start : today;
    
    const adjustedDates = getAdjustedEndDates(sub);
    const rem: Record<string, number> = {};
    for (const [meal, end] of Object.entries(adjustedDates)) {
      if (end < today) rem[meal] = 0;
      else rem[meal] = countServiceDays(fromDate, end);
    }
    return rem;
  }

  // Action Triggers
  function triggerRenew() {
    if (!data?.client) return;
    setRenewForm({ amount: '', start_date: todayStr, end_date: '' });
    setSelectedRenewPkgId('custom');
    setShowRenewModal(true);
  }

  function triggerSkip() {
    if (!data?.client) return;
    const sub = data.subscription;
    setSkipForm({
      start_date: todayStr,
      end_date: todayStr,
      subscribe_breakfast: sub?.subscribe_breakfast === true,
      subscribe_lunch: sub?.subscribe_lunch !== false,
      subscribe_dinner: sub?.subscribe_dinner !== false,
    });
    setShowSkipModal(true);
  }

  function triggerEdit() {
    if (!data?.client) return;
    const c = data.client;
    const s = data.subscription;
    setEditForm({
      name: c.name,
      phone_number: c.phone_number || '',
      location: c.location || '',
      pincode: c.pincode || '',
      gmap_link: c.gmap_link || '',
      password: '',
      delivery_note: c.delivery_note || '',
      is_active: c.is_active !== false,
      sub_amount: s?.amount !== undefined ? String(s.amount) : '',
      start_date: s?.start_date ? s.start_date.slice(0, 10) : '',
      end_date: s?.end_date ? s.end_date.slice(0, 10) : '',
      subscribe_breakfast: s?.subscribe_breakfast === true,
      subscribe_lunch: s?.subscribe_lunch !== false,
      subscribe_dinner: s?.subscribe_dinner !== false,
      diet_preference: c.diet_preference || 'Veg',
    });
    setShowEditModal(true);
  }

  // Handle Package Selection inside Renew
  function handleSelectRenewPackage(pkg: { id: string; name: string; days: number; price: number | string }) {
    setSelectedRenewPkgId(pkg.id);
    if (pkg.id === 'custom') {
      setRenewForm((f) => ({ ...f, amount: '' }));
    } else {
      setRenewForm((f) => {
        const next = { ...f, amount: String(pkg.price) };
        if (f.start_date) {
          next.end_date = calculateEndDate(f.start_date, pkg.days);
        }
        return next;
      });
    }
  }

  function handleRenewStartDateChange(val: string) {
    setRenewForm((f) => {
      const next = { ...f, start_date: val };
      if (selectedRenewPkgId !== 'custom') {
        const pkg = packages.find((p) => p.id === selectedRenewPkgId);
        if (pkg) {
          next.end_date = calculateEndDate(val, pkg.days);
        }
      }
      return next;
    });
  }

  // Submissions
  async function handleRenew() {
    setSaving(true); setError('');
    try {
      const res = await fetch(`/api/admin/clients/${id}/subscription`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(renewForm),
      });
      const json = await res.json();
      if (json.success) {
        invalidateCache('/api/admin/clients');
        invalidateCache(`/api/admin/clients/${id}`);
        setShowRenewModal(false);
        loadData(true);
      } else {
        setError(json.error ?? 'Failed to renew subscription');
      }
    } finally { setSaving(false); }
  }

  async function handleEdit() {
    setSaving(true); setError('');
    try {
      const res = await fetch(`/api/admin/clients/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editForm),
      });
      const json = await res.json();
      if (json.success) {
        invalidateCache('/api/admin/clients');
        invalidateCache(`/api/admin/clients/${id}`);
        setShowEditModal(false);
        loadData(true);
      } else {
        setError(json.error ?? 'Failed to update details');
      }
    } finally { setSaving(false); }
  }

  async function handleSkip() {
    if (!skipForm.start_date || !skipForm.end_date) {
      setError('Start date and End date are required');
      return;
    }
    if (skipForm.start_date > skipForm.end_date) {
      setError('Start date cannot be after End date');
      return;
    }

    const mealTypes: string[] = [];
    if (skipForm.subscribe_breakfast) mealTypes.push('Breakfast');
    if (skipForm.subscribe_lunch) mealTypes.push('Lunch');
    if (skipForm.subscribe_dinner) mealTypes.push('Dinner');

    if (mealTypes.length === 0) {
      setError('Please select at least one meal to skip');
      return;
    }

    setSaving(true); setError('');
    try {
      const res = await fetch('/api/admin/skip-admin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          client_id: id,
          start_date: skipForm.start_date,
          end_date: skipForm.end_date,
          meal_types: mealTypes,
        }),
      });
      const json = await res.json();
      if (json.success) {
        invalidateCache('/api/admin/clients');
        invalidateCache(`/api/admin/clients/${id}`);
        invalidateCache('/api/admin/today');
        setShowSkipModal(false);
        loadData(true);
      } else {
        setError(json.error ?? 'Failed to register skips');
      }
    } finally { setSaving(false); }
  }

  async function handleDelete() {
    setSaving(true); setError('');
    try {
      const res = await fetch(`/api/admin/clients/${id}`, { method: 'DELETE' });
      const json = await res.json();
      if (json.success) {
        invalidateCache('/api/admin/clients');
        invalidateCache(`/api/admin/clients/${id}`);
        setShowDeleteConfirm(false);
        router.push('/admin/clients');
      } else {
        setError(json.error ?? 'Failed to delete client');
      }
    } finally { setSaving(false); }
  }

  if (loading) {
    return <div style={{ textAlign: 'center', padding: 50, color: 'var(--color-text-light)' }}>Loading details…</div>;
  }

  if (!data?.client) {
    return (
      <div style={{ padding: 20, textAlign: 'center' }}>
        <p style={{ color: 'var(--color-error)', fontWeight: 600 }}>{error || 'Client not found.'}</p>
        <Link href="/admin/clients" style={{ color: 'var(--color-primary)', fontWeight: 700 }}>← Back to Clients</Link>
      </div>
    );
  }

  const client = data.client;
  const sub = data.subscription;
  const status = getSubStatus(client, sub);
  const rem = remainingDaysPerMeal(sub);

  const mealsList = sub ? [
    sub.subscribe_breakfast === true ? 'Breakfast 🍳' : null,
    sub.subscribe_lunch !== false ? 'Lunch 🍱' : null,
    sub.subscribe_dinner !== false ? 'Dinner 🌙' : null,
  ].filter(Boolean).join(' + ') : 'None';

  return (
    <div style={{ animation: 'fadeIn 0.3s ease', display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Breadcrumbs & Header */}
      <div>
        <Link href="/admin/clients" style={{ fontSize: 13, fontWeight: 700, color: 'var(--color-primary)', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 4, marginBottom: 8 }}>
          ← Back to Clients List
        </Link>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
          <div>
            <h1 style={{ fontSize: 24, fontWeight: 900, color: 'var(--color-text)', fontFamily: 'Georgia, serif', margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
              {client.name}
              <span style={{ fontSize: 16 }}>{client.diet_preference === 'Non-Veg' ? '🔴' : '🟢'}</span>
            </h1>
            <p style={{ fontSize: 12, color: 'var(--color-text-light)', margin: '4px 0 0' }}>
              Registered on {new Date(client.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
            </p>
          </div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <a 
              href={`/api/admin/clients/${id}/export`}
              download
              style={{
                padding: '6px 14px', background: '#F0F9FF', color: '#0284C7',
                border: '1.5px solid #BAE6FD', borderRadius: 8, fontSize: 12, fontWeight: 700, 
                textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 6, transition: 'all 0.15s ease'
              }}
            >
              📥 Export Logs (Excel)
            </a>
            <Badge variant={status === 'active' ? 'active' : status === 'not_started' ? 'not_started' : 'expired'}>
              {status === 'active' ? 'Active' : status === 'not_started' ? 'Not Started' : 'Expired'}
            </Badge>
          </div>
        </div>
      </div>

      {/* Profile & Subscription Overview */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16 }}>
        {/* Profile Card */}
        <div style={cardStyle}>
          <h3 style={cardTitleStyle}>👤 Client Details</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, fontSize: 13 }}>
            <div style={infoRowStyle}>
              <span style={labelStyle}>Phone Number</span>
              <span style={valueStyle}>📞 {client.phone_number || '—'}</span>
            </div>
            <div style={infoRowStyle}>
              <span style={labelStyle}>Delivery Location</span>
              <span style={valueStyle}>📍 {client.location || '—'} {client.pincode ? `(${client.pincode})` : ''}</span>
            </div>
            {client.gmap_link && (
              <div style={infoRowStyle}>
                <span style={labelStyle}>Google Maps</span>
                <span style={valueStyle}>
                  <a href={client.gmap_link} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--color-primary)', textDecoration: 'underline' }}>
                    🗺️ View on Maps
                  </a>
                </span>
              </div>
            )}
            <div style={infoRowStyle}>
              <span style={labelStyle}>Delivery Note</span>
              <span style={{ ...valueStyle, fontStyle: 'italic', color: 'var(--color-accent-dark)' }}>
                📝 {client.delivery_note ? `"${client.delivery_note}"` : 'None'}
              </span>
            </div>
            <div style={infoRowStyle}>
              <span style={labelStyle}>Diet Preference</span>
              <span style={valueStyle}>{client.diet_preference === 'Non-Veg' ? '🔴 Non-Veg' : '🟢 Veg'}</span>
            </div>
          </div>
        </div>

        {/* Subscription Info */}
        <div style={cardStyle}>
          <h3 style={cardTitleStyle}>📅 Subscription Status</h3>
          {sub ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, fontSize: 13 }}>
              <div style={infoRowStyle}>
                <span style={labelStyle}>Billing Cycle Amount</span>
                <span style={{ ...valueStyle, fontWeight: 800, color: 'var(--color-primary)' }}>
                  ₹{Number(sub.amount).toLocaleString('en-IN')}
                </span>
              </div>
              <div style={infoRowStyle}>
                <span style={labelStyle}>Subscribed Meals</span>
                <span style={valueStyle}>{mealsList}</span>
              </div>
              <div style={infoRowStyle}>
                <span style={labelStyle}>Period</span>
                <span style={valueStyle}>
                  {new Date(sub.start_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })} to {new Date(sub.end_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                </span>
              </div>
              <div style={infoRowStyle}>
                <span style={labelStyle}>Service Days Remaining</span>
                <span style={{ ...valueStyle, fontWeight: 800 }}>
                  {Object.entries(rem).map(([meal, days]) => (
                    <div key={meal}>{meal}: {days} days</div>
                  ))}
                </span>
              </div>
            </div>
          ) : (
            <div style={{ color: 'var(--color-text-muted)', fontSize: 13, fontStyle: 'italic', textAlign: 'center', padding: '12px 0' }}>
              No subscriptions registered.
            </div>
          )}
        </div>
      </div>

      {/* Labeled Action Cards */}
      <div>
        <h2 style={{ fontSize: 16, fontWeight: 800, color: 'var(--color-text)', margin: '10px 0 14px', borderBottom: '1.5px solid var(--color-border)', paddingBottom: 6 }}>
          Manage Client Actions
        </h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 14 }}>
          {/* Renew Card */}
          <div style={actionCardStyle}>
            <div style={{ fontSize: 24 }}>🔁</div>
            <h4 style={actionCardTitle}>Renew Subscription</h4>
            <p style={actionCardDesc}>Renew or create a subscription plan cycle for the client.</p>
            <Button size="sm" onClick={triggerRenew} style={{ width: '100%' }}>Renew Sub</Button>
          </div>

          {/* Skip Card */}
          <div style={{ ...actionCardStyle, borderColor: 'var(--color-accent-dark)' }}>
            <div style={{ fontSize: 24 }}>⏭️</div>
            <h4 style={actionCardTitle}>Skip Range</h4>
            <p style={actionCardDesc}>Register meal skips for a range of dates (excluding Sundays).</p>
            <Button size="sm" variant="accent" onClick={triggerSkip} style={{ width: '100%' }}>Skip Meals</Button>
          </div>

          {/* Edit Card */}
          <div style={actionCardStyle}>
            <div style={{ fontSize: 24 }}>✏️</div>
            <h4 style={actionCardTitle}>Edit Profile</h4>
            <p style={actionCardDesc}>Modify name, phone number, address, password, or subscription details.</p>
            <Button size="sm" onClick={triggerEdit} style={{ width: '100%', background: '#EFF6FF', color: '#3B82F6', border: '1px solid #EFF6FF' }}>Edit Info</Button>
          </div>

          {/* Delete Card */}
          <div style={{ ...actionCardStyle, borderColor: '#FECACA' }}>
            <div style={{ fontSize: 24 }}>🗑️</div>
            <h4 style={actionCardTitle}>Delete Client</h4>
            <p style={actionCardDesc}>Deactivate and delete this client permanently from database.</p>
            <Button size="sm" onClick={() => setShowDeleteConfirm(true)} style={{ width: '100%', background: '#FEF2F2', color: '#DC2626', border: '1px solid #FECACA' }}>Deactivate</Button>
          </div>
        </div>
      </div>

      {/* History Log Panels */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 20, marginTop: 10 }}>
        {/* Deliveries Log */}
        <div style={cardStyle}>
          <h3 style={cardTitleStyle}>🍱 Recent Deliveries</h3>
          {data.deliveries.length === 0 ? (
            <div style={emptyLogStyle}>No delivery entries logged yet.</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 300, overflowY: 'auto' }}>
              {data.deliveries.map((d: any) => (
                <div key={d.id} style={logItemStyle}>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 13 }}>
                      {d.meal_type} — {new Date(d.date).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' })}
                    </div>
                    {d.delivery_person_name && (
                      <div style={{ fontSize: 11, color: 'var(--color-text-light)', marginTop: 2 }}>
                        Delivered by {d.delivery_person_name}
                      </div>
                    )}
                  </div>
                  <Badge variant={d.status === 'delivered' ? 'delivered' : d.status === 'not_available' ? 'not_available' : d.status === 'skipped' ? 'skipped' : 'pending'}>
                    {d.status === 'delivered' ? '✓ Delivered' : d.status === 'not_available' ? 'Not Available' : d.status === 'skipped' ? 'Skipped' : 'Pending'}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Skips Log */}
        <div style={cardStyle}>
          <h3 style={cardTitleStyle}>⏭️ Recent Skip Requests</h3>
          {data.skips.length === 0 ? (
            <div style={emptyLogStyle}>No skip requests found.</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 300, overflowY: 'auto' }}>
              {data.skips.map((r: any) => (
                <div key={r.id} style={logItemStyle}>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 13 }}>
                      {r.meal_type} — {new Date(r.date).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' })}
                    </div>
                    <div style={{ fontSize: 10, color: 'var(--color-text-light)', marginTop: 2 }}>
                      Requested {new Date(r.requested_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                    </div>
                  </div>
                  <Badge variant={r.status === 'approved' ? 'skipped' : r.status}>
                    {r.status === 'approved' ? 'Skipped' : r.status}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Renew Modal */}
      <Modal open={showRenewModal} onClose={() => { setShowRenewModal(false); setError(''); }} maxWidth={480}>
        <h3 style={{ fontSize: 17, fontWeight: 800, color: 'var(--color-text)', marginBottom: 4 }}>Renew Subscription</h3>
        <p style={{ fontSize: 13, color: 'var(--color-text-muted)', marginBottom: 16 }}>For {client.name}</p>
        {error && <div style={errorStyle}>{error}</div>}
        {/* Package Selector */}
        <div style={{ marginBottom: 12 }}>
          <label style={fieldLabel}>Select Predefined Package</label>
          <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 6 }}>
            <button
              type="button"
              onClick={() => handleSelectRenewPackage({ id: 'custom', name: 'Custom Plan', days: 0, price: '' })}
              style={{
                padding: '8px 12px', background: selectedRenewPkgId === 'custom' ? 'var(--color-primary)' : 'white',
                color: selectedRenewPkgId === 'custom' ? 'white' : 'var(--color-text-muted)',
                border: `1.5px solid ${selectedRenewPkgId === 'custom' ? 'var(--color-primary)' : 'var(--color-border)'}`,
                borderRadius: 10, fontSize: 11, fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap',
                fontFamily: 'Outfit, sans-serif',
              }}
            >
              ⚙️ Custom Plan
            </button>
            {packages.map((pkg) => {
              const isSel = selectedRenewPkgId === pkg.id;
              return (
                <button
                  key={pkg.id}
                  type="button"
                  onClick={() => handleSelectRenewPackage(pkg)}
                  style={{
                    padding: '8px 12px', background: isSel ? 'var(--color-primary)' : 'white',
                    color: isSel ? 'white' : 'var(--color-text-muted)',
                    border: `1.5px solid ${isSel ? 'var(--color-primary)' : 'var(--color-border)'}`,
                    borderRadius: 10, fontSize: 11, fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap',
                    fontFamily: 'Outfit, sans-serif',
                  }}
                >
                  {pkg.name} ({pkg.days}d • ₹{pkg.price})
                </button>
              );
            })}
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 10, marginBottom: 12 }}>
          <div>
            <label style={fieldLabel}>Amount (₹)</label>
            <input
              type="number"
              disabled={selectedRenewPkgId !== 'custom'}
              value={renewForm.amount}
              onChange={(e) => setRenewForm((f) => ({ ...f, amount: e.target.value }))}
              style={inputSm}
            />
          </div>
          <div>
            <label style={fieldLabel}>Start Date</label>
            <input
              type="date"
              value={renewForm.start_date}
              onChange={(e) => handleRenewStartDateChange(e.target.value)}
              style={inputSm}
            />
          </div>
          <div>
            <label style={fieldLabel}>End Date</label>
            <input
              type="date"
              disabled={selectedRenewPkgId !== 'custom'}
              value={renewForm.end_date}
              onChange={(e) => setRenewForm((f) => ({ ...f, end_date: e.target.value }))}
              style={inputSm}
            />
          </div>
        </div>
        {renewForm.start_date && renewForm.end_date && (
          <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--color-primary)', marginBottom: 12 }}>
            {countServiceDays(new Date(renewForm.start_date), new Date(renewForm.end_date))} service days
          </div>
        )}
        <div style={{ display: 'flex', gap: 8 }}>
          <Button variant="ghost" fullWidth onClick={() => setShowRenewModal(false)}>Cancel</Button>
          <Button loading={saving} fullWidth onClick={handleRenew}>Renew</Button>
        </div>
      </Modal>

      {/* Edit Client Modal */}
      <Modal open={showEditModal} onClose={() => { setShowEditModal(false); setError(''); }} maxWidth={560}>
        <h3 style={{ fontSize: 17, fontWeight: 800, color: 'var(--color-text)', marginBottom: 4 }}>Edit Client Details</h3>
        <p style={{ fontSize: 13, color: 'var(--color-text-muted)', marginBottom: 16 }}>For {client.name}</p>
        {error && <div style={errorStyle}>{error}</div>}
        
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12, marginBottom: 12 }}>
          {[
            { label: 'Full Name *', key: 'name', type: 'text' },
            { label: 'Phone Number *', key: 'phone_number', type: 'text' },
            { label: 'Location / Area', key: 'location', type: 'text' },
            { label: 'Pincode *', key: 'pincode', type: 'text' },
            { label: 'Google Maps Link', key: 'gmap_link', type: 'text', placeholder: 'https://maps.app.goo.gl/...' },
            { label: 'Reset Password (leave blank to keep current)', key: 'password', type: 'password', placeholder: 'Enter new password to reset' },
            { label: 'Delivery Note', key: 'delivery_note', type: 'text' },
          ].map(({ label, key, type, placeholder }) => (
            <div key={key} style={key === 'delivery_note' ? { gridColumn: '1 / -1' } : undefined}>
              <label style={fieldLabel}>{label}</label>
              <input
                type={type}
                placeholder={placeholder}
                value={(editForm as any)[key]}
                onChange={(e) => setEditForm((f) => ({ ...f, [key]: e.target.value }))}
                style={inputSm}
                autoComplete="new-password"
              />
            </div>
          ))}
        </div>

        <div style={{ marginBottom: 16 }}>
          <label style={fieldLabel}>Diet Preference</label>
          <div style={{ display: 'flex', gap: 12 }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, cursor: 'pointer' }}>
              <input type="radio" name="edit_diet_preference" value="Veg" checked={editForm.diet_preference === 'Veg'} onChange={(e) => setEditForm(f => ({ ...f, diet_preference: 'Veg' }))} />
              Veg 🟢
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, cursor: 'pointer' }}>
              <input type="radio" name="edit_diet_preference" value="Non-Veg" checked={editForm.diet_preference === 'Non-Veg'} onChange={(e) => setEditForm(f => ({ ...f, diet_preference: 'Non-Veg' }))} />
              Non-Veg 🔴
            </label>
          </div>
        </div>

        {/* Client Profile Status Checkbox */}
        <div style={{ marginBottom: 16 }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, fontWeight: 700, color: 'var(--color-text)', cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={editForm.is_active}
              onChange={(e) => setEditForm((f) => ({ ...f, is_active: e.target.checked }))}
            />
            Active Client Profile (uncheck to deactivate client)
          </label>
        </div>

        {/* Subscription section */}
        <div style={{ background: 'var(--color-primary-light)', borderRadius: 14, padding: 14, marginTop: 14, marginBottom: 14 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--color-primary)', textTransform: 'uppercase', marginBottom: 10 }}>Subscription Details</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: 10 }}>
            {[
              { label: 'Amount (₹)', key: 'sub_amount', type: 'number', placeholder: 'e.g. 2500' },
              { label: 'Start Date', key: 'start_date', type: 'date' },
              { label: 'End Date', key: 'end_date', type: 'date' },
            ].map(({ label, key, type, placeholder }) => (
              <div key={key}>
                <label style={fieldLabel}>{label}</label>
                <input
                  type={type}
                  placeholder={placeholder}
                  value={(editForm as any)[key]}
                  onChange={(e) => setEditForm((f) => ({ ...f, [key]: e.target.value }))}
                  style={inputSm}
                />
              </div>
            ))}
          </div>
          {editForm.start_date && editForm.end_date && (
            <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--color-primary)', marginTop: 8 }}>
              {countServiceDays(new Date(editForm.start_date), new Date(editForm.end_date))} service days
            </div>
          )}

          {/* Checkboxes */}
          <div style={{ display: 'flex', gap: 16, marginTop: 12, flexWrap: 'wrap' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 600, color: 'var(--color-text)', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={editForm.subscribe_breakfast}
                onChange={(e) => setEditForm((f) => ({ ...f, subscribe_breakfast: e.target.checked }))}
              />
              Subscribe Breakfast 🍳
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 600, color: 'var(--color-text)', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={editForm.subscribe_lunch}
                onChange={(e) => setEditForm((f) => ({ ...f, subscribe_lunch: e.target.checked }))}
              />
              Subscribe Lunch 🍱
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 600, color: 'var(--color-text)', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={editForm.subscribe_dinner}
                onChange={(e) => setEditForm((f) => ({ ...f, subscribe_dinner: e.target.checked }))}
              />
              Subscribe Dinner 🌙
            </label>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
          <Button variant="ghost" fullWidth onClick={() => setShowEditModal(false)}>Cancel</Button>
          <Button loading={saving} fullWidth onClick={handleEdit}>Save Changes</Button>
        </div>
      </Modal>

      {/* Bulk Skip Modal */}
      <Modal open={showSkipModal} onClose={() => { setShowSkipModal(false); setError(''); }} maxWidth={480}>
        <h3 style={{ fontSize: 17, fontWeight: 800, color: 'var(--color-text)', marginBottom: 4 }}>Skip Meals for Client</h3>
        <p style={{ fontSize: 13, color: 'var(--color-text-muted)', marginBottom: 16 }}>For {client.name}</p>
        {error && <div style={errorStyle}>{error}</div>}
        
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 10, marginBottom: 12 }}>
          <div>
            <label style={fieldLabel}>Start Date</label>
            <input
              type="date"
              value={skipForm.start_date}
              onChange={(e) => setSkipForm((f) => ({ ...f, start_date: e.target.value }))}
              style={inputSm}
            />
          </div>
          <div>
            <label style={fieldLabel}>End Date</label>
            <input
              type="date"
              value={skipForm.end_date}
              onChange={(e) => setSkipForm((f) => ({ ...f, end_date: e.target.value }))}
              style={inputSm}
            />
          </div>
        </div>

        {skipForm.start_date && skipForm.end_date && (
          <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--color-primary)', marginBottom: 12 }}>
            {countServiceDays(new Date(skipForm.start_date), new Date(skipForm.end_date))} service days will be skipped (excluding Sundays)
          </div>
        )}

        <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--color-text-light)', textTransform: 'uppercase', marginBottom: 10 }}>Select Meals to Skip</div>
        <div style={{ display: 'flex', gap: 16, marginBottom: 16, flexWrap: 'wrap' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 600, color: 'var(--color-text)', cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={skipForm.subscribe_breakfast}
              onChange={(e) => setSkipForm((f) => ({ ...f, subscribe_breakfast: e.target.checked }))}
            />
            Breakfast 🍳
          </label>
          <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 600, color: 'var(--color-text)', cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={skipForm.subscribe_lunch}
              onChange={(e) => setSkipForm((f) => ({ ...f, subscribe_lunch: e.target.checked }))}
            />
            Lunch 🍱
          </label>
          <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 600, color: 'var(--color-text)', cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={skipForm.subscribe_dinner}
              onChange={(e) => setSkipForm((f) => ({ ...f, subscribe_dinner: e.target.checked }))}
            />
            Dinner 🌙
          </label>
        </div>

        <div style={{ display: 'flex', gap: 8 }}>
          <Button variant="ghost" fullWidth onClick={() => setShowSkipModal(false)}>Cancel</Button>
          <Button loading={saving} fullWidth onClick={handleSkip}>Save Skips</Button>
        </div>
      </Modal>

      {/* Delete/Deactivate Confirmation Modal */}
      <CustomConfirmModal
        open={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={handleDelete}
        title="Deactivate & Delete Client"
        message={`Are you sure you want to permanently delete client ${client.name}? This will delete all their historical invoices, delivery logs, and profile records from the database.`}
        confirmText="Permanently Delete"
        cancelText="Cancel"
        variant="danger"
        loading={saving}
      />
    </div>
  );
}

// Styling Constants
const cardStyle: React.CSSProperties = {
  background: 'white',
  border: '1.5px solid var(--color-border)',
  borderRadius: 20,
  padding: 20,
};

const cardTitleStyle: React.CSSProperties = {
  fontSize: 14,
  fontWeight: 800,
  color: 'var(--color-primary)',
  margin: '0 0 16px',
  borderBottom: '1px solid var(--color-border)',
  paddingBottom: 10,
};

const actionCardStyle: React.CSSProperties = {
  background: 'white',
  border: '1.5px solid var(--color-border)',
  borderRadius: 16,
  padding: 16,
  display: 'flex',
  flexDirection: 'column',
  gap: 10,
  alignItems: 'flex-start',
  justifyContent: 'space-between',
};

const actionCardTitle: React.CSSProperties = {
  fontSize: 14,
  fontWeight: 850,
  color: 'var(--color-text)',
  margin: 0,
};

const actionCardDesc: React.CSSProperties = {
  fontSize: 12,
  color: 'var(--color-text-muted)',
  margin: 0,
  lineHeight: 1.5,
};

const infoRowStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  paddingBottom: 8,
  borderBottom: '1px dashed var(--color-border)',
};

const labelStyle: React.CSSProperties = {
  color: 'var(--color-text-light)',
  fontWeight: 600,
};

const valueStyle: React.CSSProperties = {
  fontWeight: 700,
  color: 'var(--color-text)',
};

const emptyLogStyle: React.CSSProperties = {
  color: 'var(--color-text-muted)',
  fontSize: 12,
  fontStyle: 'italic',
  textAlign: 'center',
  padding: '24px 0',
};

const logItemStyle: React.CSSProperties = {
  background: 'var(--color-bg)',
  border: '1px solid var(--color-border)',
  borderRadius: 12,
  padding: '10px 14px',
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
};

const fieldLabel: React.CSSProperties = {
  display: 'block', fontSize: 10, fontWeight: 700,
  color: 'var(--color-text-light)', textTransform: 'uppercase',
  letterSpacing: '0.06em', marginBottom: 4,
};

const inputSm: React.CSSProperties = {
  width: '100%', padding: '9px 12px',
  border: '1.5px solid var(--color-border)', borderRadius: 10,
  fontSize: 13, fontWeight: 500, color: 'var(--color-text)',
  background: 'var(--color-bg)', boxSizing: 'border-box',
};

const errorStyle: React.CSSProperties = {
  background: '#FEF2F2', border: '1px solid #FECACA',
  borderRadius: 10, padding: '8px 12px', fontSize: 12,
  fontWeight: 600, color: '#DC2626', marginBottom: 12,
};
