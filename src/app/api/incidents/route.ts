import { createClient } from '@/lib/supabase/server'
import { MemberAuthError, requireMember } from '@/lib/auth/member'
import { jsonError, jsonOk } from '@/lib/api/response'
import {
  canCreateIncident,
} from '@/lib/incidents/access'
import { createIncidentSchema } from '@/lib/validation/incidents'
import { loadIncidentsPageData } from '@/lib/app/page-data'

export async function GET() {
  try {
    const supabase = await createClient()
    const member = await requireMember(supabase)
    const data = await loadIncidentsPageData(supabase, member)

    return jsonOk(data)
  } catch (error) {
    if (error instanceof MemberAuthError) {
      return jsonError(error.message, error.status)
    }
    console.error('Incidents list failed:', error)
    return jsonError('Something went wrong', 500)
  }
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const member = await requireMember(supabase)

    if (!canCreateIncident(member.role)) {
      return jsonError('Forbidden', 403)
    }

    const body = await request.json()
    const parsed = createIncidentSchema.safeParse(body)
    if (!parsed.success) {
      return jsonError(parsed.error.issues[0]?.message ?? 'Invalid input', 400)
    }

    const surgeryId =
      parsed.data.surgeryId ?? member.activeSurgeryId ?? null

    const { data, error } = await supabase
      .from('incidents')
      .insert({
        practice_id: member.practiceId,
        title: parsed.data.title,
        type: parsed.data.type,
        severity: parsed.data.severity,
        description: parsed.data.description,
        surgery_id: surgeryId,
        reported_by: member.userId,
      })
      .select('id')
      .single()

    if (error) {
      console.error('Incident create failed:', error)
      return jsonError('Something went wrong', 500)
    }

    return jsonOk({ id: data.id }, { status: 201 })
  } catch (error) {
    if (error instanceof MemberAuthError) {
      return jsonError(error.message, error.status)
    }
    console.error('Incident create failed:', error)
    return jsonError('Something went wrong', 500)
  }
}
