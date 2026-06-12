import { createClient } from '@/lib/supabase/server'
import { MemberAuthError, requireMember } from '@/lib/auth/member'
import { jsonError, jsonOk } from '@/lib/api/response'
import { canManageIncidents } from '@/lib/incidents/access'
import { patchIncidentSchema } from '@/lib/validation/incidents'

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = await createClient()
    const member = await requireMember(supabase)

    if (!canManageIncidents(member.role)) {
      return jsonError('Forbidden', 403)
    }

    const body = await request.json()
    const parsed = patchIncidentSchema.safeParse(body)
    if (!parsed.success) {
      return jsonError(parsed.error.issues[0]?.message ?? 'Invalid input', 400)
    }

    const { data: existing } = await supabase
      .from('incidents')
      .select('id')
      .eq('id', id)
      .eq('practice_id', member.practiceId)
      .maybeSingle()

    if (!existing) {
      return jsonError('Incident not found', 404)
    }

    const { data, error } = await supabase
      .from('incidents')
      .update({
        ...(parsed.data.status !== undefined && { status: parsed.data.status }),
        ...(parsed.data.managerNotes !== undefined && {
          manager_notes: parsed.data.managerNotes,
        }),
      })
      .eq('id', id)
      .eq('practice_id', member.practiceId)
      .select(
        'id, title, type, severity, description, surgery_id, reported_by, status, manager_notes, created_at'
      )
      .single()

    if (error) {
      console.error('Incident update failed:', error)
      return jsonError('Something went wrong', 500)
    }

    return jsonOk({
      incident: {
        id: data.id,
        title: data.title,
        type: data.type,
        severity: data.severity,
        description: data.description,
        surgeryId: data.surgery_id,
        reportedBy: data.reported_by,
        status: data.status,
        managerNotes: data.manager_notes,
        createdAt: data.created_at,
      },
    })
  } catch (error) {
    if (error instanceof MemberAuthError) {
      return jsonError(error.message, error.status)
    }
    console.error('Incident update failed:', error)
    return jsonError('Something went wrong', 500)
  }
}
