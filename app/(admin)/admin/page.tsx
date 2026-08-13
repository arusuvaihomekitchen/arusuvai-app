'use client';

import React, { useEffect, useState, useCallback } from 'react';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';
import CustomDropdown from '@/components/ui/CustomDropdown';
import CustomConfirmModal from '@/components/ui/CustomConfirmModal';
import type { DailyDelivery } from '@/types';
import { swrFetch, invalidateCache } from '@/lib/clientCache';

function dateStr(d: Date) {
  return d.toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' });
}

function formatDateDisplay(iso: string) {
  const d = new Date(iso);
  const isToday = iso === dateStr(new Date());
  const label = d.toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' });
  return isToday ? `Today — ${label}` : label;
}

type MealTab = 'Breakfast' | 'Lunch' | 'Dinner';

export default function AdminTodayPage() {
  const [date, setDate] = useState(dateStr(new Date()));
  const [deliveries, setDeliveries] = useState<(DailyDelivery & { skip_req_id?: string; skip_status?: string })[]>([]);
  const [loading, setLoading] = useState(false);
  const [mealTab, setMealTab] = useState<MealTab>('Lunch');
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [deliveryPersons, setDeliveryPersons] = useState<{ id: string; name: string }[]>([]);
  const [assignPerson, setAssignPerson] = useState('');
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [skippingAll, setSkippingAll] = useState(false);
  const [confirmSkipDelivery, setConfirmSkipDelivery] = useState<DailyDelivery | null>(null);

  const loadDeliveries = useCallback((bypassCache = false) => {
    setLoading(true);
    setSelected(new Set());
    const unsub = swrFetch(`/api/admin/today?date=${date}`, (json) => {
      setDeliveries(json.data ?? []);
      setLoading(false);
    }, { bypassCache });
    return unsub;
  }, [date]);

  useEffect(() => {
    const unsub = loadDeliveries();
    return unsub;
  }, [loadDeliveries]);

  useEffect(() => {
    const unsub = swrFetch('/api/admin/delivery-persons', (json) => {
      setDeliveryPersons(json.data ?? []);
      if (json.data?.length) setAssignPerson(json.data[0].id);
    });
    return unsub;
  }, []);

  async function generateToday() {
    setGenerating(true);
    await fetch('/api/admin/generate-today', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ date }),
    });
    invalidateCache('/api/admin/today');
    loadDeliveries(true);
    setGenerating(false);
  }

  async function skipAll() {
    if (!confirm('Are you sure you want to skip all active deliveries for ' + mealTab + ' on this date? (e.g. for a holiday)')) return;
    setSkippingAll(true);
    await fetch('/api/admin/skip-all', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ date, meal_type: mealTab }),
    });
    invalidateCache('/api/admin/today');
    invalidateCache('/api/admin/clients');
    loadDeliveries(true);
    setSkippingAll(false);
  }

  async function approveSkip(skipId: string) {
    await fetch(`/api/admin/skip-requests/${skipId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'approved' }),
    });
    invalidateCache('/api/admin/today');
    invalidateCache('/api/admin/clients');
    loadDeliveries(true);
  }

  async function rejectSkip(skipId: string) {
    await fetch(`/api/admin/skip-requests/${skipId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'rejected' }),
    });
    invalidateCache('/api/admin/today');
    loadDeliveries(true);
  }

  async function adminSkip(delivery: DailyDelivery) {
    await fetch('/api/admin/skip-admin', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ client_id: delivery.client_id, date: delivery.date, meal_type: delivery.meal_type }),
    });
    invalidateCache('/api/admin/today');
    invalidateCache('/api/admin/clients');
    loadDeliveries(true);
  }

  async function restoreDelivery(delivery: DailyDelivery) {
    await fetch('/api/admin/restore-delivery', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ client_id: delivery.client_id, date: delivery.date, meal_type: delivery.meal_type }),
    });
    invalidateCache('/api/admin/today');
    invalidateCache('/api/admin/clients');
    loadDeliveries(true);
  }

  async function bulkAssign() {
    if (!assignPerson || selected.size === 0) return;
    await fetch('/api/admin/assign', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ delivery_ids: Array.from(selected), delivery_person_id: assignPerson }),
    });
    setShowAssignModal(false);
    invalidateCache('/api/admin/today');
    invalidateCache('/api/admin/delivery-persons');
    loadDeliveries(true);
  }

  const [listFilter, setListFilter] = useState<'all' | 'to_deliver' | 'delivered' | 'pending_skips'>('all');

  const filtered = deliveries.filter((d) => d.meal_type === mealTab);
  const toDeliver = filtered.filter((d) => ['pending', 'assigned'].includes(d.status));
  const completedRows = filtered.filter((d) => ['delivered', 'not_available', 'skipped'].includes(d.status));
  const pendingSkips = filtered.filter((d) => d.skip_req_id && d.skip_status === 'pending').length;

  const groupedToDeliver = toDeliver.reduce((acc, d) => {
    const loc = d.location || 'Unknown Location';
    if (!acc[loc]) acc[loc] = [];
    acc[loc].push(d);
    return acc;
  }, {} as Record<string, DailyDelivery[]>);

  const toggleLocationSelect = (loc: string) => {
    const ids = groupedToDeliver[loc].map(d => d.id);
    setSelected(prev => {
      const next = new Set(prev);
      const allSelected = ids.every(id => next.has(id));
      if (allSelected) {
        ids.forEach(id => next.delete(id));
      } else {
        ids.forEach(id => next.add(id));
      }
      return next;
    });
  };

  function navDate(dir: number) {
    const d = new Date(date + 'T00:00:00');
    d.setDate(d.getDate() + dir);
    setDate(dateStr(d));
  }

  const toggleSelect = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  return (
    <div style={{ animation: 'fadeIn 0.3s ease' }}>

      {/* Date picker inline */}
      <div style={{
        background: 'white', border: '1px solid var(--color-border)',
        borderRadius: 16, padding: '14px 20px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        marginBottom: 16,
      }}>
        <button onClick={() => navDate(-1)} style={navBtnStyle}>‹</button>
        <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <div style={{ fontSize: 10, color: 'var(--color-text-light)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 4 }}>
            Delivery Date
          </div>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            style={{
              fontFamily: 'Outfit, sans-serif',
              fontSize: '15px',
              fontWeight: 700,
              color: 'var(--color-primary)',
              border: '1.5px solid var(--color-border)',
              borderRadius: '8px',
              padding: '4px 12px',
              cursor: 'pointer',
              outline: 'none',
              background: 'var(--color-bg)',
              textAlign: 'center',
            }}
          />
          <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--color-text-muted)', marginTop: 4 }}>
            {formatDateDisplay(date)}
          </div>
        </div>
        <button onClick={() => navDate(1)} style={navBtnStyle}>›</button>
      </div>

      {/* Summary pills */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
        {[
          { id: 'all', label: 'Total', value: filtered.length, style: { background: listFilter === 'all' ? 'var(--color-primary)' : 'white', border: '1px solid var(--color-border)', color: listFilter === 'all' ? 'white' : 'var(--color-text)' } },
          { id: 'to_deliver', label: 'To deliver', value: toDeliver.length, style: { background: listFilter === 'to_deliver' ? 'var(--color-primary)' : 'white', border: '1px solid var(--color-border)', color: listFilter === 'to_deliver' ? 'white' : 'var(--color-text)' } },
          { id: 'delivered', label: 'Delivered', value: completedRows.filter((d) => d.status === 'delivered').length, style: { background: listFilter === 'delivered' ? 'var(--color-primary)' : 'var(--color-primary-light)', border: '1px solid #A8D4A8', color: listFilter === 'delivered' ? 'white' : 'var(--color-primary)' } },
          pendingSkips > 0 ? { id: 'pending_skips', label: 'Pending skips', value: pendingSkips, style: { background: listFilter === 'pending_skips' ? 'var(--color-accent)' : 'var(--color-accent-light)', border: '1px solid var(--color-accent)', color: listFilter === 'pending_skips' ? 'white' : 'var(--color-accent-dark)' } } : null,
        ].filter(Boolean).map((p) => p && (
          <div key={p.label} onClick={() => setListFilter(p.id as any)} style={{
            ...p.style, borderRadius: 12, padding: '8px 14px', fontSize: 12,
            display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', transition: 'all 0.15s ease'
          }}>
            <span style={{ fontWeight: 600 }}>{p.label}</span>
            <span style={{ fontWeight: 900, fontSize: 14 }}>{p.value}</span>
          </div>
        ))}
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <Button size="sm" variant="ghost" onClick={skipAll} loading={skippingAll} style={{ color: '#DC2626', borderColor: '#FECACA', background: '#FEF2F2' }}>
            🚫 Skip All (Holiday)
          </Button>
          <Button size="sm" variant="ghost" onClick={generateToday} loading={generating}>
            ⟳ Generate List
          </Button>
        </div>
      </div>

      {/* Meal tabs */}
      <div style={{
        display: 'flex', gap: 6,
        background: 'white', border: '1px solid var(--color-border)',
        borderRadius: 14, padding: 5, marginBottom: 14,
      }}>
        {(['Breakfast', 'Lunch', 'Dinner'] as MealTab[]).map((tab) => {
          const count = deliveries.filter((d) => d.meal_type === tab).length;
          return (
            <button key={tab} onClick={() => { setMealTab(tab); setSelected(new Set()); }}
              style={{
                flex: 1, padding: '10px 8px',
                background: mealTab === tab ? 'var(--color-primary)' : 'transparent',
                color: mealTab === tab ? 'white' : 'var(--color-text-muted)',
                border: 'none', borderRadius: 10,
                fontSize: 13, fontWeight: mealTab === tab ? 700 : 600, cursor: 'pointer',
              }}
            >
              {tab === 'Breakfast' ? '🍳' : tab === 'Lunch' ? '🍱' : '🌙'} {tab} ({count})
            </button>
          );
        })}
      </div>

      {/* Bulk assign bar */}
      {selected.size > 0 && (
        <div className="mobile-floating-bar" style={{
          background: 'var(--color-primary-light)', border: '1px solid #A8D4A8',
          borderRadius: 12, padding: '12px 16px', marginBottom: 12,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          animation: 'slideUp 0.2s ease',
        }}>
          <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--color-primary)' }}>
            {selected.size} selected
          </span>
          <Button size="sm" onClick={() => setShowAssignModal(true)}>Assign →</Button>
        </div>
      )}

      {loading ? (
        <div style={{ textAlign: 'center', padding: 40, color: 'var(--color-text-light)' }}>Loading deliveries…</div>
      ) : (
        <>
          {/* To Be Delivered */}
          {(listFilter === 'all' || listFilter === 'to_deliver' || listFilter === 'pending_skips') && toDeliver.length > 0 && (
            <div style={{ marginBottom: 24 }}>
              <h3 style={sectionHeader}>📦 To Be Delivered — {toDeliver.length}</h3>
              {Object.entries(groupedToDeliver).map(([loc, rows]) => {
                const displayRows = listFilter === 'pending_skips' 
                  ? rows.filter(d => d.skip_req_id && d.skip_status === 'pending')
                  : rows;
                
                if (displayRows.length === 0) return null;
                
                const allSelected = displayRows.length > 0 && displayRows.every(d => selected.has(d.id));

                return (
                  <div key={loc} style={{ marginBottom: 16 }}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 8, padding: '0 4px' }}>
                      <h4 style={{ margin: 0, fontSize: 14, fontWeight: 800, color: 'var(--color-text)', flex: 1, marginRight: 12, lineHeight: 1.4 }}>
                        📍 {loc}
                      </h4>
                      <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 700, color: 'var(--color-primary)', cursor: 'pointer', whiteSpace: 'nowrap', flexShrink: 0 }}>
                        <input 
                          type="checkbox" 
                          checked={allSelected} 
                          onChange={() => toggleLocationSelect(loc)}
                          style={{ accentColor: 'var(--color-primary)', marginTop: 2 }}
                        />
                        Select All
                      </label>
                    </div>
                    {displayRows.map((d) => (
                      <DeliveryRow
                        key={d.id}
                        delivery={d}
                        selected={selected.has(d.id)}
                        onToggle={() => toggleSelect(d.id)}
                        onApproveSkip={() => d.skip_req_id && approveSkip(d.skip_req_id)}
                        onRejectSkip={() => d.skip_req_id && rejectSkip(d.skip_req_id)}
                        onAdminSkip={() => setConfirmSkipDelivery(d)}
                        onRefresh={loadDeliveries}
                      />
                    ))}
                  </div>
                );
              })}
            </div>
          )}

          {/* Completed */}
          {(listFilter === 'all' || listFilter === 'delivered') && completedRows.length > 0 && (
            <div>
              <h3 style={{ ...sectionHeader, color: 'var(--color-primary)' }}>✅ Completed — {completedRows.length}</h3>
              {completedRows.map((d) => (
                <CompletedRow key={d.id} delivery={d} onRestore={() => restoreDelivery(d)} />
              ))}
            </div>
          )}

          {deliveries.length === 0 && (
            <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--color-text-light)' }}>
              <div style={{ fontSize: 40, marginBottom: 12 }}>📭</div>
              <div style={{ fontSize: 14, fontWeight: 600 }}>No deliveries for this date.</div>
              <div style={{ fontSize: 12, marginTop: 6 }}>Click &quot;Generate List&quot; to create today&apos;s deliveries.</div>
            </div>
          )}
        </>
      )}

      {/* Assign Modal */}
      <Modal open={showAssignModal} onClose={() => setShowAssignModal(false)}>
        <h3 style={{ fontSize: 17, fontWeight: 800, color: 'var(--color-text)', marginBottom: 16 }}>
          Assign {selected.size} Deliveries
        </h3>
        <div style={{ marginBottom: 16 }}>
          <CustomDropdown
            label="Delivery Person"
            options={deliveryPersons}
            value={assignPerson}
            onChange={setAssignPerson}
          />
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <Button variant="ghost" fullWidth onClick={() => setShowAssignModal(false)}>Cancel</Button>
          <Button variant="primary" fullWidth onClick={bulkAssign}>Assign →</Button>
        </div>
      </Modal>

      <CustomConfirmModal
        open={confirmSkipDelivery !== null}
        onClose={() => setConfirmSkipDelivery(null)}
        onConfirm={async () => {
          if (!confirmSkipDelivery) return;
          await adminSkip(confirmSkipDelivery);
          setConfirmSkipDelivery(null);
        }}
        title="Confirm Skip for User"
        message={`Are you sure you want to skip ${confirmSkipDelivery?.meal_type} on ${confirmSkipDelivery ? formatDateDisplay(confirmSkipDelivery.date) : ''} for ${confirmSkipDelivery?.client_name}?`}
        confirmText="Skip Meal"
        variant="danger"
      />
    </div>
  );
}

function DeliveryRow({
  delivery: d, selected, onToggle,
  onApproveSkip, onRejectSkip, onAdminSkip, onRefresh,
}: {
  delivery: DailyDelivery & { skip_req_id?: string; skip_status?: string };
  selected: boolean;
  onToggle: () => void;
  onApproveSkip: () => void;
  onRejectSkip: () => void;
  onAdminSkip: () => void;
  onRefresh: () => void;
}) {
  const hasPendingSkip = !!d.skip_req_id && d.skip_status === 'pending';

  return (
    <div style={{
      background: 'white',
      border: `1.5px solid ${hasPendingSkip ? '#FEF3DC' : 'var(--color-border)'}`,
      borderRadius: 14, padding: '13px 16px', marginBottom: 8,
    }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
        <input
          type="checkbox"
          checked={selected}
          onChange={onToggle}
          className="touch-target"
          style={{ marginTop: 4, accentColor: 'var(--color-primary)', cursor: 'pointer' }}
        />
        <div style={{ flex: 1 }}>
          <div className="mobile-stack" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 6, marginBottom: 4 }}>
            <div className="mobile-stack" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 14, fontWeight: 800, color: 'var(--color-text)', display: 'flex', alignItems: 'center', gap: 6 }}>
                {d.client_name}
                <span style={{ fontSize: 10 }}>{(d as any).diet_preference === 'Non-Veg' ? '🔴' : '🟢'}</span>
              </span>
              <span style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>📞 {d.phone_number}</span>
            </div>
            <div className="mobile-stack-full" style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
              {hasPendingSkip && <Badge variant="pending">⚠ Skip Requested</Badge>}
              {d.status === 'assigned' && d.delivery_person_name && (
                <Badge variant="assigned">Assigned — {d.delivery_person_name}</Badge>
              )}
            </div>
          </div>

          {d.delivery_note_client && (
            <div style={{ fontSize: 11, color: 'var(--color-accent-dark)', fontStyle: 'italic', marginBottom: 6 }}>
              📝 &quot;{d.delivery_note_client}&quot;
            </div>
          )}
          <div className="mobile-btn-stack" style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {hasPendingSkip && (
              <>
                <button onClick={onApproveSkip} style={approveStyle}>✓ Approve Skip</button>
                <button onClick={onRejectSkip}  style={rejectStyle}>✗ Reject</button>
              </>
            )}
            {!hasPendingSkip && (
              <button onClick={onAdminSkip} style={ghostSmStyle}>Skip for user</button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function CompletedRow({ delivery: d, onRestore }: { delivery: DailyDelivery; onRestore?: () => void }) {
  const isNA = d.status === 'not_available';
  const isSkipped = d.status === 'skipped';
  return (
    <div style={{
      background: isNA ? '#FFF7ED' : isSkipped ? '#F9FAFB' : '#F0FDF4',
      border: `1px solid ${isNA ? '#FED7AA' : isSkipped ? '#E5E7EB' : '#BBF7D0'}`,
      borderRadius: 14, padding: '11px 14px', marginBottom: 6,
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      opacity: 0.9,
    }}>
      <div>
        <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--color-text)', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
          {d.client_name}
          <span style={{ fontSize: 9 }}>{(d as any).diet_preference === 'Non-Veg' ? '🔴' : '🟢'}</span>
        </span>
        <span style={{ fontSize: 11, color: 'var(--color-text-muted)', marginLeft: 8 }}>📍 {d.location}</span>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{ textAlign: 'right' }}>
          <Badge variant={d.status === 'delivered' ? 'delivered' : d.status === 'not_available' ? 'not_available' : 'skipped'}>
            {d.status === 'delivered' ? '✓ Delivered' : d.status === 'not_available' ? 'Not Available' : 'Skipped'}
          </Badge>
          {d.delivered_at && (
            <div style={{ fontSize: 10, color: 'var(--color-text-light)', marginTop: 2 }}>
              {new Date(d.delivered_at).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Kolkata' })}
              {d.delivery_person_name ? ` — ${d.delivery_person_name}` : ''}
            </div>
          )}
        </div>
        {isSkipped && onRestore && (
          <button onClick={onRestore} style={restoreBtnStyle}>Undo Skip</button>
        )}
      </div>
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

const restoreBtnStyle: React.CSSProperties = {
  padding: '6px 12px',
  background: 'white',
  color: 'var(--color-primary)',
  border: '1.5px solid var(--color-primary)',
  borderRadius: 8,
  fontWeight: 700,
  fontSize: 11,
  cursor: 'pointer',
  fontFamily: 'Outfit, sans-serif',
};

const sectionHeader: React.CSSProperties = {
  fontSize: 12, fontWeight: 700, color: 'var(--color-text-muted)',
  textTransform: 'uppercase', letterSpacing: '0.08em',
  marginBottom: 10, paddingLeft: 4,
};

const labelStyle: React.CSSProperties = {
  display: 'block', fontSize: 11, fontWeight: 700,
  color: 'var(--color-text-muted)', textTransform: 'uppercase',
  letterSpacing: '0.08em', marginBottom: 6,
};

const approveStyle: React.CSSProperties = {
  padding: '6px 14px', background: 'var(--color-primary)', color: 'white',
  border: 'none', borderRadius: 8, fontWeight: 700, fontSize: 11, cursor: 'pointer',
};
const rejectStyle: React.CSSProperties = {
  padding: '6px 14px', background: 'white', color: '#DC2626',
  border: '1px solid #FECACA', borderRadius: 8, fontWeight: 700, fontSize: 11, cursor: 'pointer',
};
const ghostSmStyle: React.CSSProperties = {
  padding: '5px 10px', background: 'var(--color-bg)', color: 'var(--color-text-muted)',
  border: '1px solid var(--color-border)', borderRadius: 8, fontWeight: 600, fontSize: 11, cursor: 'pointer',
};
