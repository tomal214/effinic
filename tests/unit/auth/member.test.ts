import { describe, expect, it } from 'vitest'
import { usesPasswordLogin } from '@/lib/auth/member'

describe('usesPasswordLogin', () => {
  it('returns true for manager and admin', () => {
    expect(usesPasswordLogin('manager')).toBe(true)
    expect(usesPasswordLogin('admin')).toBe(true)
  })

  it('returns false for PIN kiosk roles', () => {
    expect(usesPasswordLogin('nurse')).toBe(false)
    expect(usesPasswordLogin('receptionist')).toBe(false)
    expect(usesPasswordLogin('viewer')).toBe(false)
  })
})
