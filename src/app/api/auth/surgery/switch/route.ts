import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { MemberAuthError, requireMember } from '@/lib/auth/member'
import { jsonError, jsonOk } from '@/lib/api/response'
import { surgerySwitchSchema } from '@/lib/validation/auth'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const parsed = surgerySwitchSchema.safeParse(body)
    if (!parsed.success) {
      return jsonError('Invalid request', 400)
    }

    const supabase = await createClient()
    const member = await requireMember(supabase)
    const admin = createAdminClient()

    const { data: surgery } = await admin
      .from('surgeries')
      .select('id')
      .eq('id', parsed.data.surgeryId)
      .eq('practice_id', member.practiceId)
      .eq('is_active', true)
      .maybeSingle()

    if (!surgery) {
      return jsonError('Surgery not found', 404)
    }

    await admin
      .from('practice_members')
      .update({ active_surgery_id: parsed.data.surgeryId })
      .eq('id', member.memberId)

    return jsonOk({ ok: true, surgeryId: parsed.data.surgeryId })
  } catch (error) {
    if (error instanceof MemberAuthError) {
      return jsonError(error.message, error.status)
    }
    console.error('Surgery switch failed:', error)
    return jsonError('Something went wrong', 500)
  }
}
