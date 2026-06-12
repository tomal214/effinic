import { test, expect } from '@playwright/test'
import { hasSupabaseEnv, loginAsManager } from './helpers'

test.describe('RLS isolation', () => {
  test.skip(
    !hasSupabaseEnv(),
    'Requires local Supabase — run supabase start && supabase db reset'
  )

  test('unauthenticated task list returns 401', async ({ request }) => {
    const res = await request.get('http://localhost:3000/api/tasks')
    expect(res.status()).toBe(401)
  })

  test('manager cannot amend unknown task in another practice scope', async ({
    page,
  }) => {
    await loginAsManager(page)

    const res = await page.request.patch(
      '/api/tasks/00000000-0000-0000-0000-000000000099',
      { data: { notes: 'Cross-practice attempt' } }
    )

    expect(res.status()).toBe(404)
    const body = await res.json()
    expect(body.error).toMatch(/not found/i)
  })
})
