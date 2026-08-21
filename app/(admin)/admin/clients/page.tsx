'use client';
/* eslint-disable @typescript-eslint/no-explicit-any */

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import { countServiceDays, addServiceDays } from '@/lib/dateUtils';
import { swrFetch, invalidateCache } from '@/lib/clientCache';

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

interface ClientRow {
  id: string; name: string; phone_number: string; location: string; pincode?: string;
  username: string; delivery_note: string; is_active: boolean;
  sub_id?: string; sub_amount?: number; start_date?: string;
  end_date?: string; sub_status?: string; sub_type?: string;
  payment_status?: string;
  subscribe_lunch?: boolean;
  subscribe_dinner?: boolean;
  subscribe_breakfast?: boolean;
  breakfast_skips?: string;
  lunch_skips?: string;
  dinner_skips?: string;
  diet_preference?: string;
}

export default function AdminClientsPage() {
  const [clients, setClients] = useState<ClientRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState('');
  const [error, setError] = useState('');

  const [packages, setPackages] = useState<any[]>([]);
  const [selectedPkgId, setSelectedPkgId] = useState<string>('custom');

  const [viewMode, setViewMode] = useState<'grid' | 'list'>(() => {
    if (typeof window !== 'undefined') {
      return (localStorage.getItem('clients_view_mode') as 'grid' | 'list') || 'grid';
    }
    return 'grid';
  });

  const handleSetViewMode = (mode: 'grid' | 'list') => {
    setViewMode(mode);
    localStorage.setItem('clients_view_mode', mode);
  };

  const [form, setForm] = useState({
    name: '', phone_number: '', location: '', pincode: '', gmap_link: '',
    password: '', delivery_note: '',
    sub_amount: '', sub_start: '', sub_end: '',
    subscribe_breakfast: false,
    subscribe_lunch: true, subscribe_dinner: true,
    diet_preference: 'Veg',
  });

  useEffect(() => {
    const unsub = swrFetch('/api/admin/packages', (json) => {
      setPackages(json.data ?? []);
    });
    return unsub;
  }, []);

  function handleSelectPackage(pkg: any) {
    setSelectedPkgId(pkg.id);
    if (pkg.id === 'custom') {
      setForm((f) => ({
        ...f,
        sub_amount: '',
      }));
    } else {
      const meals = pkg.meal_type;
      const b = meals.includes('Breakfast');
      const l = meals.includes('Lunch');
      const d = meals.includes('Dinner');
      setForm((f) => {
        const next = {
          ...f,
          sub_amount: String(pkg.price),
          subscribe_breakfast: b,
          subscribe_lunch: l,
          subscribe_dinner: d,
        };
        if (f.sub_start) {
          next.sub_end = calculateEndDate(f.sub_start, pkg.days);
        }
        return next;
      });
    }
  }

  function handleStartDateChange(val: string) {
    setForm((f) => {
      const next = { ...f, sub_start: val };
      if (selectedPkgId !== 'custom') {
        const pkg = packages.find((p) => p.id === selectedPkgId);
        if (pkg) {
          next.sub_end = calculateEndDate(val, pkg.days);
        }
      }
      return next;
    });
  }

  const loadClients = (bypassCache = false) => {
    setLoading(true);
    const unsub = swrFetch('/api/admin/clients', (json) => {
      setClients(json.data ?? []);
      setLoading(false);
    }, { bypassCache });
    return unsub;
  };

  useEffect(() => {
    const unsub = loadClients();
    return unsub;
  }, []);

  const todayStr = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' });

  function getAdjustedEndDates(c: ClientRow) {
    const dates: Record<string, Date> = {};
    if (!c.end_date) return dates;
    const baseEnd = new Date(c.end_date);
    
    if (c.subscribe_breakfast) {
      const skips = parseInt(c.breakfast_skips || '0', 10);
      dates['Breakfast'] = addServiceDays(baseEnd, skips);
    }
    if (c.subscribe_lunch !== false) {
      const skips = parseInt(c.lunch_skips || '0', 10);
      dates['Lunch'] = addServiceDays(baseEnd, skips);
    }
    if (c.subscribe_dinner !== false) {
      const skips = parseInt(c.dinner_skips || '0', 10);
      dates['Dinner'] = addServiceDays(baseEnd, skips);
    }
    return dates;
  }

  function getSubStatus(c: ClientRow) {
    if (!c.end_date) return 'expired';
    if (!c.start_date) return 'expired';
    const today = new Date(todayStr);
    today.setHours(0,0,0,0);
    const start = new Date(c.start_date);
    start.setHours(0,0,0,0);
    if (today < start) return 'not_started';
    
    const adjustedDates = getAdjustedEndDates(c);
    const hasActiveMeal = Object.values(adjustedDates).some(d => {
      d.setHours(0,0,0,0);
      return today <= d;
    });
    
    return hasActiveMeal ? 'active' : 'expired';
  }

  function remainingDays(c: ClientRow) {
    if (!c.end_date) return 0;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const start = c.start_date ? new Date(c.start_date) : today;
    const fromDate = start > today ? start : today;
    
    const adjustedDates = getAdjustedEndDates(c);
    let maxRem = 0;
    for (const end of Object.values(adjustedDates)) {
      if (end >= today) {
        const rem = countServiceDays(fromDate, end);
        if (rem > maxRem) maxRem = rem;
      }
    }
    return maxRem;
  }

  async function addClient() {
    setSaving(true); setError('');
    try {
      const res = await fetch('/api/admin/clients', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name,
          phone_number: form.phone_number,
          location: form.location,
          pincode: form.pincode,
          gmap_link: form.gmap_link,
          password: form.password,
          delivery_note: form.delivery_note,
          subscription: form.sub_amount && form.sub_start && form.sub_end ? {
            amount: parseFloat(form.sub_amount),
            start_date: form.sub_start,
            end_date: form.sub_end,
            subscribe_breakfast: form.subscribe_breakfast,
            subscribe_lunch: form.subscribe_lunch,
            subscribe_dinner: form.subscribe_dinner,
          } : undefined,
          diet_preference: form.diet_preference,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setShowAddForm(false);
        setForm({
          name:'', phone_number:'', location:'', pincode:'', gmap_link:'', password:'', delivery_note:'',
          sub_amount:'', sub_start:'', sub_end:'',
          subscribe_breakfast: false,
          subscribe_lunch: true, subscribe_dinner: true,
          diet_preference: 'Veg'
        });
        invalidateCache('/api/admin/clients');
        setSelectedPkgId('custom');
        loadClients(true);
      } else {
        setError(data.error ?? 'Failed to add client');
      }
    } finally { setSaving(false); }
  }

  const [statusFilter, setStatusFilter] = useState<'all' | 'active_sub' | 'expired_sub' | 'expiring_soon' | 'deactivated'>('all');
  const [sortMode, setSortMode] = useState<'name' | 'validityAsc' | 'validityDesc'>('name');
  const [mealFilter, setMealFilter] = useState<'all' | 'breakfast' | 'lunch' | 'dinner'>('all');

  const filtered = clients.filter((c) => {
    const matchesSearch =
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.location?.toLowerCase().includes(search.toLowerCase()) ||
      c.pincode?.toLowerCase().includes(search.toLowerCase());

    if (!matchesSearch) return false;

    if (mealFilter === 'breakfast' && c.subscribe_breakfast !== true) return false;
    if (mealFilter === 'lunch' && c.subscribe_lunch === false) return false;
    if (mealFilter === 'dinner' && c.subscribe_dinner === false) return false;

    const subStatus = getSubStatus(c);

    if (statusFilter === 'active_sub') {
      return c.is_active && subStatus === 'active';
    } else if (statusFilter === 'expired_sub') {
      return c.is_active && (subStatus === 'expired' || subStatus === 'not_started');
    } else if (statusFilter === 'expiring_soon') {
      if (!c.is_active || subStatus !== 'active') return false;
      const rem = remainingDays(c);
      return rem <= 3;
    } else if (statusFilter === 'deactivated') {
      return !c.is_active;
    } else {
      // 'all' - Show all active profiles
      return c.is_active;
    }
  });
  
  const sorted = [...filtered].sort((a, b) => {
    if (sortMode === 'name') {
      return a.name.localeCompare(b.name);
    } else {
      const remA = remainingDays(a);
      const remB = remainingDays(b);
      return sortMode === 'validityAsc' ? remA - remB : remB - remA;
    }
  });

  const allActiveCount = clients.filter((c) => c.is_active).length;
  const activeSubCount = clients.filter((c) => c.is_active && getSubStatus(c) === 'active').length;
  const expiredSubCount = clients.filter((c) => c.is_active && (getSubStatus(c) === 'expired' || getSubStatus(c) === 'not_started')).length;
  const deactivatedCount = clients.filter((c) => !c.is_active).length;

  return (
    <div style={{ animation: 'fadeIn 0.3s ease' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 900, color: 'var(--color-text)', fontFamily: 'Georgia, serif', margin: 0 }}>Clients</h1>
          <p style={{ fontSize: 12, color: 'var(--color-text-light)', margin: '2px 0 0' }}>{activeSubCount} active / {allActiveCount} total active</p>
        </div>
        <Button onClick={() => setShowAddForm((p) => !p)}>
          {showAddForm ? '✕ Cancel' : '+ Add Client'}
        </Button>
      </div>

      {/* Add Client Form */}
      {showAddForm && (
        <div style={{
          background: 'white', border: '1.5px solid #A8D4A8',
          borderRadius: 20, padding: 20, marginBottom: 20,
          animation: 'slideUp 0.25s ease',
        }}>
          <h3 style={{ fontSize: 14, fontWeight: 800, color: 'var(--color-primary)', margin: '0 0 16px' }}>Register New Client</h3>
          {error && <div style={errorStyle}>{error}</div>}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12 }}>
            {[
              { label: 'Full Name *', key: 'name', placeholder: 'e.g. Ramesh Kumar' },
              { label: 'Phone Number *', key: 'phone_number', placeholder: 'e.g. 8667670695' },
              { label: 'Location / Area', key: 'location', placeholder: 'e.g. Anna Nagar' },
              { label: 'Password *', key: 'password', placeholder: 'Initial password' },
              { label: 'Delivery Note', key: 'delivery_note', placeholder: 'e.g. Gate 2, ring bell' },
            ].map(({ label, key, placeholder }) => (
              <div key={key} style={key === 'delivery_note' ? { gridColumn: '1 / -1' } : undefined}>
                <label style={fieldLabel}>{label}</label>
                <input
                  placeholder={placeholder}
                  value={(form as any)[key]}
                  onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
                  style={inputSm}
                />
              </div>
            ))}
            <div style={{ gridColumn: '1 / -1' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={fieldLabel}>Location / Area *</label>
                  <input placeholder="e.g. Anna Nagar" value={form.location} onChange={(e) => setForm(f => ({ ...f, location: e.target.value }))} style={inputSm} />
                </div>
                <div>
                  <label style={fieldLabel}>Pincode *</label>
                  <input placeholder="e.g. 600040" value={form.pincode} onChange={(e) => setForm(f => ({ ...f, pincode: e.target.value }))} style={inputSm} required />
                </div>
              </div>
              <div style={{ marginTop: 12 }}>
                <label style={fieldLabel}>Google Maps Link (Optional)</label>
                <input placeholder="e.g. https://maps.app.goo.gl/..." value={form.gmap_link} onChange={(e) => setForm(f => ({ ...f, gmap_link: e.target.value }))} style={inputSm} />
              </div>
            </div>
            <div style={{ gridColumn: '1 / -1', marginTop: 8 }}>
              <label style={fieldLabel}>Diet Preference</label>
              <div style={{ display: 'flex', gap: 12 }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, cursor: 'pointer' }}>
                  <input type="radio" name="diet_preference" value="Veg" checked={form.diet_preference === 'Veg'} onChange={(e) => setForm(f => ({ ...f, diet_preference: 'Veg' }))} />
                  Veg 🟢
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, cursor: 'pointer' }}>
                  <input type="radio" name="diet_preference" value="Non-Veg" checked={form.diet_preference === 'Non-Veg'} onChange={(e) => setForm(f => ({ ...f, diet_preference: 'Non-Veg' }))} />
                  Non-Veg 🔴
                </label>
              </div>
            </div>
          </div>

          {/* Subscription */}
          <div style={{ background: 'var(--color-primary-light)', borderRadius: 14, padding: 14, marginTop: 14 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--color-primary)', textTransform: 'uppercase', marginBottom: 10 }}>Subscription Details</div>
            
            {/* Package Selector */}
            <div style={{ marginBottom: 12 }}>
              <label style={fieldLabel}>Select Predefined Package</label>
              <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 6 }}>
                <button
                  type="button"
                  onClick={() => handleSelectPackage({ id: 'custom', name: 'Custom Plan', days: '', price: '', meal_type: '', diet_type: '' })}
                  style={{
                    padding: '8px 12px', background: selectedPkgId === 'custom' ? 'var(--color-primary)' : 'white',
                    color: selectedPkgId === 'custom' ? 'white' : 'var(--color-text-muted)',
                    border: `1.5px solid ${selectedPkgId === 'custom' ? 'var(--color-primary)' : 'var(--color-border)'}`,
                    borderRadius: 10, fontSize: 11, fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap',
                    fontFamily: 'Outfit, sans-serif',
                  }}
                >
                  ⚙️ Custom Plan
                </button>
                {packages.map((pkg) => {
                  const isSel = selectedPkgId === pkg.id;
                  return (
                    <button
                      key={pkg.id}
                      type="button"
                      onClick={() => handleSelectPackage(pkg)}
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

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 10 }}>
              <div>
                <label style={fieldLabel}>Amount (₹)</label>
                <input
                  type="number"
                  placeholder="2500"
                  disabled={selectedPkgId !== 'custom'}
                  value={form.sub_amount}
                  onChange={(e) => setForm((f) => ({ ...f, sub_amount: e.target.value }))}
                  style={inputSm}
                />
              </div>
              <div>
                <label style={fieldLabel}>Start Date</label>
                <input
                  type="date"
                  value={form.sub_start}
                  onChange={(e) => handleStartDateChange(e.target.value)}
                  style={inputSm}
                />
              </div>
              <div>
                <label style={fieldLabel}>End Date</label>
                <input
                  type="date"
                  disabled={selectedPkgId !== 'custom'}
                  value={form.sub_end}
                  onChange={(e) => setForm((f) => ({ ...f, sub_end: e.target.value }))}
                  style={inputSm}
                />
              </div>
            </div>
            {form.sub_start && form.sub_end && (
              <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--color-primary)', marginTop: 8 }}>
                {countServiceDays(new Date(form.sub_start), new Date(form.sub_end))} service days
              </div>
            )}

            {/* Checkboxes for meal subscription */}
            <div style={{ display: 'flex', gap: 16, marginTop: 12, flexWrap: 'wrap' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 600, color: 'var(--color-text)', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={form.subscribe_breakfast}
                  onChange={(e) => setForm((f) => ({ ...f, subscribe_breakfast: e.target.checked }))}
                />
                Subscribe Breakfast 🍳
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 600, color: 'var(--color-text)', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={form.subscribe_lunch}
                  onChange={(e) => setForm((f) => ({ ...f, subscribe_lunch: e.target.checked }))}
                />
                Subscribe Lunch 🍱
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 600, color: 'var(--color-text)', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={form.subscribe_dinner}
                  onChange={(e) => setForm((f) => ({ ...f, subscribe_dinner: e.target.checked }))}
                />
                Subscribe Dinner 🌙
              </label>
            </div>
          </div>

          <div className="mobile-sticky-actions" style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 14 }}>
            <Button variant="ghost" onClick={() => setShowAddForm(false)}>Cancel</Button>
            <Button loading={saving} onClick={addClient}>Register Client</Button>
          </div>
        </div>
      )}

      <div style={{ display: 'flex', gap: 12, marginBottom: 16, flexWrap: 'wrap', alignItems: 'center' }}>
        <input
          placeholder="🔍 Search by name, location or pincode…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ ...inputSm, flex: '1 1 200px' }}
        />
        <select 
          value={mealFilter}
          onChange={(e) => setMealFilter(e.target.value as any)}
          style={{ ...inputSm, cursor: 'pointer', background: 'white', flexShrink: 0 }}
        >
            <option value="all">All Meals</option>
            <option value="breakfast">Breakfast</option>
            <option value="lunch">Lunch</option>
            <option value="dinner">Dinner</option>
          </select>
        <select 
          value={sortMode}
          onChange={(e) => setSortMode(e.target.value as any)}
          style={{ ...inputSm, cursor: 'pointer', background: 'white', flexShrink: 0 }}
        >
            <option value="name">Sort: Name</option>
            <option value="validityAsc">Sort: Expiring First</option>
            <option value="validityDesc">Sort: Most Days Left</option>
          </select>
        <div style={{ display: 'flex', border: '1.5px solid var(--color-border)', borderRadius: 10, overflow: 'hidden', background: 'white', flexShrink: 0 }}>
            <button
              onClick={() => handleSetViewMode('grid')}
            style={{
              padding: '0 14px',
              border: 'none',
              background: viewMode === 'grid' ? 'var(--color-primary-light)' : 'white',
              color: viewMode === 'grid' ? 'var(--color-primary)' : 'var(--color-text-muted)',
              fontWeight: 700,
              fontSize: 12,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              fontFamily: 'Outfit, sans-serif',
              transition: 'all 0.15s ease',
            }}
          >
            🎴 Cards
          </button>
          <button
            onClick={() => handleSetViewMode('list')}
            style={{
              padding: '0 14px',
              border: 'none',
              background: viewMode === 'list' ? 'var(--color-primary-light)' : 'white',
              color: viewMode === 'list' ? 'var(--color-primary)' : 'var(--color-text-muted)',
              fontWeight: 700,
              fontSize: 12,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              borderLeft: '1.5px solid var(--color-border)',
              gap: 6,
              fontFamily: 'Outfit, sans-serif',
              transition: 'all 0.15s ease',
            }}
          >
            📝 List
          </button>
        </div>
      </div>

      {/* Filter Tabs */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 16, overflowX: 'auto', paddingBottom: 6 }}>
        {[
          { id: 'all', label: 'All Active Profiles', count: allActiveCount, icon: '👥' },
          { id: 'active_sub', label: 'Active Subscriptions', count: activeSubCount, icon: '🟢' },
          { id: 'expired_sub', label: 'Expired/No Sub', count: expiredSubCount, icon: '🔴' },
          { id: 'expiring_soon', label: 'Expiring Soon (≤3 days)', count: clients.filter(c => c.is_active && getSubStatus(c) === 'active' && remainingDays(c) <= 3).length, icon: '⏳' },
          { id: 'deactivated', label: 'Deactivated', count: deactivatedCount, icon: '🚫' },
        ].map((tab) => {
          const isSel = statusFilter === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setStatusFilter(tab.id as any)}
              style={{
                padding: '8px 14px',
                background: isSel ? 'var(--color-primary)' : 'white',
                color: isSel ? 'white' : 'var(--color-text-muted)',
                border: `1.5px solid ${isSel ? 'var(--color-primary)' : 'var(--color-border)'}`,
                borderRadius: 10,
                fontSize: 11,
                fontWeight: 700,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                fontFamily: 'Outfit, sans-serif',
                whiteSpace: 'nowrap',
                transition: 'all 0.15s ease',
              }}
            >
              <span>{tab.icon}</span>
              {tab.label} ({tab.count})
            </button>
          );
        })}
      </div>

      {/* Client cards / List view */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: 40, color: 'var(--color-text-light)' }}>Loading…</div>
      ) : viewMode === 'list' ? (
        <div style={{ background: 'white', border: '1.5px solid var(--color-border)', borderRadius: 16, overflow: 'hidden' }}>
          <style>{`
            .table-row-hover:hover {
              background-color: var(--color-bg) !important;
            }
          `}</style>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: 700 }}>
              <thead>
                <tr style={{ background: 'var(--color-bg)', borderBottom: '1.5px solid var(--color-border)' }}>
                  <th style={{ ...thStyle, width: 50 }}>S.No</th>
                  <th style={thStyle}>Client Details</th>
                  <th style={thStyle}>Location</th>
                  <th style={thStyle}>Pincode</th>
                  <th style={thStyle}>Plan & Meals</th>
                  <th style={thStyle}>Status</th>
                  <th style={thStyle}>Validity</th>
                  <th style={{ ...thStyle, textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {sorted.map((c, index) => {
                  const status = getSubStatus(c);
                  const rem = remainingDays(c);
                  const isExpired = status === 'expired';
                  const adjustedDates = getAdjustedEndDates(c);
                  let maxEndDate: Date | null = c.end_date ? new Date(c.end_date) : null;
                  for (const d of Object.values(adjustedDates)) {
                    if (!maxEndDate || d > maxEndDate) maxEndDate = d;
                  }
                  
                  const meals = [
                    c.subscribe_breakfast === true ? 'Breakfast 🍳' : null,
                    c.subscribe_lunch !== false ? 'Lunch 🍱' : null,
                    c.subscribe_dinner !== false ? 'Dinner 🌙' : null,
                  ].filter(Boolean).join(' + ') || 'None';

                  return (
                    <tr key={c.id} style={{ borderBottom: '1px solid var(--color-border)', transition: 'background 0.15s ease' }} className="table-row-hover">
                      <td style={{ ...tdStyle, fontWeight: 700, color: 'var(--color-text-muted)', fontSize: 13, width: 50 }}>
                        {index + 1}
                      </td>
                      <td style={tdStyle}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <div style={{ fontWeight: 800, color: 'var(--color-text)', fontSize: 14 }}>{c.name}</div>
                          <span style={{ fontSize: 10 }}>{c.diet_preference === 'Non-Veg' ? '🔴' : '🟢'}</span>
                        </div>
                        <div style={{ fontSize: 11, color: 'var(--color-text-muted)', marginTop: 2 }}>📞 {c.phone_number || '—'}</div>
                      </td>
                      <td style={{ ...tdStyle, color: 'var(--color-text-muted)', fontSize: 13 }}>
                        {c.location || '—'}
                      </td>
                      <td style={{ ...tdStyle, color: 'var(--color-text-muted)', fontSize: 13 }}>
                        {c.pincode || '—'}
                      </td>
                      <td style={tdStyle}>
                        <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--color-text)' }}>
                          {c.sub_amount ? `₹${Number(c.sub_amount).toLocaleString('en-IN')}` : '—'}
                        </div>
                        <div style={{ fontSize: 11, color: 'var(--color-text-light)', marginTop: 2 }}>{meals}</div>
                      </td>
                      <td style={tdStyle}>
                        <Badge variant={status === 'active' ? 'active' : status === 'not_started' ? 'not_started' : 'expired'}>
                          {status === 'active' ? 'Active' : status === 'not_started' ? 'Not Started' : 'Expired'}
                        </Badge>
                      </td>
                      <td style={tdStyle}>
                        {isExpired ? (
                          <div style={{ fontSize: 11, color: 'var(--color-error)', fontWeight: 600 }}>
                            {maxEndDate ? `Ended ${maxEndDate.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}` : 'No sub'}
                          </div>
                        ) : (
                          <>
                            <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--color-primary)' }}>{rem} days left</div>
                            <div style={{ fontSize: 10, color: 'var(--color-text-light)', marginTop: 2 }}>
                              Ends {maxEndDate ? maxEndDate.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'}
                            </div>
                          </>
                        )}
                      </td>
                      <td style={{ ...tdStyle, textAlign: 'right' }}>
                        <Link
                          href={`/admin/clients/${c.id}`}
                          style={{
                            padding: '6px 12px',
                            background: 'var(--color-primary-light)',
                            color: 'var(--color-primary)',
                            borderRadius: 8,
                            fontWeight: 700,
                            fontSize: 11,
                            textDecoration: 'none',
                            display: 'inline-block',
                            fontFamily: 'Outfit, sans-serif',
                            transition: 'all 0.15s ease',
                          }}
                        >
                          Manage Client →
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 12 }}>
          {sorted.map((c) => {
            const status = getSubStatus(c);
            const rem = remainingDays(c);
            const isExpired = status === 'expired';
            const adjustedDates = getAdjustedEndDates(c);
            let maxEndDate: Date | null = c.end_date ? new Date(c.end_date) : null;
            for (const d of Object.values(adjustedDates)) {
              if (!maxEndDate || d > maxEndDate) maxEndDate = d;
            }

            return (
              <div key={c.id} style={{
                background: 'white',
                border: `1.5px solid ${isExpired ? '#FECACA' : 'var(--color-border)'}`,
                borderRadius: 16, padding: 16, position: 'relative',
                overflow: 'hidden',
              }}>
                {/* Top stripe */}
                <div style={{
                  position: 'absolute', top: 0, left: 0, right: 0,
                  height: 3,
                  background: isExpired ? 'var(--color-error)' : 'var(--color-primary)',
                  borderRadius: '16px 16px 0 0',
                }} />
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 10 }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <div style={{ fontSize: 15, fontWeight: 800, color: 'var(--color-text)' }}>{c.name}</div>
                      <span style={{ fontSize: 10 }}>{c.diet_preference === 'Non-Veg' ? '🔴' : '🟢'}</span>
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--color-text-light)' }}>📞 {c.phone_number || '—'}</div>
                    <div style={{ fontSize: 11, color: 'var(--color-text-light)', marginTop: 2 }}>📍 {c.location || '—'}</div>
                  </div>
                  <Badge variant={status === 'active' ? 'active' : status === 'not_started' ? 'not_started' : 'expired'}>
                    {status === 'active' ? 'Active' : status === 'not_started' ? 'Not Started' : 'Expired'}
                  </Badge>
                </div>

                {isExpired ? (
                  <div style={{ background: '#FEF2F2', borderRadius: 10, padding: '8px 12px', fontSize: 11, color: '#DC2626', fontWeight: 600 }}>
                    {maxEndDate ? `Subscription ended ${maxEndDate.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}` : 'No active subscription'}
                  </div>
                ) : (
                  <div style={{ background: 'var(--color-bg)', borderRadius: 10, padding: '8px 12px', fontSize: 11 }}>
                    {[
                      { label: 'Subscription', value: c.sub_amount ? `₹${Number(c.sub_amount).toLocaleString('en-IN')} / month` : '—' },
                      { label: 'Subscribed Meals', value: [
                        c.subscribe_breakfast === true ? 'Breakfast 🍳' : null,
                        c.subscribe_lunch !== false ? 'Lunch 🍱' : null,
                        c.subscribe_dinner !== false ? 'Dinner 🌙' : null,
                      ].filter(Boolean).join(' + ') || 'None' },
                      { label: 'Expires',       value: maxEndDate ? maxEndDate.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '—' },
                      { label: 'Days left',     value: `${rem} days` },
                    ].map(({ label, value }) => (
                      <div key={label} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
                        <span style={{ color: 'var(--color-text-light)' }}>{label}</span>
                        <span style={{ fontWeight: 700, color: label === 'Days left' ? 'var(--color-primary)' : 'var(--color-text)' }}>{value}</span>
                      </div>
                    ))}
                  </div>
                )}

                <div style={{ marginTop: 12 }}>
                  <Link
                    href={`/admin/clients/${c.id}`}
                    style={{
                      display: 'block',
                      textAlign: 'center',
                      padding: '8px 10px',
                      background: 'var(--color-primary-light)',
                      color: 'var(--color-primary)',
                      borderRadius: 8,
                      fontWeight: 700,
                      fontSize: 11,
                      textDecoration: 'none',
                      fontFamily: 'Outfit, sans-serif',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    Manage Client →
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {filtered.length === 0 && !loading && (
        <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--color-text-light)', fontSize: 14 }}>
          No clients found.
        </div>
      )}
    </div>
  );
}

// Styling Constants
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
const thStyle: React.CSSProperties = {
  padding: '12px 16px',
  fontSize: 10,
  fontWeight: 700,
  color: 'var(--color-text-light)',
  textTransform: 'uppercase',
  letterSpacing: '0.06em',
};
const tdStyle: React.CSSProperties = {
  padding: '12px 16px',
  verticalAlign: 'middle',
};
