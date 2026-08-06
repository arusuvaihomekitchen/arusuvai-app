import type { Subscription } from '@/types';

/**
 * Count service days (excluding Sundays) between two dates, inclusive.
 */
export function countServiceDays(startDate: Date, endDate: Date): number {
  let count = 0;
  const d = new Date(startDate);
  d.setHours(0, 0, 0, 0);
  const end = new Date(endDate);
  end.setHours(23, 59, 59, 999);

  while (d <= end) {
    const dow = d.getDay(); // 0 = Sunday
    if (dow !== 0) count++;
    d.setDate(d.getDate() + 1);
  }
  return count;
}

/**
 * Add service days (skipping Sundays) to a given date.
 */
export function addServiceDays(startDate: Date | string, daysToAdd: number): Date {
  const current = new Date(startDate);
  current.setHours(12, 0, 0, 0); // Avoid timezone boundary issues
  let added = 0;
  while (added < daysToAdd) {
    current.setDate(current.getDate() + 1);
    if (current.getDay() !== 0) added++; // Skip Sundays
  }
  return current;
}

/**
 * Count remaining service days from today (inclusive) to endDate.
 */
export function serviceDaysRemaining(endDate: Date): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  if (endDate < today) return 0;
  return countServiceDays(today, endDate);
}

/**
 * Compute subscription status from dates (not the stored status column).
 */
export function getSubscriptionStatus(
  sub: Pick<Subscription, 'start_date' | 'end_date'>
): 'active' | 'expired' | 'not_started' {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const start = new Date(sub.start_date);
  const end = new Date(sub.end_date);
  if (today < start) return 'not_started';
  if (today > end) return 'expired';
  return 'active';
}

/**
 * Format a date string (YYYY-MM-DD) as "01 Jun 2026"
 */
export function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    timeZone: 'Asia/Kolkata',
  });
}

/**
 * Format today as "Mon, 22 Jun 2026"
 */
export function formatToday(): string {
  return new Date().toLocaleDateString('en-IN', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    timeZone: 'Asia/Kolkata',
  });
}

/**
 * Get today's date as YYYY-MM-DD in IST
 */
export function todayIST(): string {
  return new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' });
}

/**
 * Get greeting based on time of day
 */
export function getGreeting(): string {
  const hour = new Date().toLocaleString('en-IN', {
    hour: 'numeric',
    hour12: false,
    timeZone: 'Asia/Kolkata',
  });
  const h = parseInt(hour);
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
}
