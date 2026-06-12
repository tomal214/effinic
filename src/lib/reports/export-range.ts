import { format } from 'date-fns'

export function pickDefaultWeekStart(weeks: { weekStart: string }[]) {
  if (!weeks.length) return ''
  return weeks[weeks.length - 1].weekStart
}

export function buildExportRange(
  weeks: { weekStart: string }[],
  selectedWeekStart: string
) {
  const selected = weeks.find((w) => w.weekStart === selectedWeekStart)
  if (!selected) return null

  const start = new Date(`${selected.weekStart}T12:00:00`)
  const end = new Date(start)
  end.setDate(end.getDate() + 6)

  return {
    from: selected.weekStart,
    to: format(end, 'yyyy-MM-dd'),
  }
}
