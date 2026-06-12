import { describe, it, expect } from 'vitest'
import {
  weekStartQuerySchema,
  assignRotaSchema,
  publishRotaSchema,
} from '@/lib/validation/rota'

const userId = '33333333-3333-3333-3333-333333333332'
const surgeryId = '44444444-4444-4444-4444-444444444441'

describe('rota validation', () => {
  it('validates week start query', () => {
    const result = weekStartQuerySchema.safeParse({
      weekStart: '2026-06-09',
    })
    expect(result.success).toBe(true)
  })

  it('rejects invalid week start', () => {
    const result = weekStartQuerySchema.safeParse({
      weekStart: '09-06-2026',
    })
    expect(result.success).toBe(false)
  })

  it('validates assign rota', () => {
    const result = assignRotaSchema.safeParse({
      userId,
      surgeryId,
      shiftDate: '2026-06-10',
    })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.shiftType).toBe('full_day')
    }
  })

  it('validates publish rota', () => {
    const result = publishRotaSchema.safeParse({
      weekStart: '2026-06-09',
    })
    expect(result.success).toBe(true)
  })
})
