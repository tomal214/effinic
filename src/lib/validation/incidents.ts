import { z } from 'zod'

const uuidShape = z
  .string()
  .regex(
    /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/,
    'Invalid UUID'
  )

export const createIncidentSchema = z.object({
  title: z.string().trim().min(1, 'Title is required'),
  type: z.enum(['incident', 'near_miss', 'issue']).default('incident'),
  severity: z.enum(['low', 'medium', 'high', 'critical']).default('medium'),
  description: z.string().trim().min(1, 'Description is required'),
  surgeryId: uuidShape.nullable().optional(),
})

export const patchIncidentSchema = z
  .object({
    status: z.enum(['open', 'under_review', 'resolved']).optional(),
    managerNotes: z.string().nullable().optional(),
  })
  .refine(
    (data) => data.status !== undefined || data.managerNotes !== undefined,
    'At least one field is required'
  )

export const incidentIdSchema = z.object({
  id: uuidShape,
})
