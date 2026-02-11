import { translations, type Language } from '@/lib/i18n/translations';

export function formatDate(isoString: string): string {
  const date = new Date(isoString);
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

export function formatRelativeDate(isoString: string, language: Language = 'en'): string {
  // Backend returns UTC timestamps without Z suffix, so append it
  const normalized = isoString.endsWith('Z') ? isoString : isoString + 'Z';
  const date = new Date(normalized);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  const t = translations[language] || translations['en'];

  if (diffMins < 1) return t['date.justNow'];
  if (diffMins < 60) return t['date.minutesAgo'].replace('{n}', String(diffMins));
  if (diffHours < 24) return t['date.hoursAgo'].replace('{n}', String(diffHours));
  if (diffDays < 7) return t['date.daysAgo'].replace('{n}', String(diffDays));
  return formatDate(isoString);
}
