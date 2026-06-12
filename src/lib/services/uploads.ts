import { randomUUID } from 'crypto'
import type { SupabaseClient } from '@supabase/supabase-js'
import type { CurrentMember } from '@/lib/auth/member'
import type { Database } from '@/types/database'
import { getNow } from '@/lib/clock'
import { userCanActOnTask } from '@/lib/tasks/can-access-task'
import { getComputedStatus } from '@/lib/tasks/computed-status'

type AdminClient = SupabaseClient<Database>

const BUCKET = 'task-evidence'

export async function signTaskPhotoUpload(
  admin: AdminClient,
  member: CurrentMember,
  taskId: string,
  timezone: string
) {
  const { data: row } = await admin
    .from('daily_tasks')
    .select(
      `
      id,
      surgery_id,
      task_date,
      status,
      assigned_to,
      task_templates ( role_responsible, time_due, assigned_user_id )
    `
    )
    .eq('id', taskId)
    .eq('practice_id', member.practiceId)
    .maybeSingle()

  if (!row) return null

  type UploadTaskRow = {
    surgery_id: string | null
    task_date: string
    status: string
    assigned_to: string | null
    task_templates: {
      role_responsible: string
      time_due: string | null
      assigned_user_id: string | null
    } | null
  }

  const taskRow = row as UploadTaskRow
  const template = taskRow.task_templates
  const timeDue = template?.time_due ?? null
  const now = getNow()
  const computedStatus = getComputedStatus(
    taskRow.status,
    timeDue,
    taskRow.task_date,
    now
  )

  const canAct = userCanActOnTask(
    {
      roleResponsible: template?.role_responsible ?? 'nurse',
      assignedUserId: template?.assigned_user_id ?? taskRow.assigned_to,
      surgeryId: taskRow.surgery_id,
      computedStatus,
    },
    {
      role: member.role,
      userId: member.userId,
      activeSurgeryId: member.activeSurgeryId,
    }
  )

  if (!canAct) return null

  const filename = `${randomUUID()}.jpg`
  const path = `${member.practiceId}/tasks/${taskId}/${filename}`

  const { data, error } = await admin.storage
    .from(BUCKET)
    .createSignedUploadUrl(path)

  if (error) throw error

  return {
    path,
    signedUrl: data.signedUrl,
    token: data.token,
  }
}
