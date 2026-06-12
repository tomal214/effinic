import { createClient } from '@/lib/supabase/server'
import { MemberAuthError, requireMember } from '@/lib/auth/member'
import { jsonError, jsonOk } from '@/lib/api/response'
import {
  canCreateIncident,
  seesAllIncidents,
} from '@/lib/incidents/access'
import { createIncidentSchema } from '@/lib/validation/incidents'

async function enrichIncidents(
  supabase: Awaited<ReturnType<typeof createClient>>,
  rows: {
    id: string
    title: string
    type: string
    severity: string
    description: string
    surgery_id: string | null
    reported_by: string
    status: string
    manager_notes: string | null
    created_at: string
  }[]
) {
  const surgeryIds = [
    ...new Set(rows.map((r) => r.surgery_id).filter(Boolean)),
  ] as string[]
  const reporterIds = [...new Set(rows.map((r) => r.reported_by))]

  const [{ data: surgeries }, { data: profiles }] = await Promise.all([
    surgeryIds.length
      ? supabase.from('surgeries').select('id, name').in('id', surgeryIds)
      : Promise.resolve({ data: [] as { id: string; name: string }[] }),
    reporterIds.length
      ? supabase.from('profiles').select('id, full_name').in('id', reporterIds)
      : Promise.resolve({ data: [] as { id: string; full_name: string }[] }),
  ])

  const surgeryMap = new Map((surgeries ?? []).map((s) => [s.id, s.name]))
  const profileMap = new Map(
    (profiles ?? []).map((p) => [p.id, p.full_name])
  )

  return rows.map((row) => ({
    id: row.id,
    title: row.title,
    type: row.type,
    severity: row.severity,
    description: row.description,
    surgeryId: row.surgery_id,
    surgeryName: row.surgery_id ? surgeryMap.get(row.surgery_id) ?? null : null,
    reportedBy: row.reported_by,
    reporterName: profileMap.get(row.reported_by) ?? 'Unknown',
    status: row.status,
    managerNotes: row.manager_notes,
    createdAt: row.created_at,
  }))
}

export async function GET() {
  try {
    const supabase = await createClient()
    const member = await requireMember(supabase)

    let query = supabase
      .from('incidents')
      .select(
        'id, title, type, severity, description, surgery_id, reported_by, status, manager_notes, created_at'
      )
      .eq('practice_id', member.practiceId)
      .order('created_at', { ascending: false })

    if (!seesAllIncidents(member.role)) {
      query = query.eq('reported_by', member.userId)
    }

    const { data, error } = await query

    if (error) {
      console.error('Incidents list failed:', error)
      return jsonError('Something went wrong', 500)
    }

    const incidents = await enrichIncidents(supabase, data ?? [])
    return jsonOk({ incidents })
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
