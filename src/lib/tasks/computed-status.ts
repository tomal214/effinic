import { DUE_SOON_MINUTES } from '@/lib/session/constants'

export type ComputedStatus = 'pending' | 'completed' | 'overdue' | 'due_soon'

function parseDueDateTime(taskDate: string, timeDue: string): Date {
  const time = timeDue.length === 5 ? `${timeDue}:00` : timeDue
  return new Date(`${taskDate}T${time}`)
}

export function getComputedStatus(
  status: string,
  timeDue: string | null,
  taskDate: string,
  now: Date
): ComputedStatus {
  if (status === 'completed') {
    return 'completed'
  }

  if (!timeDue) {
    return status === 'overdue' ? 'overdue' : 'pending'
  }

  const dueAt = parseDueDateTime(taskDate, timeDue)

  if (now > dueAt) {
    return 'overdue'
  }

  const minutesUntilDue = (dueAt.getTime() - now.getTime()) / 60_000

  if (minutesUntilDue <= DUE_SOON_MINUTES) {
    return 'due_soon'
  }

  return 'pending'
}
