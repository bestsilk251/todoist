/**
 * Conversions between what the user types and what the database stores.
 *
 * DB format: date = "YYYY-MM-DD", time = "HH:MM" (24h).
 * UI format: date = "DD-MM-YYYY" (день-місяць-рік), time = flexible ("15",
 * "9:5", "1530" …) which we normalize to "HH:MM".
 */

/** ISO "YYYY-MM-DD" → display "DD-MM-YYYY". Empty/invalid → "". */
export function isoToDisplayDate(iso: string | null | undefined): string {
  if (!iso) return '';
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
  if (!m) return '';
  const [, y, mo, d] = m;
  return `${d}-${mo}-${y}`;
}

/**
 * Display "DD-MM-YYYY" (accepts - / . as separators) → ISO "YYYY-MM-DD".
 * Empty input → null. Invalid or impossible date → throws.
 */
export function displayDateToIso(input: string): string | null {
  const trimmed = input.trim();
  if (!trimmed) return null;

  const parts = trimmed.split(/[-/.]/).map((p) => p.trim());
  if (parts.length !== 3) throw new Error('bad date');

  const [dStr, moStr, yStr] = parts;
  if (!/^\d{1,2}$/.test(dStr) || !/^\d{1,2}$/.test(moStr) || !/^\d{4}$/.test(yStr)) {
    throw new Error('bad date');
  }

  const day = Number(dStr);
  const month = Number(moStr);
  const year = Number(yStr);

  if (month < 1 || month > 12 || day < 1 || day > 31) throw new Error('bad date');

  // Reject impossible days like 31-02 by round-tripping through Date.
  const iso = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
  const check = new Date(`${iso}T00:00:00Z`);
  if (
    check.getUTCFullYear() !== year ||
    check.getUTCMonth() + 1 !== month ||
    check.getUTCDate() !== day
  ) {
    throw new Error('bad date');
  }

  return iso;
}

/**
 * Flexible time input → "HH:MM". Empty → null. Invalid → throws.
 *
 * Accepts: "15" → "15:00", "9" → "09:00", "9:5" → "09:05",
 * "1530" → "15:30", "9.30" → "09:30".
 */
export function normalizeTime(input: string): string | null {
  const trimmed = input.trim();
  if (!trimmed) return null;

  let hours: number;
  let minutes: number;

  const cleaned = trimmed.replace('.', ':');

  if (cleaned.includes(':')) {
    const [h, m] = cleaned.split(':');
    if (!/^\d{1,2}$/.test(h) || !/^\d{0,2}$/.test(m)) throw new Error('bad time');
    hours = Number(h);
    minutes = m === '' ? 0 : Number(m);
  } else if (/^\d{1,2}$/.test(cleaned)) {
    // Just an hour: "15" → 15:00
    hours = Number(cleaned);
    minutes = 0;
  } else if (/^\d{3}$/.test(cleaned)) {
    // "930" → 9:30
    hours = Number(cleaned.slice(0, 1));
    minutes = Number(cleaned.slice(1));
  } else if (/^\d{4}$/.test(cleaned)) {
    // "1530" → 15:30
    hours = Number(cleaned.slice(0, 2));
    minutes = Number(cleaned.slice(2));
  } else {
    throw new Error('bad time');
  }

  if (hours < 0 || hours > 23 || minutes < 0 || minutes > 59) throw new Error('bad time');

  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
}

/** DB "HH:MM:SS"/"HH:MM" → display "HH:MM". Empty → "". */
export function timeToDisplay(time: string | null | undefined): string {
  if (!time) return '';
  return time.slice(0, 5);
}
