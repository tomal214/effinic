import { describe, it, expect } from 'vitest'
import { getSessionBannerCopy } from '@/lib/session/banner-copy'

describe('getSessionBannerCopy', () => {
  it('shows countdown when session is not yet locked', () => {
    const copy = getSessionBannerCopy('morning', 12.4)
    expect(copy.title).toBe('Morning session closing soon')
    expect(copy.body).toContain('13 minutes remaining')
  })

  it('clarifies lock applies to completed task edits when locked', () => {
    const copy = getSessionBannerCopy('morning', 0)
    expect(copy.title).toBe('Morning session locked')
    expect(copy.body).toContain('Completed tasks can no longer be amended')
    expect(copy.body).toContain('pending tasks can still be completed')
  })

  it('uses afternoon lock time for afternoon session', () => {
    const copy = getSessionBannerCopy('afternoon', -5)
    expect(copy.title).toBe('Afternoon session locked')
    expect(copy.body).toContain('18:00')
  })
})
