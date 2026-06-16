import { format } from 'date-fns'
import { formatInTimeZone } from 'date-fns-tz'
import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database'
import type { CurrentMember } from '@/lib/auth/member'
import {
  aggregateWeeklyReports,
  buildWeekRanges,
  type WeekBucket,
} from '@/lib/reports/week-aggregate'
import {
  buildWeekReportDetail,
  type WeekTaskRow,
} from '@/lib/reports/week-breakdown'
import {
  buildIncidentsCsv,
  type IncidentExportRow,
} from '@/lib/reports/incidents-csv'
import { exportTaskHistoryCsv } from '@/lib/services/tasks'

type AdminClient = SupabaseClient<Database>

function weekEndFromStart(weekStart: string) {
  const end = new Date(`${weekStart}T12:00:00`)
  end.setDate(end.getDate() + 6)
  return format(end, 'yyyy-MM-dd')
}

function taskHasPhoto(photoPaths: unknown) {
  return Array.isArray(photoPaths) && photoPaths.length > 0
}

type RawWeekTask = {
  status: string
  assigned_to: string | null
  completed_by: string | null
  photo_paths: unknown
  surgery_id: string | null
  surgeries: { name: string } | null
  task_templates: {
    is_mandatory: boolean
    category: string | null
    assigned_user_id: string | null
  } | null
}

export async function getWeeklyReports(
  admin: AdminClient,
  member: CurrentMember,
  timezone: string,
  weeks = 8
): Promise<WeekBucket[]> {
  const anchor = formatInTimeZone(new Date(), timezone, 'yyyy-MM-dd')
  const ranges = buildWeekRanges(new Date(`${anchor}T12:00:00`), weeks)
  const from = ranges[0]?.weekStart
  const to = ranges[ranges.length - 1]?.weekEnd

  if (!from || !to) return []

  const { data: tasks, error: tasksError } = await admin
    .from('daily_tasks')
    .select('task_date, status')
    .eq('practice_id', member.practiceId)
    .gte('task_date', from)
    .lte('task_date', to)

  if (tasksError) throw tasksError

  const { data: incidents, error: incidentsError } = await admin
    .from('incidents')
    .select('created_at')
    .eq('practice_id', member.practiceId)
    .gte('created_at', `${from}T00:00:00`)
    .lte('created_at', `${to}T23:59:59`)

  if (incidentsError) throw incidentsError

  return aggregateWeeklyReports(
    tasks ?? [],
    incidents ?? [],
    new Date(`${anchor}T12:00:00`),
    weeks
  )
}

export async function getWeekReportDetail(
  admin: AdminClient,
  member: CurrentMember,
  weekStart: string
) {
  const weekEnd = weekEndFromStart(weekStart)

  const [tasksResult, incidentsResult] = await Promise.all([
    admin
      .from('daily_tasks')
      .select(
        `
        status,
        assigned_to,
        completed_by,
        photo_paths,
        surgery_id,
        surgeries ( name ),
        task_templates ( is_mandatory, category, assigned_user_id )
      `
      )
      .eq('practice_id', member.practiceId)
      .gte('task_date', weekStart)
      .lte('task_date', weekEnd),
    admin
      .from('incidents')
      .select('id', { count: 'exact', head: true })
      .eq('practice_id', member.practiceId)
      .gte('created_at', `${weekStart}T00:00:00`)
      .lte('created_at', `${weekEnd}T23:59:59`),
  ])

  if (tasksResult.error) throw tasksResult.error
  if (incidentsResult.error) throw incidentsResult.error

  const rawTasks = (tasksResult.data ?? []) as RawWeekTask[]
  const nurseIds = [
    ...new Set(
      rawTasks
        .map((row) => {
          const template = row.task_templates
          return (
            row.completed_by ??
            row.assigned_to ??
            template?.assigned_user_id ??
            null
          )
        })
        .filter(Boolean)
    ),
  ] as string[]

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

  const tasks: WeekTaskRow[] = rawTasks.map((row) => {
    const template = row.task_templates
    const nurseUserId =
      row.completed_by ??
      row.assigned_to ??
      template?.assigned_user_id ??
      null

    return {
      status: row.status,
      surgeryId: row.surgery_id,
      surgeryName: row.surgeries?.name ?? 'Practice-wide',
      nurseUserId,
      nurseName: nurseUserId
        ? (nameMap.get(nurseUserId) ?? 'Unknown')
        : 'Unassigned',
      category: template?.category ?? null,
      isMandatory: template?.is_mandatory ?? false,
      hasPhoto: taskHasPhoto(row.photo_paths),
    }
  })

  return {
    weekStart,
    weekEnd,
    ...buildWeekReportDetail(tasks, incidentsResult.count ?? 0),
  }
}

export async function exportReportsCsv(
  admin: AdminClient,
  member: CurrentMember,
  from: string,
  to: string,
  surgeryId?: string
) {
  return exportTaskHistoryCsv(admin, member, from, to, surgeryId)
}

export async function exportIncidentsCsv(
  admin: AdminClient,
  member: CurrentMember,
  from: string,
  to: string
) {
  const { data, error } = await admin
    .from('incidents')
    .select(
      'title, type, severity, status, description, surgery_id, reported_by, created_at'
    )
    .eq('practice_id', member.practiceId)
    .gte('created_at', `${from}T00:00:00`)
    .lte('created_at', `${to}T23:59:59`)
    .order('created_at', { ascending: false })

  if (error) throw error

  const rows = data ?? []
  const surgeryIds = [
    ...new Set(rows.map((row) => row.surgery_id).filter(Boolean)),
  ] as string[]
  const reporterIds = [...new Set(rows.map((row) => row.reported_by))]

  const [{ data: surgeries }, { data: profiles }] = await Promise.all([
    surgeryIds.length
      ? admin.from('surgeries').select('id, name').in('id', surgeryIds)
      : Promise.resolve({ data: [] as { id: string; name: string }[] }),
    reporterIds.length
      ? admin.from('profiles').select('id, full_name').in('id', reporterIds)
      : Promise.resolve({ data: [] as { id: string; full_name: string }[] }),
  ])

  const surgeryMap = new Map((surgeries ?? []).map((s) => [s.id, s.name]))
  const profileMap = new Map(
    (profiles ?? []).map((p) => [p.id, p.full_name])
  )

  const exportRows: IncidentExportRow[] = rows.map((row) => ({
    title: row.title,
    type: row.type,
    severity: row.severity,
    status: row.status,
    surgery: row.surgery_id
      ? (surgeryMap.get(row.surgery_id) ?? '')
      : 'Practice-wide',
    reporter: profileMap.get(row.reported_by) ?? 'Unknown',
    createdAt: row.created_at,
    description: row.description,
  }))

  return buildIncidentsCsv(exportRows)
}
