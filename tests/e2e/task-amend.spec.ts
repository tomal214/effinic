import { test, expect } from '@playwright/test'
import { hasSupabaseEnv, loginAsNurse } from './helpers'

test.describe('task amend', () => {
  test.skip(
    !hasSupabaseEnv(),
    'Requires local Supabase — run supabase start && supabase db reset'
  )

  test('nurse can amend notes on completed unlocked task', async ({ page }) => {
    test.setTimeout(60_000)
    await loginAsNurse(page)

    const taskButton = page.getByRole('button', { name: /Clinical waste disposal/i })

    await expect(taskButton).toBeVisible({ timeout: 15_000 })
    await taskButton.click()
    await page.getByRole('button', { name: 'Complete task' }).click()
    await expect(page.getByText('Done').first()).toBeVisible({ timeout: 15_000 })

    await taskButton.click()
    await expect(page.getByRole('dialog')).toContainText(/Amend:/i)

    const notes = `Amended at ${Date.now()}`
    await page.getByLabel('Notes').fill(notes)
    await page.getByRole('button', { name: 'Save changes' }).click()
    await expect(page.getByRole('dialog')).toBeHidden({ timeout: 10_000 })

    const tasksRes = await page.request.get('/api/tasks')
    expect(tasksRes.ok()).toBeTruthy()
    const { data } = await tasksRes.json()
    const amended = (data.tasks ?? []).find(
      (t: { notes: string | null }) => t.notes === notes
    )
    expect(amended).toBeTruthy()
  })
})
