import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database'
import type { createSurgerySchema, updateSurgerySchema } from '@/lib/validation/surgeries'
import type { z } from 'zod'

type AdminClient = SupabaseClient<Database>

export async function listAllSurgeries(admin: AdminClient, practiceId: string) {
  const { data, error } = await admin
    .from('surgeries')
    .select('id, name, is_active, sort_order, created_at')
    .eq('practice_id', practiceId)
    .order('sort_order')

  if (error) throw error
  return data ?? []
}

export async function createSurgery(
  admin: AdminClient,
  practiceId: string,
  input: z.infer<typeof createSurgerySchema>
) {
  let sortOrder = input.sortOrder

  if (sortOrder === undefined) {
    const { data: existing } = await admin
      .from('surgeries')
      .select('sort_order')
      .eq('practice_id', practiceId)
      .order('sort_order', { ascending: false })
      .limit(1)
      .maybeSingle()

    sortOrder = (existing?.sort_order ?? -1) + 1
  }

  const { data, error } = await admin
    .from('surgeries')
    .insert({
      practice_id: practiceId,
      name: input.name,
      sort_order: sortOrder,
    })
    .select('id, name, is_active, sort_order, created_at')
    .single()

  if (error) throw error
  return data
}

export async function updateSurgery(
  admin: AdminClient,
  practiceId: string,
  surgeryId: string,
  input: z.infer<typeof updateSurgerySchema>
) {
  const updates: {
    name?: string
    sort_order?: number
    is_active?: boolean
  } = {}

  if (input.name !== undefined) updates.name = input.name
  if (input.sortOrder !== undefined) updates.sort_order = input.sortOrder
  if (input.isActive !== undefined) updates.is_active = input.isActive

  const { data, error } = await admin
    .from('surgeries')
    .update(updates)
    .eq('id', surgeryId)
    .eq('practice_id', practiceId)
    .select('id, name, is_active, sort_order, created_at')
    .maybeSingle()

  if (error) throw error
  return data
}

export async function deleteSurgery(
  admin: AdminClient,
  practiceId: string,
  surgeryId: string
) {
  const { data, error } = await admin
    .from('surgeries')
    .delete()
    .eq('id', surgeryId)
    .eq('practice_id', practiceId)
    .select('id')
    .maybeSingle()

  if (error) throw error
  return data
}
