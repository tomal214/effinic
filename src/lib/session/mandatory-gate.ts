import type { TaskSession } from './task-session'

export type GateTask = { session: TaskSession; isMandatory: boolean; status: string }

export function canSignOffMorning(tasks: GateTask[]): boolean {
  return !tasks.some(
    (t) => t.isMandatory && t.session === 'morning' && t.status !== 'completed'
  )
}

export function canSignOffEndDay(tasks: GateTask[]): boolean {
  return !tasks.some((t) => t.isMandatory && t.status !== 'completed')
}
