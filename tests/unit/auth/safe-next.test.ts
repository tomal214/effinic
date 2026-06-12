import { describe, expect, it } from 'vitest'
import { safeNext } from '@/lib/auth/safe-next'

describe('safeNext', () => {
  it('returns valid relative paths', () => {
    expect(safeNext('/app/tasks')).toBe('/app/tasks')
  })

  it('rejects protocol-relative paths', () => {
    expect(safeNext('//evil.com')).toBe('/app')
  })

  it('rejects external URLs', () => {
    expect(safeNext('https://evil.com')).toBe('/app')
  })

  it('defaults when missing', () => {
    expect(safeNext(null)).toBe('/app')
  })
})
