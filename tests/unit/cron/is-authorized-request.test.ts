import { describe, it, expect } from 'vitest'
import { isAuthorizedCronRequest } from '@/lib/cron/is-authorized-request'

describe('isAuthorizedCronRequest', () => {
  it('rejects missing header', () => {
    expect(isAuthorizedCronRequest(null, 'secret')).toBe(false)
  })

  it('rejects wrong secret', () => {
    expect(isAuthorizedCronRequest('Bearer wrong', 'secret')).toBe(false)
  })

  it('accepts matching bearer token', () => {
    expect(isAuthorizedCronRequest('Bearer secret', 'secret')).toBe(true)
  })

  it('rejects when secret env is unset', () => {
    expect(isAuthorizedCronRequest('Bearer secret', undefined)).toBe(false)
  })
})
