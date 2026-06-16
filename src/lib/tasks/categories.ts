export const TASK_CATEGORIES = [
  'sterilisation',
  'cleaning',
  'equipment',
  'financial',
  'confidential',
  'end_of_day',
  'general',
] as const

export type TaskCategory = (typeof TASK_CATEGORIES)[number] | 'all'

const LABELS: Record<string, string> = {
  sterilisation: 'Sterilisation',
  cleaning: 'Cleaning',
  equipment: 'Equipment',
  financial: 'Financial',
  confidential: 'Confidential',
  end_of_day: 'End of day',
  general: 'General',
}

export function categoryLabel(category: string | null | undefined) {
  if (!category) return 'General'
  return LABELS[category] ?? category
}

export function filterTasksByCategory<T extends { category?: string | null }>(
  tasks: T[],
  category: TaskCategory
) {
  if (category === 'all') return tasks
  return tasks.filter((t) => (t.category ?? 'general') === category)
}

export function countByCategory<T extends { category?: string | null }>(tasks: T[]) {
  const counts = new Map<string, number>()
  for (const task of tasks) {
    const key = task.category ?? 'general'
    counts.set(key, (counts.get(key) ?? 0) + 1)
  }
  return counts
}
