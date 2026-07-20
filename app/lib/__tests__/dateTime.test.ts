import { isoToDisplayDate, displayDateToIso, normalizeTime, timeToDisplay } from '../dateTime';

describe('isoToDisplayDate', () => {
  it('converts ISO to DD-MM-YYYY', () => {
    expect(isoToDisplayDate('2026-07-20')).toBe('20-07-2026');
  });
  it('returns empty string for null/invalid', () => {
    expect(isoToDisplayDate(null)).toBe('');
    expect(isoToDisplayDate('nonsense')).toBe('');
  });
});

describe('displayDateToIso', () => {
  it('converts DD-MM-YYYY to ISO', () => {
    expect(displayDateToIso('20-07-2026')).toBe('2026-07-20');
  });
  it('accepts / and . separators', () => {
    expect(displayDateToIso('05/03/2026')).toBe('2026-03-05');
    expect(displayDateToIso('1.1.2026')).toBe('2026-01-01');
  });
  it('returns null for empty input', () => {
    expect(displayDateToIso('   ')).toBeNull();
  });
  it('throws on impossible dates', () => {
    expect(() => displayDateToIso('31-02-2026')).toThrow();
    expect(() => displayDateToIso('20-13-2026')).toThrow();
    expect(() => displayDateToIso('20-07-26')).toThrow();
  });
});

describe('normalizeTime', () => {
  it('expands a bare hour to HH:00', () => {
    expect(normalizeTime('15')).toBe('15:00');
    expect(normalizeTime('9')).toBe('09:00');
  });
  it('pads single-digit minutes', () => {
    expect(normalizeTime('9:5')).toBe('09:05');
  });
  it('accepts full HH:MM', () => {
    expect(normalizeTime('15:30')).toBe('15:30');
  });
  it('parses compact digit forms', () => {
    expect(normalizeTime('930')).toBe('09:30');
    expect(normalizeTime('1530')).toBe('15:30');
  });
  it('accepts a dot separator', () => {
    expect(normalizeTime('9.30')).toBe('09:30');
  });
  it('returns null for empty input', () => {
    expect(normalizeTime('')).toBeNull();
  });
  it('throws on out-of-range values', () => {
    expect(() => normalizeTime('25')).toThrow();
    expect(() => normalizeTime('12:70')).toThrow();
    expect(() => normalizeTime('abc')).toThrow();
  });
});

describe('timeToDisplay', () => {
  it('trims seconds', () => {
    expect(timeToDisplay('15:00:00')).toBe('15:00');
  });
  it('returns empty for null', () => {
    expect(timeToDisplay(null)).toBe('');
  });
});
