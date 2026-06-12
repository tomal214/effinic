import { createClient } from '@/lib/supabase/server'
import { MemberAuthError, requireRole } from '@/lib/auth/member'
import { jsonError, jsonOk } from '@/lib/api/response'
import { assignRotaSchema } from '@/lib/validation/rota'

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const member = await requireRole(supabase, ['admin', 'manager'])

    const body = await request.json()
    const parsed = assignRotaSchema.safeParse(body)
    if (!parsed.success) {
      return jsonError(parsed.error.issues[0]?.message ?? 'Invalid input', 400)
    }

    const { data, error } = await supabase
      .from('rota_assignments')
      .insert({
        practice_id: member.practiceId,
        user_id: parsed.data.userId,
        surgery_id: parsed.data.surgeryId,
        shift_date: parsed.data.shiftDate,
        shift_type: parsed.data.shiftType,
        is_published: false,
        assigned_by: member.userId,
      })
      .select('id')
      .single()

    if (error) {
      if (error.code === '23505') {
        return jsonError('Staff member already assigned to this slot', 409)
      }
      console.error('Rota assign failed:', error)
      return jsonError('Something went wrong', 500)
    }

    return jsonOk({ id: data.id }, { status: 201 })
  } catch (error) {
    if (error instanceof MemberAuthError) {
      return jsonError(error.message, error.status)
    }
    console.error('Rota assign failed:', error)
    return jsonError('Something went wrong', 500)
  }
}
