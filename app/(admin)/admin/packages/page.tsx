'use client';

import React, { useEffect, useState } from 'react';
import Button from '@/components/ui/Button';
import { useTranslation } from '@/i18n';
import Badge from '@/components/ui/Badge';
import CustomConfirmModal from '@/components/ui/CustomConfirmModal';
import { swrFetch, invalidateCache } from '@/lib/clientCache';

export default function SubscriptionPackagesPage() {
  const { t } = useTranslation();
  const [packages, setPackages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [form, setForm] = useState({
    name: '',
    days: '',
    diet_type: 'Veg',
    subscribe_breakfast: false,
    subscribe_lunch: true,
    subscribe_dinner: false,
    price: '',
    is_public: false,
    features: '',
    whatsapp_number: '918667670695',
    sort_order: '0',
  });

  const loadPackages = (bypassCache = false) => {
    setLoading(true);
    const unsub = swrFetch('/api/admin/packages', (json) => {
      setPackages(json.data ?? []);
      setLoading(false);
    }, { bypassCache });
    return unsub;
  };

  useEffect(() => {
    const unsub = loadPackages();
    return unsub;
  }, []);

  const startEdit = (pkg: any) => {
    setEditingId(pkg.id);
    const meals = pkg.meal_type || '';
    setForm({
      name: pkg.name,
      days: String(pkg.days),
      diet_type: pkg.diet_type,
      subscribe_breakfast: meals.includes('Breakfast'),
      subscribe_lunch: meals.includes('Lunch'),
      subscribe_dinner: meals.includes('Dinner'),
      price: String(pkg.price),
      is_public: pkg.is_public || false,
      features: Array.isArray(pkg.features) ? pkg.features.join('\n') : '',
      whatsapp_number: pkg.whatsapp_number || '918667670695',
      sort_order: String(pkg.sort_order || 0),
    });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setForm({
      name: '',
      days: '',
      diet_type: 'Veg',
      subscribe_breakfast: false,
      subscribe_lunch: true,
      subscribe_dinner: false,
      price: '',
      is_public: false,
      features: '',
      whatsapp_number: '918667670695',
      sort_order: '0',
    });
  };

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError('');

    const mealTypes: string[] = [];
    if (form.subscribe_breakfast) mealTypes.push('Breakfast');
    if (form.subscribe_lunch) mealTypes.push('Lunch');
    if (form.subscribe_dinner) mealTypes.push('Dinner');

    if (mealTypes.length === 0) {
      setError('Please select at least one meal category');
      setSaving(false);
      return;
    }

    try {
      const url = editingId ? `/api/admin/packages/${editingId}` : '/api/admin/packages';
      const method = editingId ? 'PATCH' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name.trim(),
          days: parseInt(form.days),
          meal_type: mealTypes.join(' + '),
          diet_type: form.diet_type,
          price: parseFloat(form.price),
          is_public: form.is_public,
          features: form.features.split('\n').map(s => s.trim()).filter(Boolean),
          whatsapp_number: form.whatsapp_number.trim(),
          sort_order: parseInt(form.sort_order) || 0,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setForm({
          name: '',
          days: '',
          diet_type: 'Veg',
          subscribe_breakfast: false,
          subscribe_lunch: true,
          subscribe_dinner: false,
          price: '',
          is_public: false,
          features: '',
          whatsapp_number: '918667670695',
          sort_order: '0',
        });
        invalidateCache('/api/admin/packages');
        setEditingId(null);
        loadPackages(true);
      } else {
        setError(data.error ?? `Failed to ${editingId ? 'update' : 'create'} package`);
      }
    } catch {
      setError('Server error');
    } finally {
      setSaving(false);
    }
  }

  async function handleConfirmDelete() {
    if (!confirmDeleteId) return;
    setError('');
    try {
      const res = await fetch(`/api/admin/packages/${confirmDeleteId}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        invalidateCache('/api/admin/packages');
        loadPackages(true);
      } else {
        setError(data.error ?? 'Failed to delete package');
      }
    } catch {
      setError('Server error');
    } finally {
      setConfirmDeleteId(null);
    }
  }

  async function handleDelete(id: string) {
    setConfirmDeleteId(id);
  }

  return (
    <div style={{ animation: 'fadeIn 0.3s ease' }}>
      <div style={{ marginBottom: 20 }}>
        <h1 style={{ fontSize: 22, fontWeight: 900, color: 'var(--color-text)', fontFamily: 'Georgia, serif', margin: 0 }}>
          {t('pkg.title')}
        </h1>
        <p style={{ fontSize: 12, color: 'var(--color-text-light)', margin: '2px 0 0' }}>
          {t('pkg.subtitle')}
        </p>
      </div>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 24, alignItems: 'flex-start' }}>
        {/* Create form */}
        <div style={{
          background: 'white', border: '1.5px solid var(--color-border)',
          borderRadius: 20, padding: 20, flex: '1 1 300px', minWidth: 0,
        }}>
          <h3 style={{ fontSize: 14, fontWeight: 800, color: 'var(--color-primary)', margin: '0 0 16px', borderBottom: '1px solid var(--color-border)', paddingBottom: 10 }}>
            {editingId ? 'Edit Predefined Package' : t('pkg.create')}
          </h3>
          {error && (
            <div style={{
              background: '#FEF2F2', border: '1px solid #FECACA',
              borderRadius: 12, padding: '10px 14px', marginBottom: 14,
              fontSize: 13, fontWeight: 600, color: '#DC2626',
            }}>
              ⚠ {error}
            </div>
          )}

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div>
              <label style={labelStyle}>{t('pkg.name')} *</label>
              <input
                required
                type="text"
                placeholder="e.g. Monthly Veg Lunch"
                value={form.name}
                onChange={(e) => setForm(f => ({ ...f, name: e.target.value }))}
                style={inputStyle}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 10 }}>
              <div>
                <label style={labelStyle}>{t('pkg.days')} *</label>
                <input
                  required
                  type="number"
                  min="1"
                  placeholder="e.g. 26"
                  value={form.days}
                  onChange={(e) => setForm(f => ({ ...f, days: e.target.value }))}
                  style={inputStyle}
                />
              </div>
              <div>
                <label style={labelStyle}>{t('pkg.price')} *</label>
                <input
                  required
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="e.g. 1500"
                  value={form.price}
                  onChange={(e) => setForm(f => ({ ...f, price: e.target.value }))}
                  style={inputStyle}
                />
              </div>
            </div>

            <div>
              <label style={labelStyle}>{t('pkg.dietType')}</label>
              <div style={{ display: 'flex', gap: 8 }}>
                {['Veg', 'Non-Veg'].map((type) => {
                  const active = form.diet_type === type;
                  return (
                    <button
                      key={type}
                      type="button"
                      onClick={() => setForm(f => ({ ...f, diet_type: type }))}
                      style={{
                        flex: 1, padding: '10px',
                        background: active ? 'var(--color-primary)' : 'var(--color-bg)',
                        color: active ? 'white' : 'var(--color-text-muted)',
                        border: `1.5px solid ${active ? 'var(--color-primary)' : 'var(--color-border)'}`,
                        borderRadius: 10, fontWeight: 700, fontSize: 12, cursor: 'pointer',
                        transition: 'all 0.15s ease',
                      }}
                    >
                      {type === 'Veg' ? '🟢 Veg' : '🔴 Non-Veg'}
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <label style={labelStyle}>{t('pkg.mealCategory')}</label>
              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                {[
                  { key: 'subscribe_breakfast', label: t('pkg.breakfast') },
                  { key: 'subscribe_lunch', label: t('pkg.lunch') },
                  { key: 'subscribe_dinner', label: t('pkg.dinner') },
                ].map(({ key, label }) => (
                  <label key={key} style={{
                    display: 'flex', alignItems: 'center', gap: 6,
                    fontSize: 13, fontWeight: 600, color: 'var(--color-text)', cursor: 'pointer',
                  }}>
                    <input
                      type="checkbox"
                      checked={(form as any)[key]}
                      onChange={(e) => setForm(f => ({ ...f, [key]: e.target.checked }))}
                    />
                    {label}
                  </label>
                ))}
              </div>
            </div>

            <div style={{ marginTop: 8, padding: 12, background: 'var(--color-bg)', borderRadius: 10, border: '1.5px solid var(--color-border)' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 700, color: 'var(--color-text)', cursor: 'pointer', marginBottom: form.is_public ? 12 : 0 }}>
                <input
                  type="checkbox"
                  checked={form.is_public}
                  onChange={(e) => setForm(f => ({ ...f, is_public: e.target.checked }))}
                />
                Show on Subscription Page
              </label>
              
              {form.is_public && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  <div>
                    <label style={labelStyle}>Features (One per line)</label>
                    <textarea
                      placeholder="Freshly Cooked Daily&#10;Doorstep Delivery"
                      value={form.features}
                      onChange={(e) => setForm(f => ({ ...f, features: e.target.value }))}
                      style={{ ...inputStyle, minHeight: 80, resize: 'vertical' }}
                    />
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 10 }}>
                    <div>
                      <label style={labelStyle}>WhatsApp Number</label>
                      <input
                        type="text"
                        value={form.whatsapp_number}
                        onChange={(e) => setForm(f => ({ ...f, whatsapp_number: e.target.value }))}
                        style={inputStyle}
                      />
                    </div>
                    <div>
                      <label style={labelStyle}>Sort Order</label>
                      <input
                        type="number"
                        value={form.sort_order}
                        onChange={(e) => setForm(f => ({ ...f, sort_order: e.target.value }))}
                        style={inputStyle}
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
              {editingId && (
                <Button type="button" variant="ghost" onClick={cancelEdit} style={{ flex: 1 }}>
                  {t('common.cancel')}
                </Button>
              )}
              <Button type="submit" loading={saving} style={{ flex: 1 }}>
                {editingId ? 'Update Package' : t('pkg.submit')}
              </Button>
            </div>
          </form>
        </div>

        {/* Package list */}
        <div style={{ flex: '1 1 300px', minWidth: 0 }}>
          <h3 style={{ fontSize: 13, fontWeight: 700, color: 'var(--color-text-light)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 12 }}>
            {t('pkg.list')} ({packages.length})
          </h3>

          {loading ? (
            <div style={{ textAlign: 'center', padding: 30, color: 'var(--color-text-light)' }}>Loading…</div>
          ) : packages.length === 0 ? (
            <div style={{
              background: 'white', border: '1.5px dashed var(--color-border)',
              borderRadius: 20, padding: '40px 20px', textAlign: 'center', color: 'var(--color-text-light)',
            }}>
              No packages defined yet.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {packages.map((pkg) => (
                <div
                  key={pkg.id}
                  style={{
                    background: 'white', border: '1.5px solid var(--color-border)',
                    borderRadius: 16, padding: 14,
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12,
                  }}
                >
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ fontSize: 15, fontWeight: 800, color: 'var(--color-text)' }}>{pkg.name}</span>
                      <Badge variant={pkg.diet_type === 'Veg' ? 'active' : 'expired'}>
                        {pkg.diet_type === 'Veg' ? t('pkg.veg') : t('pkg.nonVeg')}
                      </Badge>
                      {pkg.is_public && (
                        <span style={{ fontSize: 10, fontWeight: 800, background: '#FEF3DC', color: '#B45309', padding: '2px 6px', borderRadius: 6, textTransform: 'uppercase' }}>
                          Public
                        </span>
                      )}
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--color-text-muted)', marginTop: 4 }}>
                      🕒 {pkg.days} days • 🍱 {pkg.meal_type}
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{ fontSize: 17, fontWeight: 900, color: 'var(--color-primary)' }}>
                      ₹{Number(pkg.price).toLocaleString('en-IN')}
                    </div>
                    <button
                      onClick={() => startEdit(pkg)}
                      style={{
                        background: 'none', border: 'none', color: 'var(--color-primary)',
                        fontSize: 16, cursor: 'pointer', padding: 4,
                      }}
                      title={t('common.edit')}
                    >
                      ✏️
                    </button>
                    <button
                      onClick={() => handleDelete(pkg.id)}
                      style={{
                        background: 'none', border: 'none', color: 'var(--color-error)',
                        fontSize: 16, cursor: 'pointer', padding: 4,
                      }}
                      title={t('common.delete')}
                    >
                      🗑️
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <CustomConfirmModal
        open={confirmDeleteId !== null}
        onClose={() => setConfirmDeleteId(null)}
        onConfirm={handleConfirmDelete}
        title="Delete Package"
        message="Are you sure you want to delete this subscription package? Existing clients already registered under this package will not be affected, but you won't be able to select it for new clients."
        confirmText="Delete"
        variant="danger"
      />
    </div>
  );
}

const labelStyle: React.CSSProperties = {
  display: 'block',
  fontSize: 11,
  fontWeight: 700,
  color: 'var(--color-text-muted)',
  textTransform: 'uppercase',
  letterSpacing: '0.08em',
  marginBottom: 6,
};

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '10px 14px',
  border: '1.5px solid var(--color-border)',
  borderRadius: 12,
  fontSize: 14,
  fontWeight: 600,
  color: 'var(--color-text)',
  background: 'var(--color-bg)',
  boxSizing: 'border-box',
  outline: 'none',
  fontFamily: 'Outfit, sans-serif',
};
