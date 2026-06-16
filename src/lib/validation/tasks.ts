import { z } from 'zod'
import { timeStringSchema, uuidSchema } from './shared'

export const completeTaskSchema = z.object({
  checklistProgress: z.record(z.string(), z.boolean()).optional(),
  startTime: timeStringSchema.optional(),
  endTime: timeStringSchema.optional(),
  materialsUsed: z.string().trim().optional(),
  notes: z.string().trim().optional(),
})

export const amendTaskSchema = completeTaskSchema.extend({
  photoPath: z.string().trim().min(1).optional(),
})

export const taskHistoryQuerySchema = z.object({
  from: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date'),
  to: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date'),
  surgeryId: uuidSchema.optional(),
})

export const uploadSignSchema = z.object({
  action: z.enum(['upload', 'read']).default('upload'),
  taskId: uuidSchema,
  contentType: z.literal('image/jpeg').default('image/jpeg'),
  paths: z.array(z.string().trim().min(1)).optional(),
})
