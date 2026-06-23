// WAT is a fixed UTC+1 offset year-round (no DST), so we can shift by a constant
// rather than pulling in a timezone library. The daily verse, streak check-in,
// and the midnight sweep all reckon "today" by the WAT calendar.
const WAT_OFFSET_MS = 60 * 60 * 1000;

// YYYY-MM-DD for the given instant in WAT.
export function watDateString(d: Date = new Date()): string {
  return new Date(d.getTime() + WAT_OFFSET_MS).toISOString().slice(0, 10);
}

// The UTC instant of 00:00 WAT for a given WAT date string.
export function watDayStartUtc(watDateStr: string): Date {
  return new Date(`${watDateStr}T00:00:00+01:00`);
}

// WAT date string for the day before the given instant.
export function watYesterdayString(d: Date = new Date()): string {
  return watDateString(new Date(d.getTime() - 24 * 60 * 60 * 1000));
}
