import { addDays, format, parseISO } from 'date-fns'

export function weekDates(weekStart: string) {
  const start = parseISO(weekStart)
  return Array.from({ length: 7 }, (_, i) => format(addDays(start, i), 'yyyy-MM-dd'))
}

export function weekEnd(weekStart: string) {
  return format(addDays(parseISO(weekStart), 6), 'yyyy-MM-dd')
}
