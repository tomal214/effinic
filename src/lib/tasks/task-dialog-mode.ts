export type TaskDialogMode = 'complete' | 'amend' | 'view'

export function getTaskDialogMode(task: {
  status: string
  isLocked: boolean
}): TaskDialogMode {
  if (task.status === 'completed' && task.isLocked) return 'view'
  if (task.status === 'completed') return 'amend'
  return 'complete'
}

export function formatTimeForInput(value: string | null) {
  if (!value) return ''
  return value.slice(0, 5)
}
