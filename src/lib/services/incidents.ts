import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database'
import type { CurrentMember } from '@/lib/auth/member'
import { seesAllIncidents } from '@/lib/incidents/access'

type Supabase = SupabaseClient<Database>

async function enrichIncidents(
  supabase: Supabase,
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

export async function listIncidentsForMember(
  supabase: Supabase,
  member: CurrentMember
) {
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
  if (error) throw error

  return enrichIncidents(supabase, data ?? [])
}
