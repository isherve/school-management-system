import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const CURRENCY_LOCALE: Record<string, string> = {
  RWF: 'rw-RW',
  KES: 'en-KE',
  USD: 'en-US',
  EUR: 'de-DE',
};

export function formatCurrency(amount: number, currency = 'RWF'): string {
  const locale = CURRENCY_LOCALE[currency] || 'rw-RW';
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatDate(date: string | Date): string {
  return new Intl.DateTimeFormat('en-GB', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(new Date(date));
}

export function getInitials(firstName: string, lastName: string): string {
  return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
}

export function getRoleLabel(role: string): string {
  return role.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

export const STATUS_STYLES: Record<string, string> = {
  PAID: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400',
  ACTIVE: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400',
  PRESENT: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400',
  APPROVED: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400',
  PUBLISHED: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400',
  PARTIAL: 'bg-amber-500/15 text-amber-700 dark:text-amber-400',
  PENDING: 'bg-amber-500/15 text-amber-700 dark:text-amber-400',
  SENT: 'bg-blue-500/15 text-blue-700 dark:text-blue-400',
  OVERDUE: 'bg-red-500/15 text-red-700 dark:text-red-400',
  ABSENT: 'bg-red-500/15 text-red-700 dark:text-red-400',
  REJECTED: 'bg-red-500/15 text-red-700 dark:text-red-400',
  DRAFT: 'bg-slate-500/15 text-slate-600 dark:text-slate-400',
  INACTIVE: 'bg-slate-500/15 text-slate-600 dark:text-slate-400',
  LATE: 'bg-amber-500/15 text-amber-700 dark:text-amber-400',
  EXCUSED: 'bg-blue-500/15 text-blue-700 dark:text-blue-400',
};

export function getStatusStyle(status: string): string {
  return STATUS_STYLES[status] || 'bg-slate-500/15 text-slate-600 dark:text-slate-400';
}

export function initTheme() {
  try {
    const stored = localStorage.getItem('theme-storage');
    const theme = stored ? JSON.parse(stored)?.state?.theme : 'light';
    document.documentElement.classList.toggle('dark', theme === 'dark');
  } catch {
    document.documentElement.classList.remove('dark');
  }
}
