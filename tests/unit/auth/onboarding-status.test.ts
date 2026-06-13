import { describe, expect, it } from 'vitest'
import { isPasswordSet } from '@/lib/auth/onboarding-status'

describe('isPasswordSet', () => {
  it('returns true when metadata flag is set', () => {
    expect(
      isPasswordSet({
        user_metadata: { password_set: true },
      } as never)
    ).toBe(true)
  })

  it('returns false when metadata flag is missing', () => {
    expect(
      isPasswordSet({
        user_metadata: {},
      } as never)
    ).toBe(false)
  })
})
