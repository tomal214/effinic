import { test, expect } from '@playwright/test'
import { DEMO, hasSupabaseEnv } from './helpers'

test.describe('session lock API', () => {
  test.skip(
    !hasSupabaseEnv(),
    'Requires local Supabase — run supabase start && supabase db reset'
  )

  test.skip(
    !process.env.TEST_FROZEN_TIME,
    'Set TEST_FROZEN_TIME=2026-06-12T14:00:00+01:00 on the dev server for this test'
  )

  test('amend morning task returns 403 when session locked', async ({ page }) => {
    await page.goto(DEMO.practiceUrl)
    await page.getByRole('button', { name: 'Sarah Nurse' }).click()
    await page.getByRole('button', { name: 'Continue' }).click()

    for (const digit of DEMO.nursePin) {
      await page.getByRole('button', { name: digit, exact: true }).click()
    }

    await page.getByRole('button', { name: 'Surgery 1' }).click()
    await page.getByRole('button', { name: 'Start shift' }).click()
    await expect(page).toHaveURL(/\/app\/tasks/)

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
