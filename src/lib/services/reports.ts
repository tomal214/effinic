import { formatInTimeZone } from 'date-fns-tz'
import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database'
import type { CurrentMember } from '@/lib/auth/member'
import {
  aggregateWeeklyReports,
  buildWeekRanges,
  type WeekBucket,
} from '@/lib/reports/week-aggregate'
import { exportTaskHistoryCsv } from '@/lib/services/tasks'

type AdminClient = SupabaseClient<Database>

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

export async function exportReportsCsv(
  admin: AdminClient,
  member: CurrentMember,
  from: string,
  to: string,
  surgeryId?: string
) {
  return exportTaskHistoryCsv(admin, member, from, to, surgeryId)
}
