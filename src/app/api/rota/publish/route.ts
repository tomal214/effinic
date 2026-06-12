import { createClient } from '@/lib/supabase/server'
import { MemberAuthError, requireRole } from '@/lib/auth/member'
import { jsonError, jsonOk } from '@/lib/api/response'
import { weekEnd } from '@/lib/rota/week'
import { publishRotaSchema } from '@/lib/validation/rota'

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const member = await requireRole(supabase, ['admin', 'manager'])

    const body = await request.json()
    const parsed = publishRotaSchema.safeParse(body)
    if (!parsed.success) {
      return jsonError(parsed.error.issues[0]?.message ?? 'Invalid input', 400)
    }

    const weekStart = parsed.data.weekStart
    const end = weekEnd(weekStart)

    const { error } = await supabase
      .from('rota_assignments')
      .update({ is_published: true })
      .eq('practice_id', member.practiceId)
      .gte('shift_date', weekStart)
      .lte('shift_date', end)

    if (error) {
      console.error('Rota publish failed:', error)
      return jsonError('Something went wrong', 500)
    }

    return jsonOk({ ok: true, weekStart, weekEnd: end })
  } catch (error) {
    if (error instanceof MemberAuthError) {
      return jsonError(error.message, error.status)
    }
    console.error('Rota publish failed:', error)
    return jsonError('Something went wrong', 500)
  }
}
