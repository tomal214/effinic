import { describe, it, expect } from 'vitest'
import { generateDailyTasksFromTemplates } from '@/lib/tasks/generate-daily'

const practiceId = '22222222-2222-2222-2222-222222222222'
const templateId = '33333333-3333-3333-3333-333333333333'
const surgeryA = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'
const surgeryB = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb'
const assignedUserId = '44444444-4444-4444-4444-444444444444'
const taskDate = '2026-06-12'

describe('generateDailyTasksFromTemplates', () => {
  it('creates one row per surgery when template has surgery_ids', () => {
    const rows = generateDailyTasksFromTemplates(
      [
        {
          id: templateId,
          practice_id: practiceId,
          surgery_ids: [surgeryA, surgeryB],
          assigned_user_id: null,
          is_active: true,
        },
      ],
      taskDate
    )
    expect(rows).toHaveLength(2)
    expect(rows).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          task_template_id: templateId,
          practice_id: practiceId,
          surgery_id: surgeryA,
          task_date: taskDate,
          status: 'pending',
        }),
        expect.objectContaining({
          task_template_id: templateId,
          practice_id: practiceId,
          surgery_id: surgeryB,
          task_date: taskDate,
          status: 'pending',
        }),
      ])
    )
  })

  it('creates one general row when surgery_ids is empty', () => {
    const rows = generateDailyTasksFromTemplates(
      [
        {
          id: templateId,
          practice_id: practiceId,
          surgery_ids: [],
          assigned_user_id: null,
          is_active: true,
        },
      ],
      taskDate
    )
    expect(rows).toHaveLength(1)
    expect(rows[0]).toMatchObject({
      task_template_id: templateId,
      practice_id: practiceId,
      surgery_id: null,
      task_date: taskDate,
      status: 'pending',
    })
  })

  it('skips inactive templates', () => {
    const rows = generateDailyTasksFromTemplates(
      [
        {
          id: templateId,
          practice_id: practiceId,
          surgery_ids: [surgeryA],
          assigned_user_id: null,
          is_active: false,
        },
      ],
      taskDate
    )
    expect(rows).toHaveLength(0)
  })

  it('sets assigned_to from template assigned_user_id', () => {
    const rows = generateDailyTasksFromTemplates(
      [
        {
          id: templateId,
          practice_id: practiceId,
          surgery_ids: [],
          assigned_user_id: assignedUserId,
          is_active: true,
        },
      ],
      taskDate
    )
    expect(rows[0].assigned_to).toBe(assignedUserId)
  })
})
