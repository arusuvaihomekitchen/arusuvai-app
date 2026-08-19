'use client';

import React, { useEffect, useState } from 'react';
import Badge from '@/components/ui/Badge';
import { formatDate, formatToday, getSubscriptionStatus, addServiceDays, countServiceDays } from '@/lib/dateUtils';
import type { Subscription, DailyDelivery } from '@/types';
import { useTranslation } from '@/i18n';

export default function ClientHomePage() {
  const { t } = useTranslation();
  const [sub, setSub] = useState<(Subscription & { total_service_days?: number; remaining_service_days?: number, skipCounts?: { meal_type: string, count: number }[] }) | null>(null);
  const [deliveries, setDeliveries] = useState<DailyDelivery[]>([]);
  const [history, setHistory] = useState<Record<string, DailyDelivery[]>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const [subRes, histRes] = await Promise.all([
          fetch('/api/client/subscription'),
          fetch(`/api/client/history?year=${new Date().getFullYear()}&month=${new Date().getMonth() + 1}`),
        ]);
        const subData = await subRes.json();
        const histData = await histRes.json();

        setSub(subData.data);

        // Filter today's deliveries
        const today = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' });
        const todayDeliveries = (histData.data?.deliveries ?? []).filter(
          (d: DailyDelivery) => d.date.slice(0, 10) === today
        );
        const todaySkips = (histData.data?.skips ?? []).filter(
          (s: any) => s.date.slice(0, 10) === today
        );

        // Construct breakfast, lunch and dinner statuses checking skips
        const mergedDeliveries: DailyDelivery[] = [];
        const mealTypes = ['Breakfast', 'Lunch', 'Dinner'];
        for (const mealType of mealTypes) {
          const del = todayDeliveries.find((d: DailyDelivery) => d.meal_type === mealType);
          const skip = todaySkips.find((s: any) => s.meal_type === mealType);
          if (del) {
            if (del.status === 'pending' && skip && skip.status === 'pending') {
              mergedDeliveries.push({ ...del, status: 'pending_skip' as any });
            } else {
              mergedDeliveries.push(del);
            }
          } else if (skip) {
            mergedDeliveries.push({
              id: `temp_${mealType}`,
              client_id: subData.data?.client_id ?? '',
              date: today,
              meal_type: mealType,
              status: (skip.status === 'approved' ? 'skipped' : 'pending_skip') as any,
              skip_request_id: skip.id,
            } as any);
          }
        }
        setDeliveries(mergedDeliveries);

        // Build history grouped by date (excluding today)
        const historyGrouped: Record<string, DailyDelivery[]> = {};
        for (const d of (histData.data?.deliveries ?? [])) {
          const dDate = d.date.slice(0, 10);
          if (dDate === today) continue; // skip today as it's shown above
          if (!historyGrouped[dDate]) historyGrouped[dDate] = [];
          historyGrouped[dDate].push(d);
        }
        for (const s of (histData.data?.skips ?? [])) {
          const sDate = s.date.slice(0, 10);
          if (sDate === today) continue;
          if (!historyGrouped[sDate]) historyGrouped[sDate] = [];
          if (!historyGrouped[sDate].some((d) => d.meal_type === s.meal_type)) {
            historyGrouped[sDate].push({
              id: `temp_${s.meal_type}_${sDate}`,
              client_id: subData.data?.client_id ?? '',
              date: s.date,
              meal_type: s.meal_type,
              status: (s.status === 'approved' ? 'skipped' : 'pending_skip') as any,
              skip_request_id: s.id,
            } as any);
          }
        }
        setHistory(historyGrouped);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  if (loading) return <LoadingSkeleton />;

  const bSkips = sub?.skipCounts?.find(s => s.meal_type === 'Breakfast')?.count || 0;
  const lSkips = sub?.skipCounts?.find(s => s.meal_type === 'Lunch')?.count || 0;
  const dSkips = sub?.skipCounts?.find(s => s.meal_type === 'Dinner')?.count || 0;

  let maxEndDate: Date | null = sub?.end_date ? new Date(sub.end_date) : null;
  if (sub && maxEndDate) {
    const dates: Date[] = [];
    if (sub.subscribe_breakfast) dates.push(addServiceDays(maxEndDate, bSkips));
    if (sub.subscribe_lunch !== false) dates.push(addServiceDays(maxEndDate, lSkips));
    if (sub.subscribe_dinner !== false) dates.push(addServiceDays(maxEndDate, dSkips));
    
    for (const d of dates) {
      if (d > maxEndDate) maxEndDate = d;
    }
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const isExpired = !sub || (maxEndDate ? maxEndDate < today : true);

  const breakfast = deliveries.find((d) => d.meal_type === 'Breakfast');
  const lunch  = deliveries.find((d) => d.meal_type === 'Lunch');
  const dinner = deliveries.find((d) => d.meal_type === 'Dinner');



  return (
    <div style={{ animation: 'fadeIn 0.3s ease' }}>
      {/* Subscription card */}
      {isExpired ? (
        <div style={{
          background: '#FEF2F2', border: '1.5px solid #FECACA',
          borderRadius: 20, padding: 20, marginBottom: 16, textAlign: 'center',
        }}>
          <div style={{ fontSize: 32, marginBottom: 8 }}>⚠️</div>
          <div style={{ fontSize: 17, fontWeight: 800, color: '#DC2626', marginBottom: 6 }}>
            {t('sub.expiredTitle')}
          </div>
          <div style={{ fontSize: 13, color: '#7F1D1D', lineHeight: 1.5 }}>
            {sub
              ? t('sub.endedOn', { date: maxEndDate ? formatDate(maxEndDate.toISOString()) : formatDate(sub.end_date) })
              : t('sub.noActive')
            } {t('sub.renewPrompt')}
          </div>
        </div>
      ) : sub ? (() => {
          const fromDate = (sub.start_date && new Date(sub.start_date) > today) ? new Date(sub.start_date) : today;
          
          const getRem = (subscribed: boolean, skips: number) => {
            if (!subscribed || !sub.end_date) return null;
            const end = addServiceDays(new Date(sub.end_date), skips);
            if (end < today) return 0;
            return countServiceDays(fromDate, end);
          };

          const bRem = getRem(sub?.subscribe_breakfast === true, bSkips);
          const lRem = getRem(sub?.subscribe_lunch !== false, lSkips);
          const dRem = getRem(sub?.subscribe_dinner !== false, dSkips);

          const maxRem = Math.max(bRem || 0, lRem || 0, dRem || 0);

          const progress = sub && sub.total_service_days
            ? Math.round(((sub.total_service_days - maxRem) / sub.total_service_days) * 100)
            : 0;

          return (
            <div style={{
              background: 'white', border: '1.5px solid var(--color-border)',
              borderRadius: 20, padding: 20, marginBottom: 16,
              position: 'relative', overflow: 'hidden',
              boxShadow: '0 2px 12px rgba(44,94,46,0.08)',
            }}>
          {/* Left accent stripe */}
          <div style={{
            position: 'absolute', left: 0, top: 0, bottom: 0,
            width: 4, background: 'var(--color-primary)', borderRadius: '2px 0 0 2px',
          }} />
          <div style={{ paddingLeft: 12 }}>
            {/* Header row */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
              <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                {t('sub.typePlan', { type: sub.type })}
              </span>
              <Badge variant="active" dot>{t('sub.active')}</Badge>
            </div>

            {/* Amount */}
            <div style={{ fontFamily: 'Georgia, serif', fontSize: 30, fontWeight: 900, color: 'var(--color-text)' }}>
              ₹{Number(sub.amount).toLocaleString('en-IN')}
            </div>
            <div style={{ fontSize: 11, color: 'var(--color-text-light)', marginTop: 2 }}>
              {t('sub.mealsList', {
                type: sub.type,
                meals: [
                  sub.subscribe_breakfast === true ? t('meal.breakfast') : null,
                  sub.subscribe_lunch !== false ? t('meal.lunch') : null,
                  sub.subscribe_dinner !== false ? t('meal.dinner') : null
                ].filter(Boolean).join(' + ')
              })}
            </div>

            {/* Date row */}
            <div style={{ display: 'flex', gap: 20, marginTop: 16 }}>
              {[
                { label: t('common.start'),        value: formatDate(sub.start_date) },
                { label: t('common.end'),          value: maxEndDate ? formatDate(maxEndDate.toISOString()) : formatDate(sub.end_date) },
                { label: t('common.serviceDays'), value: t('sub.serviceDays', { count: sub.total_service_days ?? 0 }) },
              ].map(({ label, value }) => (
                <div key={label}>
                  <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--color-text-light)', textTransform: 'uppercase' }}>{label}</div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--color-text)' }}>{value}</div>
                </div>
              ))}
            </div>

            {/* Progress bar */}
            <div style={{ marginTop: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
                <span style={{ fontSize: 11, color: 'var(--color-text-muted)', fontWeight: 600 }}>{t('sub.remainingDays')}</span>
                <span style={{ fontSize: 11, fontWeight: 800, color: 'var(--color-primary)' }}>
                  {bRem !== null && `🍳 ${bRem}d `}
                  {lRem !== null && `🍱 ${lRem}d `}
                  {dRem !== null && `🌙 ${dRem}d`}
                </span>
              </div>
              <div style={{ background: 'var(--color-primary-light)', borderRadius: 4, height: 6 }}>
                <div style={{
                  background: 'var(--color-primary)',
                  height: 6, borderRadius: 4,
                  width: `${progress}%`,
                  transition: 'width 0.6s ease',
                }} />
              </div>
            </div>
          </div>
        </div>
        );
      })() : null}

      {/* Today's meals */}
      {(!isExpired && sub) && (
        <>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <h2 style={{ fontSize: 16, fontWeight: 800, color: 'var(--color-text)', fontFamily: 'Georgia, serif' }}>
              {t('meal.todaysMeals')}
            </h2>
            <span style={{ fontSize: 11, color: 'var(--color-text-light)', fontWeight: 600 }}>
              {formatToday()}
            </span>
          </div>

          {[
            { delivery: breakfast, label: t('meal.breakfast'), icon: '🍳', time: '8:00 – 9:00 AM', active: sub?.subscribe_breakfast === true },
            { delivery: lunch,     label: t('meal.lunch'),     icon: '🍱', time: '12:00 – 1:00 PM', active: sub?.subscribe_lunch !== false },
            { delivery: dinner,    label: t('meal.dinner'),    icon: '🌙', time: '7:00 – 8:00 PM', active: sub?.subscribe_dinner !== false },
          ].filter(item => item.active).map(({ delivery, label, icon, time }) => (
            <MealCard
              key={label}
              label={label}
              icon={icon}
              time={time}
              delivery={delivery}
            />
          ))}
        </>
      )}

      {/* Delivery History */}
      {status === 'active' && Object.keys(history).length > 0 && (
        <div style={{ marginTop: 28 }}>
          <h2 style={{ fontSize: 16, fontWeight: 800, color: 'var(--color-text)', fontFamily: 'Georgia, serif', marginBottom: 16 }}>
            {t('meal.deliveryHistory', { defaultValue: 'Delivery History' })}
          </h2>
          {Object.keys(history)
            .sort((a, b) => new Date(b).getTime() - new Date(a).getTime())
            .map((dateStr) => (
              <div key={dateStr} style={{ marginBottom: 20 }}>
                <div style={{ fontSize: 11, fontWeight: 800, color: 'var(--color-text-light)', marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                  {new Date(dateStr).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' })}
                </div>
                {history[dateStr]
                  .sort((a, b) => {
                    const order = { Breakfast: 1, Lunch: 2, Dinner: 3 };
                    return (order[a.meal_type as keyof typeof order] || 9) - (order[b.meal_type as keyof typeof order] || 9);
                  })
                  .map(d => (
                    <MealCard
                      key={d.id}
                      label={t(`meal.${d.meal_type.toLowerCase()}`, { defaultValue: d.meal_type })}
                      icon={d.meal_type === 'Breakfast' ? '🍳' : d.meal_type === 'Lunch' ? '🍱' : '🌙'}
                      time=""
                      delivery={d}
                    />
                  ))}
              </div>
          ))}
        </div>
      )}
    </div>
  );
}

function MealCard({
  label, icon, time, delivery,
}: {
  label: string;
  icon: string;
  time: string;
  delivery?: DailyDelivery;
}) {
  const { t } = useTranslation();
  const status = delivery?.status ?? 'pending';
  const skipped = status === 'skipped';
  const delivered = status === 'delivered';
  const notAvailable = status === 'not_available';
  const pendingSkip = status === 'pending_skip';

  const statusLabel =
    delivered     ? t('meal.status.delivered')
    : skipped     ? t('meal.status.skipped')
    : notAvailable? t('meal.status.notAvailable')
    : pendingSkip ? t('meal.status.pendingSkip')
    : t('meal.status.scheduled');

  const badgeVariant =
    delivered     ? 'delivered'
    : skipped     ? 'skipped'
    : notAvailable? 'not_available'
    : pendingSkip ? 'pending'
    : 'active';

  return (
    <div style={{
      background: skipped ? '#F9FAFB' : pendingSkip ? '#FFFDF5' : 'white',
      border: `1.5px solid ${skipped ? '#E5E7EB' : pendingSkip ? '#F5A623' : 'var(--color-border)'}`,
      borderRadius: 16,
      padding: '15px 16px',
      marginBottom: 10,
      opacity: skipped ? 0.8 : 1,
      transition: 'all 0.2s ease',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{
            width: 42, height: 42,
            background: skipped ? '#F3F4F6' : pendingSkip ? '#FEF3DC' : 'var(--color-primary-light)',
            borderRadius: 12,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 20,
          }}>
            {icon}
          </div>
          <div>
            <div style={{
              fontSize: 15, fontWeight: 800,
              color: skipped ? '#6B7280' : 'var(--color-text)',
              textDecoration: skipped ? 'line-through' : 'none',
            }}>
              {label}
            </div>
            <div style={{ fontSize: 11, color: 'var(--color-text-light)', marginTop: 2 }}>
              {skipped
                ? delivery?.delivery_note || t('meal.desc.skipped')
                : pendingSkip
                ? t('meal.desc.pendingSkip')
                : delivered
                ? t('meal.desc.delivered', { time: delivery?.delivered_at ? new Date(delivery.delivered_at).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Kolkata' }) : '' })
                : t('meal.desc.expected', { time })
              }
            </div>
          </div>
        </div>
        <Badge variant={badgeVariant}>{statusLabel}</Badge>
      </div>
    </div>
  );
}

function LoadingSkeleton() {
  return (
    <div>
      {[1, 2, 3].map((i) => (
        <div
          key={i}
          style={{
            borderRadius: 20,
            height: i === 1 ? 180 : 72,
            marginBottom: 12,
            background: 'linear-gradient(90deg, #f0f0f0 25%, #f8f8f8 50%, #f0f0f0 75%)',
            backgroundSize: '200% 100%',
            animation: 'shimmer 1.4s infinite',
          } as React.CSSProperties}
        />
      ))}
      <style>{`@keyframes shimmer { 0%{background-position:-200% 0} 100%{background-position:200% 0} }`}</style>
    </div>
  );
}
