import {
  SESSION_AFTERNOON_LOCK,
  SESSION_MORNING_LOCK,
} from '@/lib/session/constants'

export function getSessionBannerCopy(
  session: 'morning' | 'afternoon' | 'all_day',
  minutesUntilLock: number
) {
  const lockTime =
    session === 'morning' ? SESSION_MORNING_LOCK : SESSION_AFTERNOON_LOCK
  const label =
    session === 'morning' ? 'Morning session' : 'Afternoon session'

  if (minutesUntilLock > 0) {
    return {
      title: `${label} closing soon`,
      body: `Tasks lock at ${lockTime}. ${Math.ceil(minutesUntilLock)} minutes remaining.`,
    }
  }

  return {
    title: `${label} locked`,
    body: `Tasks lock at ${lockTime}. Completed tasks can no longer be amended; pending tasks can still be completed.`,
  }
}
