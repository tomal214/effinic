import { describe, it, expect } from 'vitest'
import { isDailyTaskLocked } from '@/lib/session/task-lock'

describe('isDailyTaskLocked', () => {
  const tz = 'Europe/London'

  it('allows amend for morning task during morning session', () => {
    const now = new Date('2026-06-12T10:00:00+01:00')
    expect(isDailyTaskLocked({ session: 'morning', taskDate: '2026-06-12' }, now, tz)).toBe(false)
  })

  it('locks morning task after morning lock', () => {
    const now = new Date('2026-06-12T14:00:00+01:00')
    expect(isDailyTaskLocked({ session: 'morning', taskDate: '2026-06-12' }, now, tz)).toBe(true)
  })

  it('locks all_day task after afternoon lock', () => {
    const now = new Date('2026-06-12T19:00:00+01:00')
    expect(isDailyTaskLocked({ session: 'all_day', taskDate: '2026-06-12' }, now, tz)).toBe(true)
  })
})
