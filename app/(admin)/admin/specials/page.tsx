'use client';

import React, { useState, useEffect } from 'react';
import Button from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';
import Badge from '@/components/ui/Badge';
import type { TodaySpecial } from '@/types';

export default function AdminSpecialsPage() {
  const [specials, setSpecials] = useState<TodaySpecial[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  
  // Form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  async function loadSpecials() {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/specials');
      const json = await res.json();
      if (json.success) setSpecials(json.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadSpecials();
  }, []);

  function openAddModal() {
    setEditingId(null);
    setTitle('');
    setDescription('');
    setPrice('');
    setIsActive(true);
    setShowModal(true);
  }

  function openEditModal(special: TodaySpecial) {
    setEditingId(special.id);
    setTitle(special.title);
    setDescription(special.description || '');
    setPrice(special.price.toString());
    setIsActive(special.is_active);
    setShowModal(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    try {
      if (editingId) {
        await fetch(`/api/admin/specials/${editingId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ title, description, price: parseFloat(price), is_active: isActive })
        });
      } else {
        await fetch(`/api/admin/specials`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ title, description, price: parseFloat(price), is_active: isActive })
        });
      }
      setShowModal(false);
      loadSpecials();
    } catch (err) {
      console.error(err);
      alert('Failed to save special.');
    } finally {
      setSubmitting(false);
    }
  }

  async function toggleActive(id: string, current: boolean) {
    await fetch(`/api/admin/specials/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ is_active: !current })
    });
    loadSpecials();
  }

  async function handleDelete(id: string) {
    if (!confirm('Are you sure you want to delete this special?')) return;
    await fetch(`/api/admin/specials/${id}`, { method: 'DELETE' });
    loadSpecials();
  }

  return (
    <div style={{ maxWidth: 800, margin: '0 auto', paddingBottom: 60 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 800, color: 'var(--color-text)', marginBottom: 4 }}>🌟 Today's Specials</h1>
          <p style={{ fontSize: 13, color: 'var(--color-text-muted)' }}>Manage special items available for WhatsApp order.</p>
        </div>
        <Button onClick={openAddModal} variant="primary">+ Add Special</Button>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: 40, color: 'var(--color-text-light)' }}>Loading specials...</div>
      ) : specials.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 60, background: 'white', borderRadius: 16, border: '1px dashed var(--color-border)' }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>🍽️</div>
          <h3 style={{ fontSize: 16, fontWeight: 700, color: 'var(--color-text)' }}>No specials yet</h3>
          <p style={{ fontSize: 13, color: 'var(--color-text-light)', marginTop: 4 }}>Add a special item to display it on the public page.</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gap: 12 }}>
          {specials.map(s => (
            <div key={s.id} style={{
              background: 'white', border: '1px solid var(--color-border)', borderRadius: 12, padding: 16,
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              opacity: s.is_active ? 1 : 0.6
            }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                  <span style={{ fontSize: 16, fontWeight: 800, color: 'var(--color-text)' }}>{s.title}</span>
                  {s.is_active ? <Badge variant="delivered">Active</Badge> : <Badge variant="skipped">Inactive</Badge>}
                </div>
                <div style={{ fontSize: 13, color: 'var(--color-text-muted)', marginBottom: 6 }}>{s.description}</div>
                <div style={{ fontSize: 14, fontWeight: 800, color: 'var(--color-primary)' }}>₹{s.price}</div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexDirection: 'column' }}>
                <button 
                  onClick={() => toggleActive(s.id, s.is_active)}
                  style={{ fontSize: 11, fontWeight: 700, padding: '6px 12px', borderRadius: 6, cursor: 'pointer', border: '1px solid var(--color-border)', background: 'var(--color-bg)' }}
                >
                  {s.is_active ? 'Hide' : 'Show'}
                </button>
                <div style={{ display: 'flex', gap: 4 }}>
                  <button onClick={() => openEditModal(s)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 16 }}>✏️</button>
                  <button onClick={() => handleDelete(s.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 16 }}>🗑️</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal open={showModal} onClose={() => setShowModal(false)}>
        <h3 style={{ fontSize: 18, fontWeight: 800, color: 'var(--color-text)', marginBottom: 16 }}>
          {editingId ? 'Edit Special' : 'Add Special'}
        </h3>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div>
            <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: 'var(--color-text-light)', textTransform: 'uppercase', marginBottom: 4 }}>Item Name</label>
            <input required type="text" value={title} onChange={e => setTitle(e.target.value)} style={{ width: '100%', padding: '10px 12px', border: '1.5px solid var(--color-border)', borderRadius: 8 }} placeholder="e.g. Chicken Biryani" />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: 'var(--color-text-light)', textTransform: 'uppercase', marginBottom: 4 }}>Description</label>
            <textarea value={description} onChange={e => setDescription(e.target.value)} rows={2} style={{ width: '100%', padding: '10px 12px', border: '1.5px solid var(--color-border)', borderRadius: 8, fontFamily: 'inherit' }} placeholder="e.g. Served with Raita and Brinjal Curry" />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: 'var(--color-text-light)', textTransform: 'uppercase', marginBottom: 4 }}>Price (₹)</label>
            <input required type="number" step="1" value={price} onChange={e => setPrice(e.target.value)} style={{ width: '100%', padding: '10px 12px', border: '1.5px solid var(--color-border)', borderRadius: 8 }} placeholder="e.g. 150" />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <input type="checkbox" id="isActive" checked={isActive} onChange={e => setIsActive(e.target.checked)} style={{ accentColor: 'var(--color-primary)' }} />
            <label htmlFor="isActive" style={{ fontSize: 14, fontWeight: 600, color: 'var(--color-text)' }}>Active (Visible to customers)</label>
          </div>
          <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
            <Button variant="ghost" fullWidth onClick={() => setShowModal(false)} type="button">Cancel</Button>
            <Button variant="primary" fullWidth type="submit" loading={submitting}>Save</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
