import { createClient } from '@/lib/supabase/server'
import { MemberAuthError, requireMember } from '@/lib/auth/member'
import { jsonError, jsonOk } from '@/lib/api/response'
import { weekDates } from '@/lib/rota/week'
import { weekStartQuerySchema } from '@/lib/validation/rota'

export async function GET(request: Request) {
  try {
    const supabase = await createClient()
    const member = await requireMember(supabase)

    const { searchParams } = new URL(request.url)
    const parsed = weekStartQuerySchema.safeParse({
      weekStart: searchParams.get('weekStart'),
    })
    if (!parsed.success) {
      return jsonError(parsed.error.issues[0]?.message ?? 'Invalid weekStart', 400)
    }

    const weekStart = parsed.data.weekStart
    const dates = weekDates(weekStart)
    const isManager = ['admin', 'manager'].includes(member.role)

    if (!isManager && member.role !== 'viewer') {
      return jsonError('Forbidden', 403)
    }

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

    if (error) {
      console.error('Rota list failed:', error)
      return jsonError('Something went wrong', 500)
    }

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

    return jsonOk({
      weekStart,
      dates,
      surgeries: surgeries ?? [],
      assignments: rotaAssignments,
      staff: staffList,
      allPublished,
      canEdit: isManager,
    })
  } catch (error) {
    if (error instanceof MemberAuthError) {
      return jsonError(error.message, error.status)
    }
    console.error('Rota list failed:', error)
    return jsonError('Something went wrong', 500)
  }
}
