'use client';

import React, { useEffect, useState } from 'react';
import Badge from '@/components/ui/Badge';
import Modal from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import type { SkipRequest } from '@/types';
import { formatDate, addServiceDays } from '@/lib/dateUtils';
import { useTranslation } from '@/i18n';

type MealType = 'Breakfast' | 'Lunch' | 'Dinner';

function todayStr() {
  return new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' });
}

function tomorrowStr() {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return d.toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' });
}

function formatDateLabel(iso: string) {
  return new Date(iso).toLocaleDateString('en-IN', {
    weekday: 'short', day: 'numeric', month: 'short', year: 'numeric',
    timeZone: 'Asia/Kolkata',
  });
}

const MONTHS = {
  en: [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ],
  ta: [
    'ஜனவரி', 'பிப்ரவரி', 'மார்ச்', 'ஏப்ரல்', 'மே', 'ஜூன்',
    'ஜூலை', 'ஆகஸ்ட்', 'செப்டம்பர்', 'அக்டோபர்', 'நவம்பர்', 'டிசம்பர்'
  ]
};

const WEEKDAYS = {
  en: ['M', 'T', 'W', 'T', 'F', 'S', 'S'],
  ta: ['தி', 'செ', 'பு', 'வி', 'வெ', 'ச', 'ஞ']
};

export default function SkipMealPage() {
  const { t, locale } = useTranslation();
  const [sub, setSub] = useState<any | null>(null);
  const [selectedDates, setSelectedDates] = useState<string[]>([]);
  const [selectedMeals, setSelectedMeals] = useState<MealType[]>([]);
  const [requests, setRequests] = useState<SkipRequest[]>([]);
  const [loading, setLoading] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Calendar states
  const [currentYear, setCurrentYear] = useState<number>(() => new Date().getFullYear());
  const [currentMonth, setCurrentMonth] = useState<number>(() => new Date().getMonth());

  // Define date limits derived from subscription
  const minDateStr = sub && sub.start_date.slice(0, 10) > todayStr() ? sub.start_date.slice(0, 10) : todayStr();
  const skipsCount = requests.filter(r => r.status === 'approved').length;
  const maxDateStr = sub ? addServiceDays(sub.end_date, skipsCount).toISOString().slice(0, 10) : '';

  useEffect(() => {
    fetch('/api/client/skip-requests')
      .then((r) => r.json())
      .then((d) => setRequests(d.data ?? []));

    fetch('/api/client/subscription')
      .then((r) => r.json())
      .then((d) => {
        setSub(d.data);
        if (d.data) {
          const today = todayStr();
          const start = d.data.start_date.slice(0, 10);
          const defaultDate = start > today ? start : today;
          
          // Verify default date is not a Sunday
          const isSun = new Date(defaultDate + 'T12:00:00').getDay() === 0;
          if (!isSun) {
            setSelectedDates([defaultDate]);
          } else {
            const nextD = new Date(defaultDate + 'T12:00:00');
            nextD.setDate(nextD.getDate() + 1);
            setSelectedDates([nextD.toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' })]);
          }
          setSelectedMeals([]);

          // Set calendar month and year to default date month/year
          const [defaultYr, defaultMon] = defaultDate.split('-').map(Number);
          setCurrentYear(defaultYr);
          setCurrentMonth(defaultMon - 1);
        }
      });
  }, []);

  const toggleMeal = (m: MealType) => {
    setSelectedMeals((prev) => {
      if (prev.includes(m)) {
        return prev.filter((x) => x !== m);
      } else {
        return [...prev, m];
      }
    });
  };

  const toggleDate = (dStr: string) => {
    setError('');
    const targetDate = new Date(dStr + 'T12:00:00');
    if (targetDate.getDay() === 0) {
      setError(t('skip.sundayError'));
      return;
    }
    setSelectedDates((prev) => {
      if (prev.includes(dStr)) {
        return prev.filter((x) => x !== dStr);
      } else {
        return [...prev, dStr];
      }
    });
  };

  const toKolkataDateStr = (d: Date) => {
    return d.toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' });
  };

  const getDaysInMonth = (year: number, month: number) => {
    const firstDay = new Date(year, month, 1, 12, 0, 0);
    const days = [];
    
    // getDay() is 0 for Sunday, 1 for Monday, ..., 6 for Saturday
    const firstDayOfWeek = firstDay.getDay();
    // Monday = 0, Sunday = 6
    const prefixDays = firstDayOfWeek === 0 ? 6 : firstDayOfWeek - 1;
    
    const prevMonthLast = new Date(year, month, 0, 12, 0, 0).getDate();
    for (let i = prefixDays - 1; i >= 0; i--) {
      days.push({
        date: new Date(year, month - 1, prevMonthLast - i, 12, 0, 0),
        isCurrentMonth: false,
      });
    }
    
    const currentMonthLast = new Date(year, month + 1, 0, 12, 0, 0).getDate();
    for (let i = 1; i <= currentMonthLast; i++) {
      days.push({
        date: new Date(year, month, i, 12, 0, 0),
        isCurrentMonth: true,
      });
    }
    
    const totalCells = days.length <= 35 ? 35 : 42;
    const remaining = totalCells - days.length;
    for (let i = 1; i <= remaining; i++) {
      days.push({
        date: new Date(year, month + 1, i, 12, 0, 0),
        isCurrentMonth: false,
      });
    }
    return days;
  };

  const minDate = new Date(minDateStr + 'T12:00:00');
  const maxDate = maxDateStr ? new Date(maxDateStr + 'T12:00:00') : null;

  const isPrevDisabled = () => {
    const minYr = minDate.getFullYear();
    const minMon = minDate.getMonth();
    return currentYear < minYr || (currentYear === minYr && currentMonth <= minMon);
  };

  const isNextDisabled = () => {
    if (!maxDate) return false;
    const maxYr = maxDate.getFullYear();
    const maxMon = maxDate.getMonth();
    return currentYear > maxYr || (currentYear === maxYr && currentMonth >= maxMon);
  };

  const handlePrevMonth = () => {
    setCurrentMonth((prev) => {
      if (prev === 0) {
        setCurrentYear((y) => y - 1);
        return 11;
      }
      return prev - 1;
    });
  };

  const handleNextMonth = () => {
    setCurrentMonth((prev) => {
      if (prev === 11) {
        setCurrentYear((y) => y + 1);
        return 0;
      }
      return prev + 1;
    });
  };

  const getLocalizedMealName = (m: string) => {
    if (m === 'Breakfast') return t('meal.breakfast');
    if (m === 'Lunch') return t('meal.lunch');
    return t('meal.dinner');
  };

  const getStatusLabel = (status: string) => {
    if (status === 'approved') return t('meal.status.skipped'); // "Admin Acknowledged"
    if (status === 'pending') return t('skip.pending');
    if (status === 'rejected') return t('skip.rejected');
    return status;
  };

  function handleRequestClick() {
    setError('');
    if (selectedDates.length === 0) {
      setError(t('skip.noDates'));
      return;
    }
    if (selectedMeals.length === 0) {
      setError(t('skip.selectMeal'));
      return;
    }

    const today = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' });
    const now = new Date();
    const istTimeStr = now.toLocaleTimeString('en-US', { timeZone: 'Asia/Kolkata', hour12: false });
    const [hour, minute] = istTimeStr.split(':').map(Number);
    const timeInMinutes = hour * 60 + minute;

    // Check same-day cutoff times
    if (selectedDates.includes(today)) {
      for (const m of selectedMeals) {
        if (m === 'Breakfast' && timeInMinutes >= 6 * 60) {
          setError(t('skip.cutoff.breakfast'));
          return;
        }
        if (m === 'Lunch' && timeInMinutes >= 8 * 60) {
          setError(t('skip.cutoff.lunch'));
          return;
        }
        if (m === 'Dinner' && timeInMinutes >= 15 * 60) {
          setError(t('skip.cutoff.dinner'));
          return;
        }
      }
    }

    if (requestsToSubmit.length === 0) {
      setError('Skips already requested for all selected dates and meals.');
      return;
    }

    setShowConfirm(true);
  }

  async function submitSkip() {
    setLoading(true);
    setError('');
    try {
      const promises = requestsToSubmit.map(({ date: d, meal: m }) =>
        fetch('/api/client/skip-requests', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ date: d, meal_type: m }),
        })
      );
      const responses = await Promise.all(promises);
      let successCount = 0;
      let lastError = '';
      const newRequests: SkipRequest[] = [];

      for (const res of responses) {
        const data = await res.json();
        if (data.success) {
          successCount++;
          newRequests.push(data.data);
        } else {
          lastError = data.error ?? t('skip.failed');
        }
      }

      if (successCount > 0) {
        setShowConfirm(false);
        setSuccessMsg(t('skip.success_multi', { count: successCount }));
        setRequests((prev) => [...newRequests, ...prev]);
        setSelectedDates([]);
        setSelectedMeals([]);
      } else {
        setError(lastError || t('skip.failed'));
        setShowConfirm(false);
      }
    } finally {
      setLoading(false);
    }
  }

  const getExistingSkip = (dStr: string, meal: MealType) => {
    return requests.find(
      (r) => r.date.slice(0, 10) === dStr && r.meal_type === meal
    );
  };

  const requestsToSubmit: { date: string; meal: MealType }[] = [];
  for (const d of selectedDates) {
    for (const m of selectedMeals) {
      const alreadyExists = requests.some(
        (r) => r.date.slice(0, 10) === d && r.meal_type === m
      );
      if (!alreadyExists) {
        requestsToSubmit.push({ date: d, meal: m });
      }
    }
  }

  const status = sub ? sub.status : 'expired';
  const isExpired = status === 'expired';

  const todayVal = todayStr();
  const tomorrowVal = tomorrowStr();
  const showTodayBtn = todayVal >= minDateStr && (!maxDateStr || todayVal <= maxDateStr) && new Date(todayVal + 'T00:00:00').getDay() !== 0;
  const showTomorrowBtn = tomorrowVal >= minDateStr && (!maxDateStr || tomorrowVal <= maxDateStr) && new Date(tomorrowVal + 'T00:00:00').getDay() !== 0;

  return (
    <div style={{ animation: 'fadeIn 0.3s ease' }}>
      <h1 style={{
        fontSize: 22, fontWeight: 900, color: 'var(--color-text)',
        fontFamily: 'Georgia, serif', marginBottom: 6,
      }}>
        {t('skip.title')}
      </h1>
      <p style={{ fontSize: 13, color: 'var(--color-text-muted)', marginBottom: 24, lineHeight: 1.6 }}>
        {t('skip.subtitle')}
      </p>

      {successMsg && (
        <div style={{
          background: '#EBF5EB', border: '1px solid #A8D4A8',
          borderRadius: 12, padding: '12px 16px', marginBottom: 16,
          fontSize: 13, fontWeight: 600, color: '#2C5E2E',
          display: 'flex', alignItems: 'center', gap: 8,
        }}>
          ✓ {successMsg}
        </div>
      )}

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
            {t('skip.noActiveMsg')}
          </div>
        </div>
      ) : (
        <>
          {/* Step 1: Date */}
          <div style={sectionCard}>
            <label style={sectionLabel}>{t('skip.step1')}</label>
            {(showTodayBtn || showTomorrowBtn) && (
              <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
                {showTodayBtn && (
                  <button
                    onClick={() => toggleDate(todayVal)}
                    style={{
                      flex: 1, padding: '10px 8px',
                      background: selectedDates.includes(todayVal) ? 'var(--color-primary)' : 'var(--color-bg)',
                      color: selectedDates.includes(todayVal) ? 'white' : 'var(--color-text-muted)',
                      border: `1.5px solid ${selectedDates.includes(todayVal) ? 'var(--color-primary)' : 'var(--color-border)'}`,
                      borderRadius: 10, fontWeight: 700, fontSize: 12, cursor: 'pointer',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    {t('skip.today')}
                  </button>
                )}
                {showTomorrowBtn && (
                  <button
                    onClick={() => toggleDate(tomorrowVal)}
                    style={{
                      flex: 1, padding: '10px 8px',
                      background: selectedDates.includes(tomorrowVal) ? 'var(--color-primary)' : 'var(--color-bg)',
                      color: selectedDates.includes(tomorrowVal) ? 'white' : 'var(--color-text-muted)',
                      border: `1.5px solid ${selectedDates.includes(tomorrowVal) ? 'var(--color-primary)' : 'var(--color-border)'}`,
                      borderRadius: 10, fontWeight: 700, fontSize: 12, cursor: 'pointer',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    {t('skip.tomorrow')}
                  </button>
                )}
              </div>
            )}
            <div style={{ marginBottom: 12 }}>
              {/* Calendar Header */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
                <button
                  type="button"
                  onClick={handlePrevMonth}
                  disabled={isPrevDisabled()}
                  style={{
                    width: 32, height: 32,
                    borderRadius: '50%',
                    border: '1px solid var(--color-border)',
                    background: 'white',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    cursor: 'pointer',
                    fontSize: 16,
                    fontWeight: 'bold',
                    opacity: isPrevDisabled() ? 0.3 : 1,
                    pointerEvents: isPrevDisabled() ? 'none' : 'auto',
                    transition: 'all 0.15s ease',
                  }}
                >
                  ‹
                </button>
                <span style={{ fontFamily: 'Georgia, serif', fontSize: 15, fontWeight: 800, color: 'var(--color-text)' }}>
                  {MONTHS[locale as 'en' | 'ta'][currentMonth]} {currentYear}
                </span>
                <button
                  type="button"
                  onClick={handleNextMonth}
                  disabled={isNextDisabled()}
                  style={{
                    width: 32, height: 32,
                    borderRadius: '50%',
                    border: '1px solid var(--color-border)',
                    background: 'white',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    cursor: 'pointer',
                    fontSize: 16,
                    fontWeight: 'bold',
                    opacity: isNextDisabled() ? 0.3 : 1,
                    pointerEvents: isNextDisabled() ? 'none' : 'auto',
                    transition: 'all 0.15s ease',
                  }}
                >
                  ›
                </button>
              </div>

              {/* Weekdays Row */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 6, textAlign: 'center', marginBottom: 8 }}>
                {WEEKDAYS[locale as 'en' | 'ta'].map((day, idx) => (
                  <div key={idx} style={{ fontSize: 11, fontWeight: 700, color: idx === 6 ? 'var(--color-error)' : 'var(--color-text-muted)' }}>
                    {day}
                  </div>
                ))}
              </div>

              {/* Days Grid */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 6 }}>
                {getDaysInMonth(currentYear, currentMonth).map((day, idx) => {
                  const cellDateStr = toKolkataDateStr(day.date);
                  const isSunday = day.date.getDay() === 0;
                  const isOutOfRange = cellDateStr < minDateStr || (maxDateStr && cellDateStr > maxDateStr);
                  const isValid = day.isCurrentMonth && !isSunday && !isOutOfRange;
                  const isSelected = selectedDates.includes(cellDateStr);

                  // Skips indicators
                  const skipsForDate = requests.filter((r) => r.date.slice(0, 10) === cellDateStr);
                  const hasApproved = skipsForDate.some((r) => r.status === 'approved');
                  const hasPending = skipsForDate.some((r) => r.status === 'pending');

                  let cellStyle: React.CSSProperties = {
                    aspectRatio: '1',
                    borderRadius: 12,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 13,
                    fontWeight: 700,
                    cursor: 'pointer',
                    position: 'relative',
                    transition: 'all 0.15s ease',
                    border: 'none',
                    background: 'transparent',
                    outline: 'none',
                  };

                  if (!day.isCurrentMonth) {
                    cellStyle = {
                      ...cellStyle,
                      color: 'var(--color-text-light)',
                      opacity: 0.25,
                      cursor: 'not-allowed',
                    };
                  } else if (isSunday) {
                    cellStyle = {
                      ...cellStyle,
                      color: 'var(--color-error)',
                      background: '#FEF2F2',
                      opacity: 0.5,
                      cursor: 'not-allowed',
                    };
                  } else if (isOutOfRange) {
                    cellStyle = {
                      ...cellStyle,
                      color: 'var(--color-text-light)',
                      opacity: 0.3,
                      cursor: 'not-allowed',
                    };
                  } else if (isSelected) {
                    cellStyle = {
                      ...cellStyle,
                      color: 'white',
                      background: 'var(--color-primary)',
                      boxShadow: '0 2px 6px rgba(44,94,46,0.2)',
                    };
                  } else {
                    cellStyle = {
                      ...cellStyle,
                      color: 'var(--color-text)',
                      background: 'var(--color-bg)',
                      border: '1px solid var(--color-border)',
                    };
                  }

                  return (
                    <button
                      key={idx}
                      type="button"
                      disabled={!isValid}
                      onClick={() => toggleDate(cellDateStr)}
                      style={cellStyle}
                    >
                      <span>{day.date.getDate()}</span>
                      
                      {/* Existing skip dots */}
                      {day.isCurrentMonth && (hasApproved || hasPending) && (
                        <span style={{
                          position: 'absolute',
                          bottom: 4,
                          width: 5,
                          height: 5,
                          borderRadius: '50%',
                          background: isSelected ? 'var(--color-accent)' : (hasApproved ? 'var(--color-text-muted)' : 'var(--color-accent)'),
                        }} />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Display list of selected dates */}
            {selectedDates.length > 0 && (
              <div style={{ marginTop: 12 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase', marginBottom: 6 }}>
                  {t('skip.selectedDates')}
                </div>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  {selectedDates.map((dStr) => (
                    <div key={dStr} style={{
                      background: 'var(--color-primary-light)',
                      border: '1.5px solid var(--color-primary)',
                      borderRadius: 10,
                      padding: '6px 12px',
                      fontSize: 12,
                      fontWeight: 700,
                      color: 'var(--color-primary)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                    }}>
                      <span>{formatDateLabel(dStr)}</span>
                      <button
                        type="button"
                        onClick={() => toggleDate(dStr)}
                        style={{
                          background: 'none',
                          border: 'none',
                          color: '#DC2626',
                          cursor: 'pointer',
                          fontWeight: 'bold',
                          padding: 0,
                          fontSize: 12,
                        }}
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Step 2: Meal */}
          <div style={sectionCard}>
            <label style={sectionLabel}>{t('skip.step2')}</label>
            <div style={{ display: 'flex', gap: 8 }}>
              {([['Breakfast', '🍳', sub?.subscribe_breakfast === true], ['Lunch', '🍱', sub?.subscribe_lunch !== false], ['Dinner', '🌙', sub?.subscribe_dinner !== false]] as [MealType, string, boolean][])
                .filter(([,, active]) => active)
                .map(([m, icon]) => {
                  const isSel = selectedMeals.includes(m);
                  return (
                    <button
                      key={m}
                      onClick={() => toggleMeal(m)}
                      style={{
                        flex: 1, padding: '14px 8px',
                        background: isSel ? 'var(--color-primary)' : 'var(--color-bg)',
                        color: isSel ? 'white' : 'var(--color-text-muted)',
                        border: `1.5px solid ${isSel ? 'var(--color-primary)' : 'var(--color-border)'}`,
                        borderRadius: 12, fontWeight: 700, fontSize: 14, cursor: 'pointer',
                        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
                        transition: 'all 0.15s ease',
                      }}
                    >
                      <span style={{ fontSize: 22 }}>{icon}</span>
                      <span>{getLocalizedMealName(m)}</span>
                    </button>
                  );
                })}
            </div>
          </div>

          {/* Error */}
          {error && (
            <div style={{
              background: '#FEF2F2', border: '1px solid #FECACA',
              borderRadius: 12, padding: '10px 14px', marginBottom: 12,
              fontSize: 13, fontWeight: 600, color: '#DC2626',
            }}>
              ⚠ {error}
            </div>
          )}

          {/* Existing skips warning */}
          {selectedDates.flatMap((d) => 
            selectedMeals.map((m) => {
              const skip = getExistingSkip(d, m);
              if (!skip) return null;
              return (
                <div key={`${d}-${m}`} style={{
                  background: '#F7F8F5', border: '1.5px solid var(--color-border)',
                  borderRadius: 12, padding: '12px 16px', marginBottom: 16,
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-text-muted)' }}>
                    {t('skip.alreadyRequested', { meal: getLocalizedMealName(m) })} ({formatDateLabel(d)})
                  </div>
                  <Badge variant={skip.status === 'approved' ? 'skipped' : skip.status}>
                    {getStatusLabel(skip.status)}
                  </Badge>
                </div>
              );
            })
          )}

          {requestsToSubmit.length > 0 && (
            <Button
              variant="accent"
              fullWidth
              onClick={handleRequestClick}
            >
              {t('skip.requestBtn')} ({requestsToSubmit.length}) →
            </Button>
          )}
        </>
      )}

      {/* My Skip Requests */}
      {requests.length > 0 && (
        <div style={{ marginTop: 28 }}>
          <h3 style={{
            fontSize: 12, fontWeight: 700, color: 'var(--color-text-muted)',
            textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 12,
          }}>
            {t('skip.myRequests')}
          </h3>
          {requests.map((r) => (
            <div
              key={r.id}
              style={{
                background: 'white',
                border: `1.5px solid ${r.status === 'pending' ? '#FEF3DC' : 'var(--color-border)'}`,
                borderRadius: 12, padding: '13px 16px',
                marginBottom: 8,
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              }}
            >
              <div>
                <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--color-text)' }}>
                  {getLocalizedMealName(r.meal_type as MealType)} — {formatDateLabel(r.date)}
                </div>
                <div style={{ fontSize: 11, color: 'var(--color-text-light)', marginTop: 2 }}>
                  {t('skip.requestedAt', { date: formatDateLabel(r.requested_at) })}
                </div>
              </div>
              <Badge variant={r.status === 'approved' ? 'skipped' : r.status}>
                {getStatusLabel(r.status)}
              </Badge>
            </div>
          ))}
        </div>
      )}

      {/* Confirm Modal */}
      <Modal open={showConfirm} onClose={() => setShowConfirm(false)}>
        <div style={{ textAlign: 'center', marginBottom: 20 }}>
          <div style={{ fontSize: 44, marginBottom: 10 }}>⏭</div>
          <h3 style={{ fontSize: 19, fontWeight: 800, color: 'var(--color-text)', margin: '0 0 8px' }}>
            {t('skip.confirmTitle')}
          </h3>
          <p style={{ fontSize: 13, color: 'var(--color-text-muted)', lineHeight: 1.6, marginBottom: 12 }}>
            Are you sure you want to skip the selected meals for:
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4, margin: '10px 0', alignItems: 'center', maxHeight: 150, overflowY: 'auto' }}>
            {selectedDates.map(d => (
              <div key={d} style={{ fontSize: 12, fontWeight: 700, color: 'var(--color-primary)' }}>
                • {formatDateLabel(d)}: {selectedMeals.map(m => getLocalizedMealName(m)).join(', ')}
              </div>
            ))}
          </div>
          <p style={{ fontSize: 12, color: 'var(--color-text-light)', marginTop: 6 }}>
            {t('skip.confirmSubtitle')}
          </p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <Button variant="ghost" fullWidth onClick={() => setShowConfirm(false)}>{t('common.cancel')}</Button>
          <Button variant="primary" fullWidth loading={loading} onClick={submitSkip}>{t('skip.confirmBtn')}</Button>
        </div>
      </Modal>
    </div>
  );
}

const sectionCard: React.CSSProperties = {
  background: 'white',
  border: '1.5px solid var(--color-border)',
  borderRadius: 16, padding: 16, marginBottom: 14,
};

const sectionLabel: React.CSSProperties = {
  display: 'block',
  fontSize: 11, fontWeight: 700,
  color: 'var(--color-text-muted)',
  textTransform: 'uppercase', letterSpacing: '0.08em',
  marginBottom: 10,
};
