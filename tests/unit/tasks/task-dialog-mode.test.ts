import { describe, it, expect } from 'vitest'
import {
  formatTimeForInput,
  getTaskDialogMode,
} from '@/lib/tasks/task-dialog-mode'

describe('getTaskDialogMode', () => {
  it('returns complete for pending tasks', () => {
    expect(getTaskDialogMode({ status: 'pending', isLocked: false })).toBe(
      'complete'
    )
  })

  it('returns amend for completed unlocked tasks', () => {
    expect(getTaskDialogMode({ status: 'completed', isLocked: false })).toBe(
      'amend'
    )
  })

  it('returns view for completed locked tasks', () => {
    expect(getTaskDialogMode({ status: 'completed', isLocked: true })).toBe(
      'view'
    )
  })
})

describe('formatTimeForInput', () => {
  it('returns empty string for null', () => {
    expect(formatTimeForInput(null)).toBe('')
  })

  it('truncates HH:MM:SS to HH:MM', () => {
    expect(formatTimeForInput('09:30:00')).toBe('09:30')
  })
})
