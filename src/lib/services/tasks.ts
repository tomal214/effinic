import { formatInTimeZone } from 'date-fns-tz'
import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database'
import type { CurrentMember } from '@/lib/auth/member'
import { getNow } from '@/lib/clock'
import { getComputedStatus } from '@/lib/tasks/computed-status'
import { userCanActOnTask } from '@/lib/tasks/can-access-task'
import { filterTasksForUser } from '@/lib/tasks/filter-tasks'
import { generateDailyTasksFromTemplates } from '@/lib/tasks/generate-daily'
import { getTaskSession } from '@/lib/session/task-session'
import { isDailyTaskLocked } from '@/lib/session/task-lock'
import {
  buildHistoryCsv,
  formatTaskTimes,
  type HistoryExportRow,
} from '@/lib/tasks/history-csv'
import type { amendTaskSchema, completeTaskSchema } from '@/lib/validation/tasks'
import type { z } from 'zod'

type AdminClient = SupabaseClient<Database>

type RawTaskRow = {
  id: string
  practice_id: string
  task_template_id: string
  surgery_id: string | null
  task_date: string
  assigned_to: string | null
  status: string
  completed_at: string | null
  completed_by: string | null
  checklist_progress: unknown
  start_time: string | null
  end_time: string | null
  materials_used: string | null
  notes: string | null
  photo_paths: unknown
  task_templates: {
    title: string
    time_due: string | null
    role_responsible: string
    is_mandatory: boolean
    checklist_steps: unknown
    assigned_user_id: string | null
  } | null
  surgeries: { name: string } | null
}

export type EnrichedTask = {
  id: string
  taskTemplateId: string
  surgeryId: string | null
  surgeryName: string | null
  taskDate: string
  title: string
  timeDue: string | null
  roleResponsible: string
  isMandatory: boolean
  checklistSteps: string[]
  assignedUserId: string | null
  status: string
  computedStatus: string
  session: string
  isLocked: boolean
  completedAt: string | null
  completedBy: string | null
  checklistProgress: Record<string, boolean> | null
  startTime: string | null
  endTime: string | null
  materialsUsed: string | null
  notes: string | null
  photoPaths: string[]
}

function parseChecklistSteps(raw: unknown): string[] {
  if (!Array.isArray(raw)) return []
  return raw.map((step) => {
    if (typeof step === 'string') return step
    if (step && typeof step === 'object' && 'label' in step) {
      return String((step as { label: string }).label)
    }
    return String(step)
  })
}

function parsePhotoPaths(raw: unknown): string[] {
  if (!Array.isArray(raw)) return []
  return raw.filter((p): p is string => typeof p === 'string')
}

function enrichTask(
  row: RawTaskRow,
  now: Date,
  timezone: string
): EnrichedTask {
  const template = row.task_templates
  const timeDue = template?.time_due ?? null
  const session = getTaskSession(timeDue)
  const computedStatus = getComputedStatus(
    row.status,
    timeDue,
    row.task_date,
    now
  )
  const isLocked = isDailyTaskLocked(
    { session, taskDate: row.task_date },
    now,
    timezone
  )

  return {
    id: row.id,
    taskTemplateId: row.task_template_id,
    surgeryId: row.surgery_id,
    surgeryName: row.surgeries?.name ?? null,
    taskDate: row.task_date,
    title: template?.title ?? 'Task',
    timeDue,
    roleResponsible: template?.role_responsible ?? 'nurse',
    isMandatory: template?.is_mandatory ?? false,
    checklistSteps: parseChecklistSteps(template?.checklist_steps),
    assignedUserId: template?.assigned_user_id ?? row.assigned_to,
    status: row.status,
    computedStatus,
    session,
    isLocked,
    completedAt: row.completed_at,
    completedBy: row.completed_by,
    checklistProgress: (row.checklist_progress as Record<string, boolean>) ?? null,
    startTime: row.start_time,
    endTime: row.end_time,
    materialsUsed: row.materials_used,
    notes: row.notes,
    photoPaths: parsePhotoPaths(row.photo_paths),
  }
}

export async function ensureTodayTasks(
  admin: AdminClient,
  practiceId: string,
  timezone: string
) {
  const today = formatInTimeZone(new Date(), timezone, 'yyyy-MM-dd')

  const { count } = await admin
    .from('daily_tasks')
    .select('*', { count: 'exact', head: true })
    .eq('practice_id', practiceId)
    .eq('task_date', today)

  if (count && count > 0) return today

  const { data: templates } = await admin
    .from('task_templates')
    .select(
      'id, practice_id, surgery_ids, assigned_user_id, is_active'
    )
    .eq('practice_id', practiceId)
    .eq('is_active', true)

  const rows = generateDailyTasksFromTemplates(templates ?? [], today)

  if (rows.length) {
    const { error } = await admin.from('daily_tasks').insert(rows)
    if (error && error.code !== '23505') throw error
  }

  return today
}

export async function getTodayTasksForMember(
  admin: AdminClient,
  member: CurrentMember,
  timezone: string
) {
  const today = await ensureTodayTasks(admin, member.practiceId, timezone)
  const now = getNow()

  const { data: rows, error } = await admin
    .from('daily_tasks')
    .select(
      `
      id, practice_id, task_template_id, surgery_id, task_date,
      assigned_to, status, completed_at, completed_by,
      checklist_progress, start_time, end_time, materials_used, notes, photo_paths,
      task_templates ( title, time_due, role_responsible, is_mandatory, checklist_steps, assigned_user_id ),
      surgeries ( name )
    `
    )
    .eq('practice_id', member.practiceId)
    .eq('task_date', today)

  if (error) throw error

  const enriched = (rows ?? []).map((row) =>
    enrichTask(row as unknown as RawTaskRow, now, timezone)
  )

  const filtered = filterTasksForUser(
    enriched.map((t) => ({
      ...t,
      roleResponsible: t.roleResponsible,
      assignedUserId: t.assignedUserId,
      surgeryId: t.surgeryId,
      computedStatus: t.computedStatus,
    })),
    {
      role: member.role,
      userId: member.userId,
      activeSurgeryId: member.activeSurgeryId,
    }
  )

  return { tasks: filtered, taskDate: today }
}

export async function getTaskForMember(
  admin: AdminClient,
  member: CurrentMember,
  taskId: string,
  timezone: string
) {
  const now = getNow()

  const { data: row, error } = await admin
    .from('daily_tasks')
    .select(
      `
      id, practice_id, task_template_id, surgery_id, task_date,
      assigned_to, status, completed_at, completed_by,
      checklist_progress, start_time, end_time, materials_used, notes, photo_paths,
      task_templates ( title, time_due, role_responsible, is_mandatory, checklist_steps, assigned_user_id ),
      surgeries ( name )
    `
    )
    .eq('id', taskId)
    .eq('practice_id', member.practiceId)
    .maybeSingle()

  if (error) throw error
  if (!row) return null

  return enrichTask(row as unknown as RawTaskRow, now, timezone)
}

function taskFilterUser(member: CurrentMember) {
  return {
    role: member.role,
    userId: member.userId,
    activeSurgeryId: member.activeSurgeryId,
  }
}

export async function completeTask(
  admin: AdminClient,
  member: CurrentMember,
  taskId: string,
  input: z.infer<typeof completeTaskSchema>
) {
  const task = await getTaskForMember(
    admin,
    member,
    taskId,
    'Europe/London'
  )
  if (!task) return { error: 'not_found' as const }

  if (!userCanActOnTask(task, taskFilterUser(member))) {
    return { error: 'forbidden' as const }
  }

  const { data, error } = await admin
    .from('daily_tasks')
    .update({
      status: 'completed',
      completed_at: new Date().toISOString(),
      completed_by: member.userId,
      checklist_progress: input.checklistProgress ?? null,
      start_time: input.startTime ?? null,
      end_time: input.endTime ?? null,
      materials_used: input.materialsUsed ?? null,
      notes: input.notes ?? null,
    })
    .eq('id', taskId)
    .eq('practice_id', member.practiceId)
    .select('id')
    .maybeSingle()

  if (error) throw error
  return { data }
}

export async function amendTask(
  admin: AdminClient,
  member: CurrentMember,
  taskId: string,
  timezone: string,
  input: z.infer<typeof amendTaskSchema>
) {
  const task = await getTaskForMember(admin, member, taskId, timezone)
  if (!task) return { error: 'not_found' as const }

  if (!userCanActOnTask(task, taskFilterUser(member))) {
    return { error: 'forbidden' as const }
  }

  if (task.status === 'completed' && task.isLocked) {
    return { error: 'locked' as const }
  }

  const { data, error } = await admin
    .from('daily_tasks')
    .update({
      ...(input.checklistProgress !== undefined && {
        checklist_progress: input.checklistProgress,
      }),
      ...(input.startTime !== undefined && { start_time: input.startTime }),
      ...(input.endTime !== undefined && { end_time: input.endTime }),
      ...(input.materialsUsed !== undefined && {
        materials_used: input.materialsUsed,
      }),
      ...(input.notes !== undefined && { notes: input.notes }),
      ...(input.photoPath && {
        photo_paths: [...task.photoPaths, input.photoPath],
      }),
    })
    .eq('id', taskId)
    .eq('practice_id', member.practiceId)
    .select('id')
    .maybeSingle()

  if (error) throw error
  return { data }
}

export async function getTaskHistory(
  admin: AdminClient,
  member: CurrentMember,
  from: string,
  to: string,
  surgeryId?: string
) {
  let query = admin
    .from('daily_tasks')
    .select(
      `
      id, task_date, status, completed_at, completed_by,
      start_time, end_time, materials_used, notes,
      task_templates ( title, role_responsible ),
      surgeries ( name )
    `
    )
    .eq('practice_id', member.practiceId)
    .gte('task_date', from)
    .lte('task_date', to)
    .order('task_date', { ascending: false })

  if (surgeryId) {
    query = query.eq('surgery_id', surgeryId)
  }

  const { data, error } = await query
  if (error) throw error

  type HistoryRow = {
    id: string
    task_date: string
    status: string
    completed_by: string | null
    start_time: string | null
    end_time: string | null
    materials_used: string | null
    notes: string | null
    task_templates: { title: string; role_responsible: string } | null
    surgeries: { name: string } | null
  }

  const rows = (data ?? []) as HistoryRow[]

  const completerIds = [
    ...new Set(
      rows.map((t) => t.completed_by).filter((id): id is string => Boolean(id))
    ),
  ]

  const nameMap = new Map<string, string>()
  if (completerIds.length) {
    const { data: profiles } = await admin
      .from('profiles')
      .select('id, full_name')
      .in('id', completerIds)

    for (const profile of profiles ?? []) {
      nameMap.set(profile.id, profile.full_name)
    }
  }

  return rows.map((row) => ({
    id: row.id,
    taskDate: row.task_date,
    title: row.task_templates?.title ?? 'Task',
    role: row.task_templates?.role_responsible ?? '',
    surgery: row.surgeries?.name ?? '',
    status: row.status,
    completedBy: row.completed_by
      ? (nameMap.get(row.completed_by) ?? 'Unknown')
      : '',
    startTime: row.start_time,
    endTime: row.end_time,
    materialsUsed: row.materials_used,
    notes: row.notes,
  }))
}

export async function exportTaskHistoryCsv(
  admin: AdminClient,
  member: CurrentMember,
  from: string,
  to: string,
  surgeryId?: string
) {
  const history = await getTaskHistory(
    admin,
    member,
    from,
    to,
    surgeryId
  )

  const rows: HistoryExportRow[] = history.map((row) => ({
    title: row.title,
    role: row.role,
    surgery: row.surgery,
    status: row.status,
    completedBy: row.completedBy,
    times: formatTaskTimes(row.startTime, row.endTime),
    materials: row.materialsUsed ?? '',
    notes: row.notes ?? '',
  }))

  return buildHistoryCsv(rows)
}
