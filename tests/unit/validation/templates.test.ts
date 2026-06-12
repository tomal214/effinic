import { describe, it, expect } from 'vitest'
import {
  createTemplateSchema,
  checklistStepSchema,
} from '@/lib/validation/templates'

const surgeryId = '44444444-4444-4444-4444-444444444441'

describe('template validation', () => {
  it('rejects empty title', () => {
    const result = createTemplateSchema.safeParse({ title: '   ' })
    expect(result.success).toBe(false)
  })

  it('trims title', () => {
    const result = createTemplateSchema.safeParse({ title: '  Morning prep  ' })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.title).toBe('Morning prep')
    }
  })

  it('accepts valid template payload', () => {
    const result = createTemplateSchema.safeParse({
      title: 'Autoclave check',
      timeDue: '09:00',
      roleResponsible: 'nurse',
      surgeryIds: [surgeryId],
      checklistSteps: ['Check seal', 'Run cycle'],
      isMandatory: true,
      complianceFileUrl: 'https://example.com/doc.pdf',
    })
    expect(result.success).toBe(true)
  })

  it('transforms empty compliance URL to null', () => {
    const result = createTemplateSchema.safeParse({
      title: 'Task',
      complianceFileUrl: '',
    })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.complianceFileUrl).toBeNull()
    }
  })

  it('rejects empty checklist step', () => {
    const result = checklistStepSchema.safeParse('   ')
    expect(result.success).toBe(false)
  })
})
