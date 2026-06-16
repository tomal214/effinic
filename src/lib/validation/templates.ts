import { z } from 'zod'
import { TASK_CATEGORIES } from '@/lib/tasks/categories'
import { memberRoleSchema, timeStringSchema, uuidSchema } from './shared'

export const checklistStepSchema = z.string().trim().min(1, 'Checklist step cannot be empty')

const templateCategorySchema = z.enum(TASK_CATEGORIES)

export const createTemplateSchema = z.object({
  title: z.string().trim().min(1, 'Title is required'),
  description: z.string().trim().optional(),
  timeDue: timeStringSchema.nullable().optional(),
  roleResponsible: memberRoleSchema.optional(),
  priority: z.enum(['low', 'medium', 'high']).optional(),
  category: templateCategorySchema.optional(),
  surgeryIds: z.array(uuidSchema).optional(),
  checklistSteps: z.array(checklistStepSchema).optional(),
  isMandatory: z.boolean().optional(),
  evidencePhoto: z.boolean().optional(),
  evidenceChecklist: z.boolean().optional(),
  complianceFileUrl: z
    .union([z.string().trim().url('Valid URL required'), z.literal('')])
    .optional()
    .transform((value) => (value === '' || value === undefined ? null : value)),
})

export const updateTemplateSchema = createTemplateSchema.partial()
