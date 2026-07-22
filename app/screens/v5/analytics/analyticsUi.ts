import { categoryColors, palette, withAlpha } from '../../../theme';
import type { AnalyticsCategory, AnalyticsMeasure } from '../../../lib/analyticsTypes';

export const analyticsCategoryColors: Record<string, string> = {
  ...categoryColors,
  'Робота': '#9A4D9A',
  'Особисте': '#6378C7',
  'Навчання': '#E69A32',
  "Здоров'я": '#48A877',
  'Здоров’я': '#48A877',
  'Без категорії': '#777780',
};

export const productivityColors = {
  empty: palette.surfaceAlt,
  low: withAlpha(palette.accent, 0.14),
  medium: withAlpha(palette.accent, 0.35),
  high: withAlpha(palette.accent, 0.68),
  peak: palette.accentLight,
} as const;

export function categoryAnalyticsColor(name: string): string {
  return analyticsCategoryColors[name] ?? palette.textFaint;
}

export function normalizedCategoryPercentages(categories: AnalyticsCategory[], measure: AnalyticsMeasure): Record<string, number> {
  const values = categories.map((item) => Math.max(0, measure === 'hours' ? item.plannedMinutes : item.completedTasks));
  const total = values.reduce((sum, value) => sum + value, 0);
  if (!total) return Object.fromEntries(categories.map((item) => [item.id, 0]));
  const exact = values.map((value) => value * 100 / total);
  const rounded = exact.map(Math.floor);
  let remaining = 100 - rounded.reduce((sum, value) => sum + value, 0);
  exact
    .map((value, index) => ({ index, remainder: value - rounded[index] }))
    .sort((a, b) => b.remainder - a.remainder || a.index - b.index)
    .forEach(({ index }) => { if (remaining > 0) { rounded[index] += 1; remaining -= 1; } });
  return Object.fromEntries(categories.map((item, index) => [item.id, rounded[index]]));
}

export function formatHours(minutes: number): string {
  const safe = Math.max(0, Math.round(minutes));
  const hours = Math.floor(safe / 60);
  const rest = safe % 60;
  if (!hours) return `${rest} хв`;
  return `${hours} год${rest ? ` ${rest} хв` : ''}`;
}

/** Compact two-line value for the constrained centre of the donut chart. */
export function formatDonutCenterHours(minutes: number): string {
  const safe = Math.max(0, Math.round(minutes));
  const hours = Math.floor(safe / 60);
  const rest = safe % 60;
  if (!hours) return `${rest} хв`;
  if (!rest) return `${hours} год`;
  return `${hours} год\n${rest} хв`;
}

export function shortDayLabel(iso: string): string {
  const [, month, day] = iso.split('-');
  return `${day}.${month}`;
}

const months = [
  'січня', 'лютого', 'березня', 'квітня', 'травня', 'червня',
  'липня', 'серпня', 'вересня', 'жовтня', 'листопада', 'грудня',
];

export function formatPeriodLabel(from: string, to: string): string {
  const [fromYear, fromMonth, fromDay] = from.split('-').map(Number);
  const [toYear, toMonth, toDay] = to.split('-').map(Number);
  if (fromYear === toYear && fromMonth === toMonth) return `${fromDay}–${toDay} ${months[toMonth - 1]}`;
  if (fromYear === toYear) return `${fromDay} ${months[fromMonth - 1]} – ${toDay} ${months[toMonth - 1]}`;
  return `${fromDay} ${months[fromMonth - 1]} ${fromYear} – ${toDay} ${months[toMonth - 1]} ${toYear}`;
}
