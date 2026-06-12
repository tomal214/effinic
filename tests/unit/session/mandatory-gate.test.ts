import { describe, it, expect } from 'vitest'
import {
  canSignOffMorning,
  canSignOffEndDay,
  type GateTask,
} from '@/lib/session/mandatory-gate'

const tasks: GateTask[] = [
  { session: 'morning', isMandatory: true, status: 'completed' },
  { session: 'morning', isMandatory: true, status: 'pending' },
  { session: 'afternoon', isMandatory: true, status: 'pending' },
]

describe('mandatory gate', () => {
  it('blocks morning sign-off if morning mandatory incomplete', () => {
    expect(canSignOffMorning(tasks)).toBe(false)
  })

  it('blocks end-day if any mandatory incomplete', () => {
    expect(canSignOffEndDay(tasks)).toBe(false)
  })

  it('allows morning sign-off when morning mandatory done', () => {
    const done: GateTask[] = [
      { session: 'morning', isMandatory: true, status: 'completed' },
      { session: 'afternoon', isMandatory: true, status: 'pending' },
    ]
    expect(canSignOffMorning(done)).toBe(true)
  })
})
