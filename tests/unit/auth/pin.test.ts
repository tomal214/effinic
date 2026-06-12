import { describe, it, expect } from 'vitest'
import { generatePin, hashPin, verifyPin } from '@/lib/auth/pin'

describe('pin', () => {
  it('generates 4-digit pin', () => {
    expect(generatePin()).toMatch(/^\d{4}$/)
  })

  it('verifies correct pin', async () => {
    const hash = await hashPin('1234')
    expect(await verifyPin('1234', hash)).toBe(true)
    expect(await verifyPin('9999', hash)).toBe(false)
  })
})
