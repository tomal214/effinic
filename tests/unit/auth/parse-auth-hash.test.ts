import { describe, it, expect } from 'vitest'
import {
  needsPasswordSetup,
  parseAuthHash,
  parseHashSession,
} from '@/lib/auth/parse-auth-hash'

describe('parseAuthHash', () => {
  it('reads invite type from hash', () => {
    const result = parseAuthHash('#access_token=abc&type=invite')
    expect(result.type).toBe('invite')
    expect(result.hasAccessToken).toBe(true)
  })

  it('returns empty for missing hash', () => {
    expect(parseAuthHash('')).toEqual({ type: null, hasAccessToken: false })
  })
})

describe('needsPasswordSetup', () => {
  it('returns true for invite hash', () => {
    expect(needsPasswordSetup('#access_token=x&type=invite')).toBe(true)
  })

  it('returns false for magiclink without invite', () => {
    expect(needsPasswordSetup('#access_token=x&type=magiclink')).toBe(false)
  })

  it('returns true when access token present without type', () => {
    expect(needsPasswordSetup('#access_token=x')).toBe(true)
  })

  it('returns true when invite query param set', () => {
    expect(needsPasswordSetup('', { inviteQuery: true })).toBe(true)
  })
})

describe('parseHashSession', () => {
  it('extracts access and refresh tokens from hash', () => {
    expect(
      parseHashSession('#access_token=abc&refresh_token=def&type=invite')
    ).toEqual({
      access_token: 'abc',
      refresh_token: 'def',
    })
  })

  it('returns null when tokens missing', () => {
    expect(parseHashSession('#type=invite')).toBeNull()
  })
})
