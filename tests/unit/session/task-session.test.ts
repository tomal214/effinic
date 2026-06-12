import { describe, it, expect } from 'vitest'
import { getTaskSession } from '@/lib/session/task-session'
import { SESSION_MORNING_LOCK } from '@/lib/session/constants'

describe('getTaskSession', () => {
  it('returns morning when due before lock time', () => {
    expect(getTaskSession('09:00', SESSION_MORNING_LOCK)).toBe('morning')
  })

  it('returns afternoon when due at or after lock time', () => {
    expect(getTaskSession('13:15', SESSION_MORNING_LOCK)).toBe('afternoon')
    expect(getTaskSession('17:00', SESSION_MORNING_LOCK)).toBe('afternoon')
  })

  it('returns all_day when no due time', () => {
    expect(getTaskSession(null, SESSION_MORNING_LOCK)).toBe('all_day')
  })
})
