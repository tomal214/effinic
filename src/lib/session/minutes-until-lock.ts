import { toZonedTime } from 'date-fns-tz'
import {
  SESSION_AFTERNOON_LOCK,
  SESSION_MORNING_LOCK,
} from '@/lib/session/constants'

export function getMinutesUntilLock(
  session: 'morning' | 'afternoon' | 'all_day',
  taskDate: string,
  timezone: string
) {
  if (session === 'all_day') return null

  const lockTime =
    session === 'morning' ? SESSION_MORNING_LOCK : SESSION_AFTERNOON_LOCK
  const [h, m] = lockTime.split(':').map(Number)
  const zonedNow = toZonedTime(new Date(), timezone)
  const lockAt = toZonedTime(new Date(`${taskDate}T00:00:00`), timezone)
  lockAt.setHours(h, m, 0, 0)

  return (lockAt.getTime() - zonedNow.getTime()) / 60_000
}
