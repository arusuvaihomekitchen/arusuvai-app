'use client';

import React, { useState, useEffect } from 'react';
import PublicNavbar from '@/components/public/PublicNavbar';
import PublicFooter from '@/components/public/PublicFooter';
import type { TodaySpecial } from '@/types';
import Button from '@/components/ui/Button';

export default function SpecialsPage() {
  const [specials, setSpecials] = useState<TodaySpecial[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 60000); // update every minute
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch('/api/public/specials');
        const json = await res.json();
        if (json.success) setSpecials(json.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const businessPhone = "918667670695"; // Actual business WhatsApp number

  function orderViaWhatsApp(item: TodaySpecial) {
    const message = `Hi Arusuvai! I would like to order Today's Special:\n\n*${item.title}*\nPrice: ₹${item.price}\n\nPlease let me know the payment details.`;
    const url = `https://wa.me/${businessPhone}?text=${encodeURIComponent(message)}`;
    window.open(url, '_blank');
  }

  function checkExpired(availableUntil: string | null) {
    if (!availableUntil) return false;
    const istTimeStr = currentTime.toLocaleTimeString('en-US', { timeZone: 'Asia/Kolkata', hour12: false });
    let [h, m] = istTimeStr.split(':');
    if (h === '24') h = '00';
    const currentHM = `${h.padStart(2, '0')}:${m.padStart(2, '0')}`;
    const limitHM = availableUntil.slice(0, 5);
    return currentHM >= limitHM;
  }

  function formatTime(timeStr: string) {
    const [h, m] = timeStr.split(':');
    let hour = parseInt(h, 10);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    hour = hour % 12;
    hour = hour ? hour : 12;
    return `${hour}:${m} ${ampm}`;
  }

  return (
    <>
      <PublicNavbar />
      <div style={{ minHeight: '80vh', background: '#FFFDF7', paddingTop: 100, paddingBottom: 80 }}>
        <div style={{ maxWidth: 800, margin: '0 auto', padding: '0 24px' }}>
          
          <div style={{ textAlign: 'center', marginBottom: 48 }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 7, fontSize: 11, fontWeight: 800, letterSpacing: '0.15em', textTransform: 'uppercase', color: '#E8A020', marginBottom: 16 }}>
              <span style={{ width: 20, height: 2, background: '#E8A020', borderRadius: 2 }} />
              Freshly Prepared
              <span style={{ width: 20, height: 2, background: '#E8A020', borderRadius: 2 }} />
            </div>
            <h1 style={{ fontSize: 'clamp(32px, 5vw, 48px)', fontWeight: 800, color: '#1A2E1A', letterSpacing: '-0.02em', marginBottom: 16 }}>
              Today's Specials
            </h1>
            <p style={{ fontSize: 16, color: '#5C6E5C', fontWeight: 500, maxWidth: 500, margin: '0 auto', lineHeight: 1.6 }}>
              Exclusive, limited-time items prepared fresh today. Order quickly via WhatsApp before we run out!
            </p>
          </div>

          {loading ? (
            <div style={{ textAlign: 'center', padding: 60, color: '#5C6E5C', fontWeight: 600 }}>Loading today's specials...</div>
          ) : specials.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '60px 20px', background: 'white', borderRadius: 20, border: '1px dashed #E5E7EB', boxShadow: '0 10px 40px rgba(44,94,46,0.03)' }}>
              <div style={{ fontSize: 48, marginBottom: 16 }}>👨‍🍳</div>
              <h3 style={{ fontSize: 20, fontWeight: 800, color: '#1A2E1A', marginBottom: 8 }}>Sold Out for Today!</h3>
              <p style={{ fontSize: 15, color: '#5C6E5C', fontWeight: 500 }}>All our special items are gone. Check back tomorrow for more delicious surprises.</p>
            </div>
          ) : (
            <div style={{ display: 'grid', gap: 16 }}>
              {specials.map(s => (
                <div key={s.id} style={{
                  background: 'white', border: '1px solid #E5E7EB', borderRadius: 16, padding: '24px',
                  display: 'flex', flexDirection: 'column', gap: 16,
                  boxShadow: '0 4px 20px rgba(0,0,0,0.02)',
                  transition: 'transform 0.2s ease, box-shadow 0.2s ease',
                  cursor: 'default'
                }}>
                  {checkExpired(s.available_until) && (
                    <div style={{ position: 'absolute', top: 12, right: 12, background: '#FEE2E2', color: '#991B1B', fontSize: 11, fontWeight: 800, padding: '4px 10px', borderRadius: 12 }}>
                      Time Expired
                    </div>
                  )}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16 }}>
                    <div>
                      <h3 style={{ fontSize: 20, fontWeight: 800, color: '#1A2E1A', marginBottom: 6 }}>{s.title}</h3>
                      {s.description && (
                        <p style={{ fontSize: 14, color: '#5C6E5C', fontWeight: 500, lineHeight: 1.5, maxWidth: 450 }}>
                          {s.description}
                        </p>
                      )}
                      {s.available_until && !checkExpired(s.available_until) && (
                        <div style={{ marginTop: 8, display: 'inline-block', fontSize: 12, fontWeight: 700, color: '#D97706', background: '#FEF3C7', padding: '4px 10px', borderRadius: 8 }}>
                          ⏳ Order before {formatTime(s.available_until)}
                        </div>
                      )}
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: 24, fontWeight: 900, color: '#2C5E2E' }}>₹{s.price}</div>
                    </div>
                  </div>
                  
                  <div style={{ marginTop: 8, borderTop: '1px solid #F3F4F6', paddingTop: 16, display: 'flex', justifyContent: 'flex-end' }}>
                    <button 
                      disabled={checkExpired(s.available_until)}
                      onClick={() => orderViaWhatsApp(s)}
                      style={{
                        background: checkExpired(s.available_until) ? '#E5E7EB' : '#25D366', 
                        color: checkExpired(s.available_until) ? '#9CA3AF' : 'white', 
                        fontWeight: 800, fontSize: 14,
                        padding: '12px 24px', borderRadius: 10, border: 'none', 
                        cursor: checkExpired(s.available_until) ? 'not-allowed' : 'pointer',
                        display: 'flex', alignItems: 'center', gap: 8,
                        boxShadow: checkExpired(s.available_until) ? 'none' : '0 4px 14px rgba(37,211,102,0.3)',
                        transition: 'transform 0.1s ease'
                      }}
                      onMouseDown={(e) => !checkExpired(s.available_until) && (e.currentTarget.style.transform = 'scale(0.97)')}
                      onMouseUp={(e) => !checkExpired(s.available_until) && (e.currentTarget.style.transform = 'scale(1)')}
                      onMouseLeave={(e) => !checkExpired(s.available_until) && (e.currentTarget.style.transform = 'scale(1)')}
                    >
                      {!checkExpired(s.available_until) && (
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 0 0-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413z" />
                        </svg>
                      )}
                      {checkExpired(s.available_until) ? 'Ordering Closed' : 'Order on WhatsApp'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
      <PublicFooter />
    </>
  );
}
