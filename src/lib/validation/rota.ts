import { z } from 'zod'

const uuidShape = z
  .string()
  .regex(
    /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/,
    'Invalid UUID'
  )

const dateShape = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date')

export const weekStartQuerySchema = z.object({
  weekStart: dateShape,
})

export const assignRotaSchema = z.object({
  userId: uuidShape,
  surgeryId: uuidShape,
  shiftDate: dateShape,
  shiftType: z.enum(['morning', 'afternoon', 'full_day']).default('full_day'),
})

export const publishRotaSchema = z.object({
  weekStart: dateShape,
})

export const assignIdSchema = z.object({
  id: uuidShape,
})
