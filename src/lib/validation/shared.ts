import { z } from 'zod'

export const uuidSchema = z
  .string()
  .regex(
    /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/,
    'Invalid UUID'
  )

export const memberRoleSchema = z.enum([
  'admin',
  'manager',
  'nurse',
  'receptionist',
  'dentist',
  'hygienist',
  'viewer',
])

export const timeStringSchema = z
  .string()
  .regex(/^\d{2}:\d{2}(:\d{2})?$/, 'Invalid time')
