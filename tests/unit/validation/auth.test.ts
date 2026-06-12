import { describe, it, expect } from 'vitest'
import {
  practiceUrlSchema,
  nurseVerifySchema,
  surgerySwitchSchema,
  createPracticeSchema,
  inviteManagerSchema,
  loginSchema,
} from '@/lib/validation/auth'

const practiceToken = '11111111-1111-1111-1111-111111111111'
const memberId = '66666666-6666-6666-6666-666666666662'
const surgeryId = '44444444-4444-4444-4444-444444444441'

describe('auth validation', () => {
  it('validates practice URL', () => {
    const result = practiceUrlSchema.safeParse({
      slug: 'demo-dental',
      token: practiceToken,
    })
    expect(result.success).toBe(true)
  })

  it('rejects invalid practice token', () => {
    const result = practiceUrlSchema.safeParse({
      slug: 'demo-dental',
      token: 'not-a-uuid',
    })
    expect(result.success).toBe(false)
  })

  it('validates nurse verify payload', () => {
    const result = nurseVerifySchema.safeParse({
      slug: 'demo-dental',
      token: practiceToken,
      memberId,
      pin: '1234',
    })
    expect(result.success).toBe(true)
  })

  it('rejects non-numeric PIN', () => {
    const result = nurseVerifySchema.safeParse({
      slug: 'demo-dental',
      token: practiceToken,
      memberId,
      pin: '12ab',
    })
    expect(result.success).toBe(false)
  })

  it('validates surgery switch', () => {
    const result = surgerySwitchSchema.safeParse({
      surgeryId,
    })
    expect(result.success).toBe(true)
  })

  it('validates create practice', () => {
    const result = createPracticeSchema.safeParse({
      name: 'Demo Dental',
      slug: 'demo-dental',
    })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.timezone).toBe('Europe/London')
    }
  })

  it('rejects invalid practice slug', () => {
    const result = createPracticeSchema.safeParse({
      name: 'Demo',
      slug: 'Demo_Dental',
    })
    expect(result.success).toBe(false)
  })

  it('validates invite manager email', () => {
    const result = inviteManagerSchema.safeParse({
      email: 'manager@example.com',
    })
    expect(result.success).toBe(true)
  })

  it('validates login', () => {
    const result = loginSchema.safeParse({
      email: 'manager@demo.effinic.test',
      password: 'secret',
    })
    expect(result.success).toBe(true)
  })
})
