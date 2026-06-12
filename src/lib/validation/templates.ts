import { z } from 'zod'
import { memberRoleSchema, timeStringSchema, uuidSchema } from './shared'

export const checklistStepSchema = z.string().trim().min(1, 'Checklist step cannot be empty')

export const createTemplateSchema = z.object({
  title: z.string().trim().min(1, 'Title is required'),
  timeDue: timeStringSchema.nullable().optional(),
  roleResponsible: memberRoleSchema.optional(),
  surgeryIds: z.array(uuidSchema).optional(),
  checklistSteps: z.array(checklistStepSchema).optional(),
  isMandatory: z.boolean().optional(),
  complianceFileUrl: z
    .union([z.string().trim().url('Valid URL required'), z.literal('')])
    .optional()
    .transform((value) => (value === '' || value === undefined ? null : value)),
})

export const updateTemplateSchema = createTemplateSchema.partial()
