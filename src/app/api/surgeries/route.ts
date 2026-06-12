import { formatInTimeZone } from 'date-fns-tz'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import {
  MemberAuthError,
  requireManagerOrAdmin,
  requireMember,
} from '@/lib/auth/member'
import { jsonError, jsonOk } from '@/lib/api/response'
import { createSurgerySchema } from '@/lib/validation/surgeries'
import { createSurgery, listAllSurgeries } from '@/lib/services/surgeries'

export async function GET() {
  try {
    const supabase = await createClient()
    const member = await requireMember(supabase)
    const admin = createAdminClient()

    const { data: practice } = await admin
      .from('practices')
      .select('timezone')
      .eq('id', member.practiceId)
      .single()

    const timezone = practice?.timezone ?? 'Europe/London'
    const today = formatInTimeZone(new Date(), timezone, 'yyyy-MM-dd')

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

    return jsonOk({
      surgeries,
      defaultSurgeryId,
    })
  } catch (error) {
    if (error instanceof MemberAuthError) {
      return jsonError(error.message, error.status)
    }
    console.error('Surgeries list failed:', error)
    return jsonError('Something went wrong', 500)
  }
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const member = await requireManagerOrAdmin(supabase)
    const body = await request.json()
    const parsed = createSurgerySchema.safeParse(body)

    if (!parsed.success) {
      return jsonError(parsed.error.issues[0]?.message ?? 'Invalid request', 400)
    }

    const admin = createAdminClient()
    const surgery = await createSurgery(admin, member.practiceId, parsed.data)

    return jsonOk({ surgery })
  } catch (error) {
    if (error instanceof MemberAuthError) {
      return jsonError(error.message, error.status)
    }
    console.error('Surgery create failed:', error)
    return jsonError('Something went wrong', 500)
  }
}
