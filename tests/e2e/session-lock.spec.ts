import { test, expect } from '@playwright/test'
import { hasSupabaseEnv, loginAsNurse } from './helpers'

test.describe('session lock API', () => {
  test.skip(
    !hasSupabaseEnv(),
    'Requires local Supabase — run supabase start && supabase db reset'
  )

  test('amend morning task returns 403 when session locked', async ({ page }) => {
    test.setTimeout(60_000)
    await loginAsNurse(page)

    const tasksRes = await page.request.get('/api/tasks')
    expect(tasksRes.ok()).toBeTruthy()
    const { data } = await tasksRes.json()
    const morningTask = (data.tasks ?? []).find(
      (t: { session: string; title: string }) =>
        t.session === 'morning' && t.title.includes('Steriliser')
    )

    test.skip(!morningTask, 'No morning steriliser task in seed data')

    const amendRes = await page.request.patch(`/api/tasks/${morningTask.id}`, {
      data: { notes: 'Should be locked' },
    })

    expect(amendRes.status()).toBe(403)
    const body = await amendRes.json()
    expect(body.error).toMatch(/locked/i)
  })
})
