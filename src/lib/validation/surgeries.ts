import { z } from 'zod'

export const createSurgerySchema = z.object({
  name: z.string().trim().min(1, 'Name is required'),
  sortOrder: z.number().int().min(0).optional(),
})

export const updateSurgerySchema = z.object({
  name: z.string().trim().min(1, 'Name is required').optional(),
  sortOrder: z.number().int().min(0).optional(),
  isActive: z.boolean().optional(),
})
