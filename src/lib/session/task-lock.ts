import { toZonedTime } from 'date-fns-tz'
import { SESSION_MORNING_LOCK, SESSION_AFTERNOON_LOCK } from './constants'
import type { TaskSession } from './task-session'

type LockInput = { session: TaskSession; taskDate: string }

function parseTimeOnDate(dateStr: string, time: string, tz: string): Date {
  const [h, m] = time.split(':').map(Number)
  const base = toZonedTime(new Date(`${dateStr}T00:00:00`), tz)
  base.setHours(h, m, 0, 0)
  return base
}

export function isDailyTaskLocked(
  task: LockInput,
  now: Date,
  timezone: string
): boolean {
  const zonedNow = toZonedTime(now, timezone)
  const morningEnd = parseTimeOnDate(task.taskDate, SESSION_MORNING_LOCK, timezone)
  const afternoonEnd = parseTimeOnDate(task.taskDate, SESSION_AFTERNOON_LOCK, timezone)

  if (task.session === 'morning') return zonedNow >= morningEnd
  if (task.session === 'afternoon') return zonedNow >= afternoonEnd
  return zonedNow >= afternoonEnd
}
