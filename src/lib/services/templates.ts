import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database'
import type { createTemplateSchema, updateTemplateSchema } from '@/lib/validation/templates'
import type { z } from 'zod'

type AdminClient = SupabaseClient<Database>

export async function listTemplates(admin: AdminClient, practiceId: string) {
  const { data, error } = await admin
    .from('task_templates')
    .select(
      'id, title, time_due, role_responsible, surgery_ids, checklist_steps, is_mandatory, compliance_file_url, is_active, created_at'
    )
    .eq('practice_id', practiceId)
    .eq('is_active', true)
    .order('title')

  if (error) throw error
  return data ?? []
}

export async function createTemplate(
  admin: AdminClient,
  practiceId: string,
  input: z.infer<typeof createTemplateSchema>
) {
  const { data, error } = await admin
    .from('task_templates')
    .insert({
      practice_id: practiceId,
      title: input.title,
      time_due: input.timeDue ?? null,
      role_responsible: input.roleResponsible ?? 'nurse',
      surgery_ids: input.surgeryIds ?? [],
      checklist_steps: input.checklistSteps ?? [],
      is_mandatory: input.isMandatory ?? true,
      compliance_file_url: input.complianceFileUrl ?? null,
    })
    .select(
      'id, title, time_due, role_responsible, surgery_ids, checklist_steps, is_mandatory, compliance_file_url, is_active, created_at'
    )
    .single()

  if (error) throw error
  return data
}

export async function updateTemplate(
  admin: AdminClient,
  practiceId: string,
  templateId: string,
  input: z.infer<typeof updateTemplateSchema>
) {
  const { data, error } = await admin
    .from('task_templates')
    .update({
      ...(input.title !== undefined && { title: input.title }),
      ...(input.timeDue !== undefined && { time_due: input.timeDue }),
      ...(input.roleResponsible !== undefined && {
        role_responsible: input.roleResponsible,
      }),
      ...(input.surgeryIds !== undefined && { surgery_ids: input.surgeryIds }),
      ...(input.checklistSteps !== undefined && {
        checklist_steps: input.checklistSteps,
      }),
      ...(input.isMandatory !== undefined && {
        is_mandatory: input.isMandatory,
      }),
      ...(input.complianceFileUrl !== undefined && {
        compliance_file_url: input.complianceFileUrl,
      }),
    })
    .eq('id', templateId)
    .eq('practice_id', practiceId)
    .select(
      'id, title, time_due, role_responsible, surgery_ids, checklist_steps, is_mandatory, compliance_file_url, is_active, created_at'
    )
    .maybeSingle()

  if (error) throw error
  return data
}

export async function softDeleteTemplate(
  admin: AdminClient,
  practiceId: string,
  templateId: string
) {
  const { data, error } = await admin
    .from('task_templates')
    .update({ is_active: false })
    .eq('id', templateId)
    .eq('practice_id', practiceId)
    .select('id')
    .maybeSingle()

  if (error) throw error
  return data
}
