/**
 * Parse YYYY-MM-DD as a local calendar date.
 * Avoid `new Date('yyyy-MM-dd')` — that is UTC midnight and shifts the day
 * in timezones west of UTC (e.g. shows on the previous calendar day).
 */
export function parseLocalDate(dateStr: string): Date {
  const [year, month, day] = dateStr.split('-').map(Number);
  return new Date(year, month - 1, day);
}
