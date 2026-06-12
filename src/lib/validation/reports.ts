import { z } from 'zod'
import { uuidSchema } from './shared'

export const reportsExportQuerySchema = z.object({
  from: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date'),
  to: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date'),
  surgeryId: uuidSchema.optional(),
})
