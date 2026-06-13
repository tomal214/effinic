import { format, startOfWeek, subDays } from 'date-fns'
import { formatInTimeZone } from 'date-fns-tz'
import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database'
import type { CurrentMember } from '@/lib/auth/member'
import { createAdminClient } from '@/lib/supabase/admin'
import { getNow } from '@/lib/clock'
import { weekDates } from '@/lib/rota/week'
import {
  getDashboardData,
  getPracticeTimezone,
} from '@/lib/services/dashboard'
import { listIncidentsForMember } from '@/lib/services/incidents'
import { getWeeklyReports } from '@/lib/services/reports'
import { listStaff } from '@/lib/services/staff'
import { listAllSurgeries } from '@/lib/services/surgeries'
import { getTaskHistory, getTodayTasksForMember } from '@/lib/services/tasks'
import { listTemplates } from '@/lib/services/templates'

type AdminClient = SupabaseClient<Database>
type Supabase = SupabaseClient<Database>

// Page loaders for RSC first paint. Client views refresh via matching GET /api routes
// that call these same functions — see AGENTS.md § "App data loading".

export async function loadSurgeriesData(
  admin: AdminClient,
  member: CurrentMember
) {
  const { data: practice } = await admin
    .from('practices')
    .select('timezone')
    .eq('id', member.practiceId)
    .single()

  const timezone = practice?.timezone ?? 'Europe/London'
  const today = formatInTimeZone(getNow(), timezone, 'yyyy-MM-dd')

  const isManager = member.role === 'manager' || member.role === 'admin'
  const allSurgeries = await listAllSurgeries(admin, member.practiceId)
  const surgeries = isManager
    ? allSurgeries
    : allSurgeries.filter((s) => s.is_active)

  const { data: rota } = await admin
    .from('rota_assignments')
    .select('surgery_id')
    .eq('practice_id', member.practiceId)
    .eq('user_id', member.userId)
    .eq('shift_date', today)
    .eq('is_published', true)
    .limit(1)
    .maybeSingle()

  const activeSurgeries = surgeries.filter((s) => s.is_active)
  const defaultSurgeryId =
    rota?.surgery_id ??
    member.activeSurgeryId ??
    activeSurgeries[0]?.id ??
    null

  return { surgeries, defaultSurgeryId }
}

export async function loadTasksData(
  admin: AdminClient,
  member: CurrentMember
) {
  const timezone = await getPracticeTimezone(admin, member.practiceId)
  const result = await getTodayTasksForMember(admin, member, timezone)
  return { ...result, timezone }
}

export async function loadDashboardPageData(member: CurrentMember) {
  const admin = createAdminClient()
  const timezone = await getPracticeTimezone(admin, member.practiceId)
  const dashboard = await getDashboardData(admin, member, timezone)
  return { dashboard, timezone }
}

export async function loadStaffPageData(member: CurrentMember) {
  const admin = createAdminClient()
  const [staff, practiceResult] = await Promise.all([
    listStaff(admin, member.practiceId),
    admin
      .from('practices')
      .select('slug, practice_token')
      .eq('id', member.practiceId)
      .single(),
  ])

  const practice = practiceResult.data
  return {
    staff,
    practice: practice
      ? {
          slug: practice.slug,
          practiceUrl: `/p/${practice.slug}/${practice.practice_token}`,
        }
      : null,
  }
}

export async function loadTemplatesPageData(member: CurrentMember) {
  const admin = createAdminClient()
  const [templates, surgeriesData] = await Promise.all([
    listTemplates(admin, member.practiceId),
    loadSurgeriesData(admin, member),
  ])

  return {
    templates,
    surgeries: surgeriesData.surgeries.filter((s) => s.is_active !== false),
  }
}

export async function loadIncidentsPageData(
  supabase: Supabase,
  member: CurrentMember
) {
  const incidents = await listIncidentsForMember(supabase, member)
  return { incidents }
}

export async function loadRotaPageData(
  supabase: Supabase,
  member: CurrentMember,
  weekStart: string
) {
  const dates = weekDates(weekStart)
  const isManager = ['admin', 'manager'].includes(member.role)

  const [{ data: surgeries }, { data: assignments, error }] = await Promise.all([
    supabase
      .from('surgeries')
      .select('id, name, sort_order')
      .eq('is_active', true)
      .order('sort_order'),
    supabase
      .from('rota_assignments')
      .select('id, user_id, surgery_id, shift_date, shift_type, is_published')
      .eq('practice_id', member.practiceId)
      .in('shift_date', dates),
  ])

  if (error) throw error

  const { data: staffRows } = await supabase
    .from('practice_members')
    .select('user_id, role')
    .eq('practice_id', member.practiceId)
    .eq('is_active', true)
    .in('role', ['nurse', 'receptionist', 'dentist', 'hygienist'])

  const userIds = [
    ...new Set([
      ...(assignments ?? []).map((a) => a.user_id),
      ...(staffRows ?? []).map((s) => s.user_id),
    ]),
  ]

  const { data: profiles } = userIds.length
    ? await supabase.from('profiles').select('id, full_name').in('id', userIds)
    : { data: [] as { id: string; full_name: string }[] }

  const profileMap = new Map(
    (profiles ?? []).map((p) => [p.id, p.full_name])
  )

  const staffList = (staffRows ?? []).map((row) => ({
    userId: row.user_id,
    fullName: profileMap.get(row.user_id) ?? 'Unknown',
    role: row.role,
  }))

  const rotaAssignments = (assignments ?? []).map((row) => ({
    id: row.id,
    userId: row.user_id,
    userName: profileMap.get(row.user_id) ?? 'Unknown',
    surgeryId: row.surgery_id,
    shiftDate: row.shift_date,
    shiftType: row.shift_type,
    isPublished: row.is_published,
  }))

  const allPublished =
    rotaAssignments.length > 0 &&
    rotaAssignments.every((a) => a.isPublished)

  return {
    weekStart,
    dates,
    surgeries: surgeries ?? [],
    assignments: rotaAssignments,
    staff: staffList,
    allPublished,
    canEdit: isManager,
  }
}

export function defaultRotaWeekStart() {
  return format(startOfWeek(new Date(), { weekStartsOn: 1 }), 'yyyy-MM-dd')
}

export async function loadReportsPageData(
  member: CurrentMember,
  weeks = 8
) {
  const admin = createAdminClient()
  const timezone = await getPracticeTimezone(admin, member.practiceId)
  const reportWeeks = await getWeeklyReports(admin, member, timezone, weeks)
  return { weeks: reportWeeks }
}

export function defaultTaskHistoryRange() {
  const today = format(new Date(), 'yyyy-MM-dd')
  return {
    from: format(subDays(new Date(), 7), 'yyyy-MM-dd'),
    to: today,
  }
}

export async function loadTaskHistoryPageData(
  member: CurrentMember,
  from: string,
  to: string,
  surgeryId?: string
) {
  const admin = createAdminClient()
  const [history, surgeriesData] = await Promise.all([
    getTaskHistory(admin, member, from, to, surgeryId),
    loadSurgeriesData(admin, member),
  ])

  return {
    history,
    surgeries: surgeriesData.surgeries,
    from,
    to,
    surgeryId: surgeryId ?? 'all',
  }
}
