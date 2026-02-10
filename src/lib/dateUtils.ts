import { addMonths, parseISO, subDays, format } from 'date-fns'

/**
 * Returns today's date in ISO format (yyyy-MM-dd).
 */
export function getTodayISO(): string {
  return new Date().toISOString().slice(0, 10)
}

/**
 * Adds N months to a date string (ISO yyyy-MM-dd) and returns the end date (inclusive).
 * The end date is the day before the same day N months later.
 * Example: addMonthsToDate('2025-01-15', 12) → '2026-01-14'
 * Example: addMonthsToDate('2025-01-01', 6)  → '2025-06-30'
 */
export function addMonthsToDate(dateISO: string, months: number): string {
  const start = parseISO(dateISO)
  const end = subDays(addMonths(start, months), 1)
  return format(end, 'yyyy-MM-dd')
}
