import { describe, it, expect } from 'vitest'
import {
  createIncidentSchema,
  patchIncidentSchema,
} from '@/lib/validation/incidents'

const surgeryId = '44444444-4444-4444-4444-444444444441'

describe('incidents validation', () => {
  it('validates create incident', () => {
    const result = createIncidentSchema.safeParse({
      title: 'Slip hazard',
      description: 'Wet floor near steriliser',
    })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.type).toBe('incident')
      expect(result.data.severity).toBe('medium')
    }
  })

  it('rejects empty title', () => {
    const result = createIncidentSchema.safeParse({
      title: '  ',
      description: 'Details',
    })
    expect(result.success).toBe(false)
  })

  it('validates patch incident', () => {
    const result = patchIncidentSchema.safeParse({
      status: 'resolved',
      managerNotes: 'Closed after review',
    })
    expect(result.success).toBe(true)
  })

  it('rejects empty patch', () => {
    const result = patchIncidentSchema.safeParse({})
    expect(result.success).toBe(false)
  })

  it('accepts optional surgery id', () => {
    const result = createIncidentSchema.safeParse({
      title: 'Test',
      description: 'Test',
      surgeryId,
    })
    expect(result.success).toBe(true)
  })
})
