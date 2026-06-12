import { SESSION_MORNING_LOCK } from './constants'

export type TaskSession = 'morning' | 'afternoon' | 'all_day'

export function getTaskSession(
  timeDue: string | null,
  morningLock = SESSION_MORNING_LOCK
): TaskSession {
  if (!timeDue) return 'all_day'
  return timeDue < morningLock ? 'morning' : 'afternoon'
}
