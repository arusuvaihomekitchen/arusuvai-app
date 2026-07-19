'use client';

import React, { useEffect, useState, useCallback } from 'react';
import Button from '@/components/ui/Button';
import { swrFetch, invalidateCache } from '@/lib/clientCache';

type MenuType = 'veg' | 'non_veg' | 'premium_non_veg';
type MealType = 'Lunch' | 'Dinner';

interface MenuRow {
  id: number;
  menu_type: MenuType;
  day_of_week: string;
  meal_type: MealType;
  items: string[];
  is_veg_override: boolean;
}

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export default function AdminWeeklyMenuPage() {
  const [rows, setRows] = useState<MenuRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [menuType, setMenuType] = useState<MenuType>('veg');
  const [mealType, setMealType] = useState<MealType>('Lunch');
  const [dateRange, setDateRange] = useState('This Week');
  const [saving, setSaving] = useState<string | null>(null); // which day is saving
  const [saved, setSaved] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  // Local edits: key = `${menuType}-${day}-${mealType}`, value = comma-joined items string
  const [edits, setEdits] = useState<Record<string, string>>({});
  const [vegOverrides, setVegOverrides] = useState<Record<string, boolean>>({});

  const load = useCallback((bypass = false) => {
    setLoading(true);
    swrFetch('/api/admin/settings', (json) => {
      if (json.data?.menu_date_range) {
        setDateRange(json.data.menu_date_range);
      }
    }, { bypassCache: bypass });

    return swrFetch('/api/admin/weekly-menu', (json) => {
      setRows(json.data ?? []);
      setLoading(false);
    }, { bypassCache: bypass });
  }, []);

  useEffect(() => {
    const unsub = load();
    return unsub;
  }, [load]);

  function getItems(day: string): string {
    const key = `${menuType}-${day}-${mealType}`;
    if (key in edits) return edits[key];
    const row = rows.find((r) => r.menu_type === menuType && r.day_of_week === day && r.meal_type === mealType);
    return row ? row.items.join(', ') : '';
  }

  function getVegOverride(day: string): boolean {
    const key = `${menuType}-${day}-${mealType}`;
    if (key in vegOverrides) return vegOverrides[key];
    const row = rows.find((r) => r.menu_type === menuType && r.day_of_week === day && r.meal_type === mealType);
    return row ? row.is_veg_override : false;
  }

  function handleEdit(day: string, value: string) {
    const key = `${menuType}-${day}-${mealType}`;
    setEdits((prev) => ({ ...prev, [key]: value }));
  }

  function handleVegOverride(day: string, value: boolean) {
    const key = `${menuType}-${day}-${mealType}`;
    setVegOverrides((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSave(day: string) {
    const key = `${menuType}-${day}-${mealType}`;
    const value = edits[key] ?? getItems(day);
    const items = value.split(',').map((s) => s.trim()).filter(Boolean);
    const isVegOverride = getVegOverride(day);

    setSaving(day);
    setError(null);
    try {
      const res = await fetch('/api/admin/weekly-menu', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ menu_type: menuType, day_of_week: day, meal_type: mealType, items, is_veg_override: isVegOverride }),
      });
      const data = await res.json();
      if (data.success) {
        invalidateCache('/api/admin/weekly-menu');
        invalidateCache('/api/public/menu');
        load(true);
        setSaved(day);
        setTimeout(() => setSaved(null), 2000);
      } else {
        setError(data.error ?? 'Save failed');
      }
    } finally {
      setSaving(null);
    }
  }

  async function handleSaveAll() {
    setSaving('all');
    setError(null);
    for (const day of DAYS) {
      const key = `${menuType}-${day}-${mealType}`;
      const value = edits[key];
      const isVegOverride = vegOverrides[key] ?? getVegOverride(day);
      if (value !== undefined || key in vegOverrides) {
        const currentItems = value ?? getItems(day);
        const items = currentItems.split(',').map((s) => s.trim()).filter(Boolean);
        await fetch('/api/admin/weekly-menu', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ menu_type: menuType, day_of_week: day, meal_type: mealType, items, is_veg_override: isVegOverride }),
        });
      }
    }
    invalidateCache('/api/admin/weekly-menu');
    invalidateCache('/api/public/menu');
    load(true);
    setSaving(null);
    setSaved('all');
    setTimeout(() => setSaved(null), 2000);
  }

  async function handleSaveDate() {
    setSaving('date');
    setError(null);
    try {
      const res = await fetch('/api/admin/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ settings: { menu_date_range: dateRange } }),
      });
      const data = await res.json();
      if (data.success) {
        invalidateCache('/api/admin/settings');
        setSaved('date');
        setTimeout(() => setSaved(null), 2000);
      } else {
        setError(data.error ?? 'Failed to save date range');
      }
    } catch (e) {
      setError('An error occurred');
    } finally {
      setSaving(null);
    }
  }

  const dayIcons: Record<string, string> = {
    Monday: '🌅', Tuesday: '☀️', Wednesday: '🌤️', Thursday: '⛅', Friday: '🌟', Saturday: '🎉',
  };

  const tabStyle = (active: boolean, color?: string): React.CSSProperties => ({
    padding: '9px 18px',
    background: active ? (color ?? 'var(--color-primary)') : 'transparent',
    color: active ? 'white' : 'var(--color-text-muted)',
    border: 'none',
    borderRadius: 10,
    fontSize: 13,
    fontWeight: active ? 700 : 600,
    cursor: 'pointer',
    transition: 'all 0.15s ease',
  });

  return (
    <div style={{ animation: 'fadeIn 0.3s ease', maxWidth: 800, margin: '0 auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12, marginBottom: 20 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 900, color: 'var(--color-text)', fontFamily: 'Georgia, serif', margin: 0 }}>
            Weekly Menu
          </h1>
          <p style={{ fontSize: 12, color: 'var(--color-text-light)', margin: '3px 0 0' }}>
            Changes appear live on the public menu pages
          </p>
        </div>
        <Button loading={saving === 'all'} onClick={handleSaveAll}>
          {saved === 'all' ? '✓ All Saved!' : '💾 Save All Changes'}
        </Button>
      </div>

      {error && (
        <div style={{ background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 10, padding: '10px 14px', fontSize: 13, color: '#DC2626', marginBottom: 16 }}>
          ⚠ {error}
        </div>
      )}

      {/* Date Range Settings */}
      <div style={{ background: 'white', border: '1.5px solid var(--color-border)', borderRadius: 14, padding: '16px 18px', marginBottom: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
          <div>
            <h3 style={{ margin: 0, fontSize: 14, color: 'var(--color-text)' }}>Menu Display Date Range</h3>
            <p style={{ margin: '2px 0 0', fontSize: 12, color: 'var(--color-text-light)' }}>
              Text shown on the public menu pages (e.g., &quot;This Week&quot; or &quot;July 15 - July 21&quot;).
            </p>
          </div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <input 
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
              style={{
                padding: '8px 12px', borderRadius: 8, border: '1.5px solid var(--color-border)', fontSize: 13, minWidth: 200
              }}
            />
            <Button loading={saving === 'date'} onClick={handleSaveDate}>
              {saved === 'date' ? '✓ Saved' : 'Save'}
            </Button>
          </div>
        </div>
      </div>

      {/* Type + Meal tabs */}
      <div style={{ background: 'white', border: '1.5px solid var(--color-border)', borderRadius: 14, padding: 6, marginBottom: 16, display: 'flex', gap: 4, flexWrap: 'wrap' }}>
        <button style={tabStyle(menuType === 'veg', '#2C5E2E')} onClick={() => setMenuType('veg')}>
          🌿 Veg
        </button>
        <button style={tabStyle(menuType === 'non_veg', '#C05621')} onClick={() => setMenuType('non_veg')}>
          🍗 Non-Veg
        </button>
        <button style={tabStyle(menuType === 'premium_non_veg', '#9A3412')} onClick={() => setMenuType('premium_non_veg')}>
          👑 Premium Non-Veg
        </button>
        <div style={{ flex: 1, minWidth: 20 }} />
        <button style={tabStyle(mealType === 'Lunch', '#2C5E2E')} onClick={() => setMealType('Lunch')}>
          ☀️ Lunch
        </button>
        <button style={tabStyle(mealType === 'Dinner', '#5B3E1E')} onClick={() => setMealType('Dinner')}>
          🌙 Dinner
        </button>
      </div>

      {/* Info banner */}
      <div style={{
        background: '#F0F7EE', border: '1px solid #A8D4A8',
        borderRadius: 10, padding: '10px 14px',
        fontSize: 12, color: '#2C5E2E', fontWeight: 600,
        marginBottom: 20,
      }}>
        💡 Enter dish names separated by commas. Press &quot;Save&quot; per day or &quot;Save All&quot; at once.
      </div>

      {/* Day cards */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: 40, color: 'var(--color-text-light)' }}>Loading…</div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {DAYS.map((day) => {
            const currentVal = getItems(day);
            const isSavingThis = saving === day;
            const isSavedThis = saved === day;
            return (
              <div key={day} style={{
                background: 'white',
                border: '1.5px solid var(--color-border)',
                borderRadius: 14,
                padding: '16px 18px',
                transition: 'box-shadow 0.15s ease',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10, flexWrap: 'wrap' }}>
                  <div style={{
                    display: 'inline-flex', alignItems: 'center', gap: 6,
                    background: menuType === 'veg' ? '#2C5E2E' : (menuType === 'premium_non_veg' ? '#9A3412' : '#C05621'),
                    color: 'white',
                    padding: '4px 12px',
                    borderRadius: 8,
                    fontSize: 12, fontWeight: 800,
                  }}>
                    {dayIcons[day]} {day}
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--color-text-light)', fontWeight: 600 }}>
                    {mealType} • {menuType === 'veg' ? 'Vegetarian' : (menuType === 'premium_non_veg' ? 'Premium Non-Veg' : 'Non-Vegetarian')}
                  </div>
                </div>

                {menuType !== 'veg' && (
                  <div style={{ display: 'flex', gap: 12, marginBottom: 10, flexWrap: 'wrap' }}>
                     <label style={{ fontSize: 12, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 4, cursor: 'pointer' }}>
                       <input type="radio" checked={!getVegOverride(day)} onChange={() => handleVegOverride(day, false)} />
                       🍗 Non-Veg Meal
                     </label>
                     <label style={{ fontSize: 12, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 4, cursor: 'pointer' }}>
                       <input type="radio" checked={getVegOverride(day)} onChange={() => handleVegOverride(day, true)} />
                       🌿 Veg Meal
                     </label>
                  </div>
                )}

                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  <input
                    value={currentVal}
                    onChange={(e) => handleEdit(day, e.target.value)}
                    placeholder="e.g. Rice, Sambar, Poriyal, Rasam, Buttermilk, Appalam"
                    style={{
                      flex: '1 1 200px',
                      padding: '10px 14px',
                      border: '1.5px solid var(--color-border)',
                      borderRadius: 10,
                      fontSize: 13,
                      fontWeight: 500,
                      color: 'var(--color-text)',
                      background: 'var(--color-bg)',
                      transition: 'border-color 0.15s ease',
                    }}
                    onFocus={(e) => (e.target.style.borderColor = '#2C5E2E')}
                    onBlur={(e) => (e.target.style.borderColor = 'var(--color-border)')}
                  />
                  <button
                    onClick={() => handleSave(day)}
                    disabled={isSavingThis}
                    style={{
                      padding: '10px 16px',
                      background: isSavedThis ? '#22C55E' : '#2C5E2E',
                      color: 'white',
                      border: 'none',
                      borderRadius: 10,
                      fontSize: 12, fontWeight: 700,
                      cursor: 'pointer',
                      whiteSpace: 'nowrap',
                      transition: 'background 0.2s ease',
                      minWidth: 80,
                    }}
                  >
                    {isSavingThis ? '…' : isSavedThis ? '✓ Saved' : 'Save'}
                  </button>
                </div>

                {/* Preview pills */}
                {currentVal && (
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 10 }}>
                    {currentVal.split(',').map((s) => s.trim()).filter(Boolean).map((item, i) => (
                      <span key={i} style={{
                        background: menuType === 'veg' ? '#EBF5EB' : '#FEF3DC',
                        color: menuType === 'veg' ? '#2C5E2E' : (menuType === 'premium_non_veg' ? '#9A3412' : '#C05621'),
                        padding: '3px 10px',
                        borderRadius: 20,
                        fontSize: 11, fontWeight: 600,
                        border: menuType === 'veg' ? '1px solid #A8D4A8' : '1px solid #FBBF24',
                      }}>
                        {item}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
