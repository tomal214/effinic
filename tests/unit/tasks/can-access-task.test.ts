import { describe, it, expect } from 'vitest'
import { userCanActOnTask } from '@/lib/tasks/can-access-task'

const surgeryA = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'
const surgeryB = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb'
const nurseId = '11111111-1111-1111-1111-111111111111'
const otherId = '22222222-2222-2222-2222-222222222222'

function task(overrides = {}) {
  return {
    roleResponsible: 'nurse',
    assignedUserId: null,
    surgeryId: surgeryA,
    computedStatus: 'pending',
    ...overrides,
  }
}

describe('userCanActOnTask', () => {
  it('allows manager to act on any task', () => {
    expect(
      userCanActOnTask(task({ surgeryId: surgeryB }), {
        role: 'manager',
        userId: nurseId,
        activeSurgeryId: surgeryA,
      })
    ).toBe(true)
  })

  it('denies dentist from acting on tasks', () => {
    expect(
      userCanActOnTask(task(), {
        role: 'dentist',
        userId: nurseId,
        activeSurgeryId: surgeryA,
      })
    ).toBe(false)
  })

  it('allows nurse for matching surgery tasks', () => {
    expect(
      userCanActOnTask(task({ surgeryId: surgeryA }), {
        role: 'nurse',
        userId: nurseId,
        activeSurgeryId: surgeryA,
      })
    ).toBe(true)
  })

  it('denies nurse for other surgery tasks', () => {
    expect(
      userCanActOnTask(task({ surgeryId: surgeryB }), {
        role: 'nurse',
        userId: nurseId,
        activeSurgeryId: surgeryA,
      })
    ).toBe(false)
  })

  it('allows assigned user regardless of surgery', () => {
    expect(
      userCanActOnTask(
        task({ assignedUserId: nurseId, surgeryId: surgeryB }),
        {
          role: 'nurse',
          userId: nurseId,
          activeSurgeryId: surgeryA,
        }
      )
    ).toBe(true)
  })

  it('denies non-assigned user on assigned tasks', () => {
    expect(
      userCanActOnTask(
        task({ assignedUserId: otherId, surgeryId: surgeryA }),
        {
          role: 'nurse',
          userId: nurseId,
          activeSurgeryId: surgeryA,
        }
      )
    ).toBe(false)
  })

  it('allows receptionist on role-matched tasks', () => {
    expect(
      userCanActOnTask(task({ roleResponsible: 'receptionist', surgeryId: null }), {
        role: 'receptionist',
        userId: nurseId,
        activeSurgeryId: null,
      })
    ).toBe(true)
  })

  it('allows receptionist on overdue tasks from other roles', () => {
    expect(
      userCanActOnTask(
        task({ roleResponsible: 'nurse', computedStatus: 'overdue', surgeryId: surgeryB }),
        {
          role: 'receptionist',
          userId: nurseId,
          activeSurgeryId: null,
        }
      )
    ).toBe(true)
  })
})
