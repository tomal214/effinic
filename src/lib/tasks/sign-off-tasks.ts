import { formatInTimeZone } from 'date-fns-tz'
import { createAdminClient } from '@/lib/supabase/admin'
import { getTaskSession } from '@/lib/session/task-session'
import type { GateTask } from '@/lib/session/mandatory-gate'

export async function fetchMemberGateTasks(
  practiceId: string,
  userId: string,
  timezone: string
): Promise<GateTask[]> {
  const admin = createAdminClient()
  const today = formatInTimeZone(new Date(), timezone, 'yyyy-MM-dd')

  const { data: tasks } = await admin
    .from('daily_tasks')
    .select('status, task_template_id')
    .eq('practice_id', practiceId)
    .eq('task_date', today)
    .or(`assigned_to.eq.${userId},assigned_to.is.null`)

  if (!tasks?.length) return []

  const templateIds = [...new Set(tasks.map((t) => t.task_template_id))]
  const { data: templates } = await admin
    .from('task_templates')
    .select('id, is_mandatory, time_due')
    .in('id', templateIds)

  const templateMap = new Map(
    (templates ?? []).map((t) => [t.id, t])
  )

  return tasks.map((task) => {
    const template = templateMap.get(task.task_template_id)
    return {
      isMandatory: template?.is_mandatory ?? false,
      session: getTaskSession(template?.time_due ?? null),
      status: task.status,
    }
  })
}
