import { test, expect } from '@playwright/test'
import { DEMO, hasSupabaseEnv } from './helpers'

test.describe('nurse complete task', () => {
  test.skip(
    !hasSupabaseEnv(),
    'Requires local Supabase — run supabase start && supabase db reset'
  )

  test('practice URL → PIN → surgery → complete task', async ({ page }) => {
    await page.goto(DEMO.practiceUrl)

    await expect(page.getByRole('heading', { name: 'Who are you?' })).toBeVisible()
    await page.getByRole('button', { name: 'Sarah Nurse' }).click()
    await page.getByRole('button', { name: 'Continue' }).click()

    for (const digit of DEMO.nursePin) {
      await page.getByRole('button', { name: digit, exact: true }).click()
    }

    await expect(page.getByRole('heading', { name: /Hi Sarah/i })).toBeVisible({
      timeout: 10_000,
    })

    await page.getByRole('button', { name: 'Surgery 1' }).click()
    await page.getByRole('button', { name: 'Start shift' }).click()

    await expect(page).toHaveURL(/\/app\/tasks/, { timeout: 30_000 })

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
