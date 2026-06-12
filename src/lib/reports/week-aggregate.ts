import { addWeeks, format, startOfWeek, subWeeks } from 'date-fns'

export type WeekBucket = {
  weekStart: string
  weekLabel: string
  totalTasks: number
  completedTasks: number
  completionRate: number
  incidentCount: number
}

export function buildWeekRanges(anchor: Date, weeks = 8) {
  const currentWeekStart = startOfWeek(anchor, { weekStartsOn: 1 })
  const ranges: { weekStart: string; weekEnd: string; weekLabel: string }[] =
    []

  for (let i = weeks - 1; i >= 0; i -= 1) {
    const start = subWeeks(currentWeekStart, i)
    const end = addWeeks(start, 1)
    end.setDate(end.getDate() - 1)
    ranges.push({
      weekStart: format(start, 'yyyy-MM-dd'),
      weekEnd: format(end, 'yyyy-MM-dd'),
      weekLabel: format(start, 'd MMM'),
    })
  }

  return ranges
}

export function aggregateWeeklyReports(
  taskRows: { task_date: string; status: string }[],
  incidentRows: { created_at: string }[],
  anchor: Date,
  weeks = 8
): WeekBucket[] {
  const ranges = buildWeekRanges(anchor, weeks)

  return ranges.map((range) => {
    const tasksInWeek = taskRows.filter(
      (row) => row.task_date >= range.weekStart && row.task_date <= range.weekEnd
    )
    const completedTasks = tasksInWeek.filter(
      (row) => row.status === 'completed'
    ).length
    const totalTasks = tasksInWeek.length
    const incidentCount = incidentRows.filter((row) => {
      const day = row.created_at.slice(0, 10)
      return day >= range.weekStart && day <= range.weekEnd
    }).length

    return {
      weekStart: range.weekStart,
      weekLabel: range.weekLabel,
      totalTasks,
      completedTasks,
      completionRate:
        totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0,
      incidentCount,
    }
  })
}
