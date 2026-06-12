import { toZonedTime } from 'date-fns-tz'
import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database'
import type { CurrentMember } from '@/lib/auth/member'
import { getComputedStatus } from '@/lib/tasks/computed-status'
import { getTaskSession } from '@/lib/session/task-session'
import {
  SESSION_AFTERNOON_LOCK,
  SESSION_MORNING_LOCK,
} from '@/lib/session/constants'
import { getNow } from '@/lib/clock'
import { ensureTodayTasks } from '@/lib/services/tasks'

type AdminClient = SupabaseClient<Database>

type RawDashboardTask = {
  id: string
  status: string
  assigned_to: string | null
  surgery_id: string | null
  task_date: string
  task_templates: {
    time_due: string | null
    is_mandatory: boolean
    assigned_user_id: string | null
  } | null
  surgeries: { name: string } | null
}

export type SessionWarning = {
  session: 'morning' | 'afternoon'
  lockTime: string
  minutesUntilLock: number
  incompleteMandatoryCount: number
}

export type SurgeryBreakdown = {
  surgeryId: string | null
  surgeryName: string
  total: number
  completed: number
  incomplete: number
  overdue: number
}

export type NurseBreakdown = {
  userId: string | null
  name: string
  total: number
  completed: number
  incomplete: number
  overdue: number
}

export type DashboardData = {
  taskDate: string
  incompleteCount: number
  overdueCount: number
  sessionWarnings: SessionWarning[]
  bySurgery: SurgeryBreakdown[]
  byNurse: NurseBreakdown[]
}

function getMinutesUntilLock(
  session: 'morning' | 'afternoon',
  taskDate: string,
  timezone: string,
  now: Date
) {
  const lockTime =
    session === 'morning' ? SESSION_MORNING_LOCK : SESSION_AFTERNOON_LOCK
  const [h, m] = lockTime.split(':').map(Number)
  const zonedNow = toZonedTime(now, timezone)
  const lockAt = toZonedTime(new Date(`${taskDate}T00:00:00`), timezone)
  lockAt.setHours(h, m, 0, 0)
  return (lockAt.getTime() - zonedNow.getTime()) / 60_000
}

export async function getDashboardData(
  admin: AdminClient,
  member: CurrentMember,
  timezone: string
): Promise<DashboardData> {
  const today = await ensureTodayTasks(admin, member.practiceId, timezone)
  const now = getNow()

  const { data: rows, error } = await admin
    .from('daily_tasks')
    .select(
      `
      id, status, assigned_to, surgery_id, task_date,
      task_templates ( time_due, is_mandatory, assigned_user_id ),
      surgeries ( name )
    `
    )
    .eq('practice_id', member.practiceId)
    .eq('task_date', today)

  if (error) throw error

  const tasks = (rows ?? []) as RawDashboardTask[]

  let incompleteCount = 0
  let overdueCount = 0
  const surgeryMap = new Map<string, SurgeryBreakdown>()
  const nurseMap = new Map<string, NurseBreakdown>()
  const mandatoryBySession = { morning: 0, afternoon: 0 }

  for (const row of tasks) {
    const template = row.task_templates
    const timeDue = template?.time_due ?? null
    const computedStatus = getComputedStatus(
      row.status,
      timeDue,
      row.task_date,
      now
    )
    const isCompleted = computedStatus === 'completed'
    const isOverdue = computedStatus === 'overdue'

    if (!isCompleted) incompleteCount += 1
    if (isOverdue) overdueCount += 1

    const session = getTaskSession(timeDue)
    if (
      !isCompleted &&
      template?.is_mandatory &&
      (session === 'morning' || session === 'afternoon')
    ) {
      mandatoryBySession[session] += 1
    }

    const surgeryKey = row.surgery_id ?? '__none__'
    const surgeryEntry = surgeryMap.get(surgeryKey) ?? {
      surgeryId: row.surgery_id,
      surgeryName: row.surgeries?.name ?? 'Practice-wide',
      total: 0,
      completed: 0,
      incomplete: 0,
      overdue: 0,
    }
    surgeryEntry.total += 1
    if (isCompleted) surgeryEntry.completed += 1
    else surgeryEntry.incomplete += 1
    if (isOverdue) surgeryEntry.overdue += 1
    surgeryMap.set(surgeryKey, surgeryEntry)

    const nurseId =
      row.assigned_to ?? template?.assigned_user_id ?? '__unassigned__'
    const nurseEntry = nurseMap.get(nurseId) ?? {
      userId: nurseId === '__unassigned__' ? null : nurseId,
      name: '',
      total: 0,
      completed: 0,
      incomplete: 0,
      overdue: 0,
    }
    nurseEntry.total += 1
    if (isCompleted) nurseEntry.completed += 1
    else nurseEntry.incomplete += 1
    if (isOverdue) nurseEntry.overdue += 1
    nurseMap.set(nurseId, nurseEntry)
  }

  const nurseIds = [...nurseMap.keys()].filter((id) => id !== '__unassigned__')
  const nameMap = new Map<string, string>()
  if (nurseIds.length) {
    const { data: profiles } = await admin
      .from('profiles')
      .select('id, full_name')
      .in('id', nurseIds)
    for (const profile of profiles ?? []) {
      nameMap.set(profile.id, profile.full_name)
    }
  }

  const byNurse = [...nurseMap.values()].map((entry) => ({
    ...entry,
    name: entry.userId
      ? (nameMap.get(entry.userId) ?? 'Unknown')
      : 'Unassigned',
  }))

  const sessionWarnings: SessionWarning[] = []
  for (const session of ['morning', 'afternoon'] as const) {
    const minutesUntilLock = getMinutesUntilLock(session, today, timezone, now)
    if (minutesUntilLock <= 30) {
      sessionWarnings.push({
        session,
        lockTime:
          session === 'morning' ? SESSION_MORNING_LOCK : SESSION_AFTERNOON_LOCK,
        minutesUntilLock,
        incompleteMandatoryCount: mandatoryBySession[session],
      })
    }
  }

  return {
    taskDate: today,
    incompleteCount,
    overdueCount,
    sessionWarnings,
    bySurgery: [...surgeryMap.values()].sort((a, b) =>
      a.surgeryName.localeCompare(b.surgeryName)
    ),
    byNurse: byNurse.sort((a, b) => a.name.localeCompare(b.name)),
  }
}

export async function getPracticeTimezone(
  admin: AdminClient,
  practiceId: string
) {
  const { data } = await admin
    .from('practices')
    .select('timezone')
    .eq('id', practiceId)
    .single()
  return data?.timezone ?? 'Europe/London'
}
