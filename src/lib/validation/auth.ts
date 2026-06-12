import { z } from 'zod'
import { PIN_LENGTH } from '@/lib/session/constants'

const uuidShape = z
  .string()
  .regex(
    /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/,
    'Invalid UUID'
  )

export const practiceUrlSchema = z.object({
  slug: z.string().min(1),
  token: uuidShape,
})

export const staffListSchema = practiceUrlSchema

export const nurseVerifySchema = practiceUrlSchema.extend({
  memberId: uuidShape,
  pin: z
    .string()
    .length(PIN_LENGTH)
    .regex(/^\d+$/, 'PIN must be numeric'),
})

export const surgerySwitchSchema = z.object({
  surgeryId: uuidShape,
})

export const createPracticeSchema = z.object({
  name: z.string().trim().min(1, 'Name is required'),
  slug: z
    .string()
    .trim()
    .min(1)
    .regex(/^[a-z0-9-]+$/, 'Slug must be lowercase letters, numbers, and hyphens'),
  timezone: z.string().min(1).default('Europe/London'),
})

export const inviteManagerSchema = z.object({
  email: z.string().trim().email('Valid email required'),
})

export const loginSchema = z.object({
  email: z.string().trim().email(),
  password: z.string().min(1),
})
