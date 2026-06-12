import { describe, it, expect } from 'vitest'
import { getComputedStatus } from '@/lib/tasks/computed-status'

describe('getComputedStatus', () => {
  const taskDate = '2026-06-12'

  it('returns completed when status is completed', () => {
    const now = new Date('2026-06-12T15:00:00')
    expect(getComputedStatus('completed', '09:00', taskDate, now)).toBe('completed')
  })

  it('returns pending when there is no due time', () => {
    const now = new Date('2026-06-12T15:00:00')
    expect(getComputedStatus('pending', null, taskDate, now)).toBe('pending')
  })

  it('returns overdue when now is past due time', () => {
    const now = new Date('2026-06-12T10:00:00')
    expect(getComputedStatus('pending', '09:00', taskDate, now)).toBe('overdue')
  })

  it('returns due_soon when within 30 minutes of due time', () => {
    const now = new Date('2026-06-12T08:45:00')
    expect(getComputedStatus('pending', '09:00', taskDate, now)).toBe('due_soon')
  })

  it('returns due_soon at exactly 30 minutes before due', () => {
    const now = new Date('2026-06-12T08:30:00')
    expect(getComputedStatus('pending', '09:00', taskDate, now)).toBe('due_soon')
  })

  it('returns pending when more than 30 minutes before due', () => {
    const now = new Date('2026-06-12T08:00:00')
    expect(getComputedStatus('pending', '09:00', taskDate, now)).toBe('pending')
  })

  it('handles time strings with seconds', () => {
    const now = new Date('2026-06-12T08:45:00')
    expect(getComputedStatus('pending', '09:00:00', taskDate, now)).toBe('due_soon')
  })
})
