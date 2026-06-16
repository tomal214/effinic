import { categoryLabel } from '@/lib/tasks/categories'

export type WeekTaskRow = {
  status: string
  surgeryId: string | null
  surgeryName: string
  nurseUserId: string | null
  nurseName: string
  category: string | null
  isMandatory: boolean
  hasPhoto: boolean
}

export type WeekSummary = {
  totalTasks: number
  completedTasks: number
  completionRate: number
  mandatoryIncomplete: number
  incidentCount: number
  tasksWithPhotos: number
}

export type BreakdownRow = {
  key: string
  label: string
  total: number
  completed: number
  completionRate: number
}

function completionRate(completed: number, total: number) {
  return total > 0 ? Math.round((completed / total) * 100) : 0
}

export function aggregateWeekSummary(
  tasks: WeekTaskRow[],
  incidentCount: number
): WeekSummary {
  const completedTasks = tasks.filter((task) => task.status === 'completed').length
  const totalTasks = tasks.length

  return {
    totalTasks,
    completedTasks,
    completionRate: completionRate(completedTasks, totalTasks),
    mandatoryIncomplete: tasks.filter(
      (task) => task.isMandatory && task.status !== 'completed'
    ).length,
    incidentCount,
    tasksWithPhotos: tasks.filter((task) => task.hasPhoto).length,
  }
}

function aggregateGrouped(
  tasks: WeekTaskRow[],
  keyFor: (task: WeekTaskRow) => string,
  labelFor: (task: WeekTaskRow, key: string) => string
): BreakdownRow[] {
  const groups = new Map<string, { total: number; completed: number }>()

  for (const task of tasks) {
    const key = keyFor(task)
    const entry = groups.get(key) ?? { total: 0, completed: 0 }
    entry.total += 1
    if (task.status === 'completed') entry.completed += 1
    groups.set(key, entry)
  }

  return [...groups.entries()]
    .map(([key, counts]) => {
      const sample = tasks.find((task) => keyFor(task) === key)
      return {
        key,
        label: sample ? labelFor(sample, key) : key,
        total: counts.total,
        completed: counts.completed,
        completionRate: completionRate(counts.completed, counts.total),
      }
    })
    .sort((a, b) => a.label.localeCompare(b.label))
}

export function aggregateBySurgery(tasks: WeekTaskRow[]): BreakdownRow[] {
  return aggregateGrouped(
    tasks,
    (task) => task.surgeryId ?? '__none__',
    (task) => task.surgeryName
  )
}

export function aggregateByNurse(tasks: WeekTaskRow[]): BreakdownRow[] {
  return aggregateGrouped(
    tasks,
    (task) => task.nurseUserId ?? '__unassigned__',
    (task) => task.nurseName
  )
}

export function aggregateByCategory(tasks: WeekTaskRow[]): BreakdownRow[] {
  return aggregateGrouped(
    tasks,
    (task) => task.category ?? 'general',
    (task, key) => categoryLabel(key === 'general' ? null : key)
  )
}

export function buildWeekReportDetail(
  tasks: WeekTaskRow[],
  incidentCount: number
) {
  return {
    summary: aggregateWeekSummary(tasks, incidentCount),
    bySurgery: aggregateBySurgery(tasks),
    byNurse: aggregateByNurse(tasks),
    byCategory: aggregateByCategory(tasks),
  }
}
