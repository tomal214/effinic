import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database'
import { formatEvidenceRequired } from '@/lib/tasks/evidence'
import type { createTemplateSchema, updateTemplateSchema } from '@/lib/validation/templates'
import type { z } from 'zod'

type AdminClient = SupabaseClient<Database>

const TEMPLATE_SELECT =
  'id, title, description, time_due, role_responsible, priority, category, surgery_ids, checklist_steps, is_mandatory, evidence_required, compliance_file_url, is_active, created_at'

export async function listTemplates(admin: AdminClient, practiceId: string) {
  const { data, error } = await admin
    .from('task_templates')
    .select(TEMPLATE_SELECT)
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
      description: input.description ?? null,
      time_due: input.timeDue ?? null,
      role_responsible: input.roleResponsible ?? 'nurse',
      priority: input.priority ?? 'medium',
      category: input.category ?? null,
      surgery_ids: input.surgeryIds ?? [],
      checklist_steps: input.checklistSteps ?? [],
      is_mandatory: input.isMandatory ?? true,
      evidence_required: formatEvidenceRequired(
        input.evidencePhoto,
        input.evidenceChecklist
      ),
      compliance_file_url: input.complianceFileUrl ?? null,
    })
    .select(TEMPLATE_SELECT)
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
      ...(input.description !== undefined && { description: input.description }),
      ...(input.timeDue !== undefined && { time_due: input.timeDue }),
      ...(input.roleResponsible !== undefined && {
        role_responsible: input.roleResponsible,
      }),
      ...(input.priority !== undefined && { priority: input.priority }),
      ...(input.category !== undefined && { category: input.category }),
      ...(input.surgeryIds !== undefined && { surgery_ids: input.surgeryIds }),
      ...(input.checklistSteps !== undefined && {
        checklist_steps: input.checklistSteps,
      }),
      ...(input.isMandatory !== undefined && {
        is_mandatory: input.isMandatory,
      }),
      ...(input.evidencePhoto !== undefined || input.evidenceChecklist !== undefined
        ? {
            evidence_required: formatEvidenceRequired(
              input.evidencePhoto ?? false,
              input.evidenceChecklist ?? false
            ),
          }
        : {}),
      ...(input.complianceFileUrl !== undefined && {
        compliance_file_url: input.complianceFileUrl,
      }),
    })
    .eq('id', templateId)
    .eq('practice_id', practiceId)
    .select(TEMPLATE_SELECT)
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
