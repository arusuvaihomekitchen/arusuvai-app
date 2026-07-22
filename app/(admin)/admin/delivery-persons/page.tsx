'use client';

import React, { useEffect, useState } from 'react';
import Button from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';
import CustomConfirmModal from '@/components/ui/CustomConfirmModal';
import { swrFetch, invalidateCache } from '@/lib/clientCache';
import Link from 'next/link';

interface DeliveryPerson {
  id: string; name: string; phone_number: string;
  username: string; is_active: boolean; delivered_today: number;
}

export default function AdminDeliveryPersonsPage() {
  const [persons, setPersons] = useState<DeliveryPerson[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({ name: '', phone_number: '', password: '' });
  const [selectedPerson, setSelectedPerson] = useState<DeliveryPerson | null>(null);
  const [editForm, setEditForm] = useState({ name: '', phone_number: '', password: '' });
  const [confirmDeactivateId, setConfirmDeactivateId] = useState<string | null>(null);

  const load = (bypassCache = false) => {
    setLoading(true);
    const unsub = swrFetch('/api/admin/delivery-persons', (json) => {
      setPersons(json.data ?? []);
      setLoading(false);
    }, { bypassCache });
    return unsub;
  };

  useEffect(() => {
    const unsub = load();
    return unsub;
  }, []);

  async function add() {
    setSaving(true); setError('');
    try {
      const res = await fetch('/api/admin/delivery-persons', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (data.success) {
        invalidateCache('/api/admin/delivery-persons');
        setShowForm(false);
        setForm({ name: '', phone_number: '', password: '' });
        load(true);
      } else {
        setError(data.error ?? 'Failed to add');
      }
    } finally { setSaving(false); }
  }

  async function handleConfirmDeactivate() {
    if (!confirmDeactivateId) return;
    await fetch(`/api/admin/delivery-persons/${confirmDeactivateId}`, { method: 'DELETE' });
    invalidateCache('/api/admin/delivery-persons');
    setConfirmDeactivateId(null);
    load(true);
  }

  function remove(id: string) {
    setConfirmDeactivateId(id);
  }

  function startEdit(p: DeliveryPerson) {
    setSelectedPerson(p);
    setEditForm({
      name: p.name,
      phone_number: p.phone_number || '',
      password: '',
    });
    setShowEditModal(true);
  }

  async function edit() {
    if (!selectedPerson) return;
    setSaving(true); setError('');
    try {
      const res = await fetch(`/api/admin/delivery-persons/${selectedPerson.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editForm),
      });
      const data = await res.json();
      if (data.success) {
        invalidateCache('/api/admin/delivery-persons');
        setShowEditModal(false);
        setSelectedPerson(null);
        load(true);
      } else {
        setError(data.error ?? 'Failed to update');
      }
    } finally { setSaving(false); }
  }

  const COLORS = ['#2C5E2E', '#F5A623', '#3B82F6', '#8B5CF6', '#EF4444'];

  return (
    <div style={{ animation: 'fadeIn 0.3s ease', maxWidth: 700, margin: '0 auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 900, color: 'var(--color-text)', fontFamily: 'Georgia, serif', margin: 0 }}>Delivery Persons</h1>
          <p style={{ fontSize: 12, color: 'var(--color-text-light)', margin: '2px 0 0' }}>{persons.filter((p) => p.is_active).length} active</p>
        </div>
        <Button onClick={() => setShowForm((p) => !p)}>
          {showForm ? '✕ Cancel' : '+ Add Person'}
        </Button>
      </div>

      {/* Add Form */}
      {showForm && (
        <div style={{
          background: 'white', border: '1.5px solid #A8D4A8',
          borderRadius: 16, padding: 18, marginBottom: 20,
          animation: 'slideUp 0.25s ease',
        }}>
          <h3 style={{ fontSize: 13, fontWeight: 800, color: 'var(--color-primary)', margin: '0 0 14px' }}>Add Delivery Person</h3>
          {error && <div style={errorStyle}>{error}</div>}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 10, marginBottom: 14 }}>
            {[
              { label: 'Name *',     key: 'name',         placeholder: 'e.g. Murugan' },
              { label: 'Phone *',    key: 'phone_number', placeholder: 'e.g. 99001 23456' },
              { label: 'Password *', key: 'password',     placeholder: 'Initial password' },
            ].map(({ label, key, placeholder }) => (
              <div key={key}>
                <label style={fieldLabel}>{label}</label>
                <input
                  placeholder={placeholder}
                  value={(form as Record<string, string>)[key]}
                  onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
                  style={inputSm}
                />
              </div>
            ))}
          </div>
          <Button loading={saving} onClick={add}>Add →</Button>
        </div>
      )}

      {/* List */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: 40, color: 'var(--color-text-light)' }}>Loading…</div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {persons.filter((p) => p.is_active).map((p, idx) => (
            <div key={p.id} style={{
              background: 'white', border: '1.5px solid var(--color-border)',
              borderRadius: 14, padding: '14px 16px',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12,
              transition: 'box-shadow 0.15s ease',
            }}
              onMouseEnter={(e) => (e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.08)')}
              onMouseLeave={(e) => (e.currentTarget.style.boxShadow = 'none')}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{
                  width: 46, height: 46,
                  background: COLORS[idx % COLORS.length],
                  borderRadius: 12,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: 'white', fontWeight: 800, fontSize: 18,
                }}>
                  {p.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <div style={{ fontSize: 15, fontWeight: 800, color: 'var(--color-text)' }}>{p.name}</div>
                  <div style={{ fontSize: 12, color: 'var(--color-text-light)' }}>
                    📞 {p.phone_number || '—'}
                  </div>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                <div style={{ textAlign: 'right', marginRight: 6 }}>
                  <div style={{ fontFamily: 'Georgia, serif', fontSize: 22, fontWeight: 900, color: 'var(--color-primary)' }}>
                    {p.delivered_today ?? 0}
                  </div>
                  <div style={{ fontSize: 10, color: 'var(--color-text-light)', fontWeight: 600 }}>delivered today</div>
                </div>
                <Link
                  href={`/admin/delivery-persons/${p.id}`}
                  style={{
                    padding: '6px 12px', background: '#F0FDF4', color: '#16A34A',
                    border: '1px solid #BBF7D0', borderRadius: 8,
                    fontWeight: 700, fontSize: 11, cursor: 'pointer', textDecoration: 'none'
                  }}
                >
                  View Logs
                </Link>
                <button
                  onClick={() => startEdit(p)}
                  style={{
                    padding: '6px 10px', background: '#EFF6FF', color: '#3B82F6',
                    border: 'none', borderRadius: 8,
                    fontWeight: 700, fontSize: 11, cursor: 'pointer',
                  }}
                >
                  Edit
                </button>
                <button
                  onClick={() => remove(p.id)}
                  style={{
                    padding: '6px 10px', background: 'white', color: '#DC2626',
                    border: '1px solid #FECACA', borderRadius: 8,
                    fontWeight: 700, fontSize: 11, cursor: 'pointer',
                  }}
                >
                  Remove
                </button>
              </div>
            </div>
          ))}
          {persons.filter((p) => p.is_active).length === 0 && (
            <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--color-text-light)', fontSize: 14 }}>
              No delivery persons yet. Add one to get started.
            </div>
          )}
        </div>
      )}

      {/* Edit Modal */}
      <Modal open={showEditModal} onClose={() => { setShowEditModal(false); setError(''); }}>
        <h3 style={{ fontSize: 17, fontWeight: 800, color: 'var(--color-text)', marginBottom: 4 }}>Edit Delivery Person</h3>
        <p style={{ fontSize: 13, color: 'var(--color-text-muted)', marginBottom: 16 }}>For {selectedPerson?.name}</p>
        {error && <div style={errorStyle}>{error}</div>}
        {[
          { label: 'Name *', key: 'name', type: 'text', placeholder: 'Name' },
          { label: 'Phone *', key: 'phone_number', type: 'text', placeholder: 'Phone Number' },
          { label: 'Password (leave blank to keep current)', key: 'password', type: 'password', placeholder: 'New Password' },
        ].map(({ label, key, type, placeholder }) => (
          <div key={key} style={{ marginBottom: 12 }}>
            <label style={fieldLabel}>{label}</label>
            <input
              type={type}
              placeholder={placeholder}
              value={(editForm as Record<string, string>)[key]}
              onChange={(e) => setEditForm((f) => ({ ...f, [key]: e.target.value }))}
              style={{ ...inputSm, width: '100%' }}
            />
          </div>
        ))}
        <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
          <Button variant="ghost" fullWidth onClick={() => setShowEditModal(false)}>Cancel</Button>
          <Button loading={saving} fullWidth onClick={edit}>Save Changes</Button>
        </div>
      </Modal>

      <CustomConfirmModal
        open={confirmDeactivateId !== null}
        onClose={() => setConfirmDeactivateId(null)}
        onConfirm={handleConfirmDeactivate}
        title="Deactivate Delivery Person"
        message="Are you sure you want to deactivate this delivery person? They will no longer be able to log in or receive assignments."
        confirmText="Deactivate"
        variant="danger"
      />
    </div>
  );
}

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
