import { describe, it, expect } from 'vitest'
import { filterTasksForUser } from '@/lib/tasks/filter-tasks'

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

describe('filterTasksForUser', () => {
  const tasks = [
    task({ surgeryId: surgeryA }),
    task({ surgeryId: surgeryB }),
    task({ surgeryId: null }),
    task({ roleResponsible: 'receptionist', surgeryId: null }),
    task({ roleResponsible: 'nurse', computedStatus: 'overdue', surgeryId: surgeryB }),
    task({ assignedUserId: nurseId, roleResponsible: 'nurse', surgeryId: surgeryB }),
    task({ assignedUserId: otherId, roleResponsible: 'nurse', surgeryId: surgeryA }),
  ]

  it('returns all tasks for manager', () => {
    const result = filterTasksForUser(tasks, {
      role: 'manager',
      userId: nurseId,
      activeSurgeryId: surgeryA,
    })
    expect(result).toHaveLength(tasks.length)
  })

  it('returns all tasks for admin', () => {
    const result = filterTasksForUser(tasks, {
      role: 'admin',
      userId: nurseId,
      activeSurgeryId: surgeryA,
    })
    expect(result).toHaveLength(tasks.length)
  })

  it('returns all tasks for viewer', () => {
    const result = filterTasksForUser(tasks, {
      role: 'viewer',
      userId: nurseId,
      activeSurgeryId: surgeryA,
    })
    expect(result).toHaveLength(tasks.length)
  })

  it('returns empty array for dentist', () => {
    expect(
      filterTasksForUser(tasks, {
        role: 'dentist',
        userId: nurseId,
        activeSurgeryId: surgeryA,
      })
    ).toEqual([])
  })

  it('returns empty array for hygienist', () => {
    expect(
      filterTasksForUser(tasks, {
        role: 'hygienist',
        userId: nurseId,
        activeSurgeryId: surgeryA,
      })
    ).toEqual([])
  })

  it('shows nurse tasks matching active surgery or null surgery', () => {
    const nurseTasks = [
      task({ surgeryId: surgeryA }),
      task({ surgeryId: surgeryB }),
      task({ surgeryId: null }),
    ]
    const result = filterTasksForUser(nurseTasks, {
      role: 'nurse',
      userId: nurseId,
      activeSurgeryId: surgeryA,
    })
    const surgeryIds = result.map((t) => t.surgeryId)
    expect(surgeryIds).toContain(surgeryA)
    expect(surgeryIds).toContain(null)
    expect(surgeryIds).not.toContain(surgeryB)
  })

  it('shows only null-surgery nurse tasks when no active surgery', () => {
    const nurseTasks = [
      task({ surgeryId: surgeryA }),
      task({ surgeryId: surgeryB }),
      task({ surgeryId: null }),
    ]
    const result = filterTasksForUser(nurseTasks, {
      role: 'nurse',
      userId: nurseId,
      activeSurgeryId: null,
    })
    expect(result.every((t) => t.surgeryId === null && t.roleResponsible === 'nurse')).toBe(true)
  })

  it('assigned_user override limits visibility to that user', () => {
    const assigned = [
      task({ assignedUserId: nurseId, surgeryId: surgeryB }),
      task({ assignedUserId: otherId, surgeryId: surgeryA }),
    ]
    const result = filterTasksForUser(assigned, {
      role: 'nurse',
      userId: nurseId,
      activeSurgeryId: surgeryA,
    })
    expect(result).toHaveLength(1)
    expect(result[0].assignedUserId).toBe(nurseId)
  })

  it('receptionist sees role-matched tasks and any overdue tasks', () => {
    const receptionistTasks = [
      task({ roleResponsible: 'receptionist', surgeryId: null }),
      task({ roleResponsible: 'nurse', computedStatus: 'overdue', surgeryId: surgeryB }),
      task({ roleResponsible: 'nurse', computedStatus: 'pending', surgeryId: surgeryA }),
    ]
    const result = filterTasksForUser(receptionistTasks, {
      role: 'receptionist',
      userId: nurseId,
      activeSurgeryId: null,
    })
    expect(result.some((t) => t.roleResponsible === 'receptionist')).toBe(true)
    expect(result.some((t) => t.computedStatus === 'overdue')).toBe(true)
    expect(result.some((t) => t.roleResponsible === 'nurse' && t.computedStatus === 'pending')).toBe(
      false
    )
  })
})
