import { z } from 'zod'
import { memberRoleSchema } from './shared'

export const createStaffSchema = z.object({
  fullName: z.string().trim().min(1, 'Name is required'),
  role: memberRoleSchema,
  email: z.string().trim().email('Valid email required').optional().or(z.literal('')),
})

export const updateStaffSchema = z.object({
  fullName: z.string().trim().min(1, 'Name is required').optional(),
  role: memberRoleSchema.optional(),
  isActive: z.boolean().optional(),
})
