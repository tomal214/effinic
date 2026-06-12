import { describe, it, expect, vi } from 'vitest'
import {
  assertSurgeryInPractice,
  assertUserInPractice,
} from '@/lib/practice/assert-practice-refs'

function mockAdmin(result: { id: string } | null) {
  return {
    from: vi.fn().mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              maybeSingle: vi.fn().mockResolvedValue({ data: result }),
            }),
          }),
        }),
      }),
    }),
  }
}

describe('assertPracticeRefs', () => {
  it('assertUserInPractice fails when member missing', async () => {
    const admin = mockAdmin(null)
    const result = await assertUserInPractice(admin, 'practice-1', 'user-1')
    expect(result).toEqual({ ok: false, code: 'invalid_user' })
  })

  it('assertUserInPractice passes when member exists', async () => {
    const admin = mockAdmin({ id: 'member-1' })
    const result = await assertUserInPractice(admin, 'practice-1', 'user-1')
    expect(result).toEqual({ ok: true })
  })

  it('assertSurgeryInPractice fails when surgery missing', async () => {
    const admin = mockAdmin(null)
    const result = await assertSurgeryInPractice(admin, 'practice-1', 'surgery-1')
    expect(result).toEqual({ ok: false, code: 'invalid_surgery' })
  })

  it('assertSurgeryInPractice passes when surgery exists', async () => {
    const admin = mockAdmin({ id: 'surgery-1' })
    const result = await assertSurgeryInPractice(admin, 'practice-1', 'surgery-1')
    expect(result).toEqual({ ok: true })
  })
})
