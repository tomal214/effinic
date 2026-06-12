import { test, expect } from '@playwright/test'
import { hasSupabaseEnv, loginAsNurse } from './helpers'

test.describe('nurse complete task', () => {
  test.skip(
    !hasSupabaseEnv(),
    'Requires local Supabase — run supabase start && supabase db reset'
  )

  test('practice URL → PIN → surgery → complete task', async ({ page }) => {
    test.setTimeout(60_000)
    await loginAsNurse(page)

    const taskButton = page
      .getByRole('button')
      .filter({ hasText: /Steriliser|Reception|Surgery prep/i })
      .first()

    await expect(taskButton).toBeVisible({ timeout: 15_000 })
    await taskButton.click()

    await page.getByRole('button', { name: 'Complete task' }).click()

    await expect(page.getByText('Done').first()).toBeVisible({
      timeout: 15_000,
    })
  })
})
