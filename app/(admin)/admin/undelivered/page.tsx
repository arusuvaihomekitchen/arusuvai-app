'use client';

import React, { useEffect, useState } from 'react';
import Badge from '@/components/ui/Badge';
import type { DailyDelivery } from '@/types';

export default function UndeliveredPage() {
  const [data, setData] = useState<DailyDelivery[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch('/api/admin/undelivered');
        const json = await res.json();
        if (json.success) {
          setData(json.data);
        }
      } catch (err) {
        console.error('Failed to load undelivered data', err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  // Group by date
  const grouped: Record<string, DailyDelivery[]> = {};
  for (const d of data) {
    if (!grouped[d.date]) grouped[d.date] = [];
    grouped[d.date].push(d);
  }
  const dates = Object.keys(grouped).sort((a, b) => new Date(b).getTime() - new Date(a).getTime());

  if (loading) {
    return <div style={{ padding: '40px', textAlign: 'center', color: 'var(--color-text-muted)' }}>Loading records...</div>;
  }

  return (
    <div style={{ maxWidth: 800, margin: '0 auto', paddingBottom: 60 }}>
      <div style={{ marginBottom: 32 }}>
        <h1 style={{ fontSize: 24, fontWeight: 800, color: 'var(--color-text)', marginBottom: 8 }}>Undelivered Meals</h1>
        <p style={{ fontSize: 14, color: 'var(--color-text-muted)', lineHeight: 1.5 }}>
          History of deliveries that were marked as "Not Available" by the delivery person, or missed past deliveries.
        </p>
      </div>

      {dates.length === 0 ? (
        <div style={{ padding: '40px', textAlign: 'center', background: 'white', borderRadius: 16, border: '1px dashed var(--color-border)' }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>🎉</div>
          <h3 style={{ fontSize: 16, fontWeight: 700, color: 'var(--color-text)', marginBottom: 4 }}>All Caught Up!</h3>
          <p style={{ fontSize: 13, color: 'var(--color-text-muted)' }}>There are no undelivered or missed meals in the system.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
          {dates.map(date => {
            const dateObj = new Date(date);
            const displayDate = dateObj.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric', timeZone: 'UTC' });
            const deliveries = grouped[date];

            return (
              <div key={date}>
                <h3 style={{ 
                  fontSize: 16, fontWeight: 800, color: 'var(--color-text)', 
                  marginBottom: 16, paddingBottom: 8, borderBottom: '2px solid var(--color-border)',
                  display: 'flex', alignItems: 'center', gap: 8
                }}>
                  📅 {displayDate}
                  <Badge variant="not_started">{deliveries.length} items</Badge>
                </h3>
                
                <div style={{ display: 'grid', gap: 12 }}>
                  {deliveries.map(d => (
                    <div key={d.id} style={{
                      background: 'white', borderRadius: 16, border: '1px solid var(--color-border)',
                      padding: 16, display: 'flex', flexDirection: 'column', gap: 12,
                      boxShadow: '0 2px 8px rgba(0,0,0,0.02)'
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <div>
                          <div style={{ fontSize: 15, fontWeight: 800, color: 'var(--color-text)', display: 'flex', alignItems: 'center', gap: 6 }}>
                            {d.client_name}
                            <Badge variant={d.meal_type === 'Lunch' ? 'active' : 'pending'}>{d.meal_type}</Badge>
                          </div>
                          <div style={{ fontSize: 13, color: 'var(--color-text-muted)', marginTop: 4 }}>
                            📞 {d.phone_number || 'No phone'}
                          </div>
                          <div style={{ fontSize: 12, color: 'var(--color-text-light)', marginTop: 2 }}>
                            📍 {d.location || 'Unknown Location'} {d.pincode ? `(${d.pincode})` : ''}
                          </div>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          <Badge variant={d.status === 'not_available' ? 'not_available' : 'expired'}>
                            {d.status === 'not_available' ? 'Not Available' : 'Missed'}
                          </Badge>
                          {d.delivery_person_name && (
                            <div style={{ fontSize: 11, color: 'var(--color-text-muted)', marginTop: 6 }}>
                              Assigned to: <strong>{d.delivery_person_name}</strong>
                            </div>
                          )}
                        </div>
                      </div>

                      {(d.delivery_note || d.delivery_note_client) && (
                        <div style={{ background: '#FFFBEB', padding: '10px 14px', borderRadius: 10, border: '1px solid #FEF3C7', fontSize: 12, color: '#92400E' }}>
                          {d.delivery_note_client && <div style={{ marginBottom: d.delivery_note ? 6 : 0 }}><strong>Client Note:</strong> {d.delivery_note_client}</div>}
                          {d.delivery_note && <div><strong>Driver Note:</strong> {d.delivery_note}</div>}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
