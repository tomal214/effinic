import { createClient } from '@/lib/supabase/server'
import { MemberAuthError, requireRole } from '@/lib/auth/member'
import { jsonError, jsonOk } from '@/lib/api/response'

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = await createClient()
    const member = await requireRole(supabase, ['admin', 'manager'])

    const { data: existing } = await supabase
      .from('rota_assignments')
      .select('id')
      .eq('id', id)
      .eq('practice_id', member.practiceId)
      .maybeSingle()

    if (!existing) {
      return jsonError('Assignment not found', 404)
    }

    const { error } = await supabase
      .from('rota_assignments')
      .delete()
      .eq('id', id)
      .eq('practice_id', member.practiceId)

    if (error) {
      console.error('Rota unassign failed:', error)
      return jsonError('Something went wrong', 500)
    }

    return jsonOk({ ok: true })
  } catch (error) {
    if (error instanceof MemberAuthError) {
      return jsonError(error.message, error.status)
    }
    console.error('Rota unassign failed:', error)
    return jsonError('Something went wrong', 500)
  }
}
