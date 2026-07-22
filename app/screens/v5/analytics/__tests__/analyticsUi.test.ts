import { formatDonutCenterHours, formatHours, normalizedCategoryPercentages } from '../analyticsUi';
import type { AnalyticsCategory } from '../../../../lib/analyticsTypes';

const categories: AnalyticsCategory[] = [
  { id: 'a', name: 'Робота', completedTasks: 1, plannedMinutes: 61, percentage: 0 },
  { id: 'b', name: 'Особисте', completedTasks: 1, plannedMinutes: 61, percentage: 0 },
  { id: 'c', name: 'Без категорії', completedTasks: 1, plannedMinutes: 61, percentage: 0 },
];

describe('analytics UI formatting', () => {
  it('formats planned time without decimal hours', () => {
    expect(formatHours(3318)).toBe('55 год 18 хв');
    expect(formatHours(45)).toBe('45 хв');
  });

  it('wraps a long donut value onto predictable lines', () => {
    expect(formatDonutCenterHours(3470)).toBe('57 год\n50 хв');
    expect(formatDonutCenterHours(120)).toBe('2 год');
    expect(formatDonutCenterHours(45)).toBe('45 хв');
  });

  it('keeps rounded category shares at exactly 100%', () => {
    const shares = normalizedCategoryPercentages(categories, 'tasks');
    expect(Object.values(shares).reduce((sum, value) => sum + value, 0)).toBe(100);
    expect(shares).toEqual({ a: 34, b: 33, c: 33 });
  });

  it('returns zero shares when the selected measure has no data', () => {
    const shares = normalizedCategoryPercentages(categories.map((item) => ({ ...item, plannedMinutes: 0 })), 'hours');
    expect(shares).toEqual({ a: 0, b: 0, c: 0 });
  });
});
