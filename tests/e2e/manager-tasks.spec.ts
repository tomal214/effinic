import { test, expect } from '@playwright/test'
import { hasSupabaseEnv, loginAsManager } from './helpers'

test.describe('manager tasks page', () => {
  test.skip(!hasSupabaseEnv(), 'Requires local Supabase')

  test('manager sees today tasks on /app/tasks', async ({ page }) => {
    await loginAsManager(page)

    await page.goto('/app/tasks')
    await expect(page.getByRole('heading', { name: "Today's tasks" })).toBeVisible()

    await expect(page.getByRole('button', { name: /end morning session/i })).toHaveCount(0)
    await expect(page.getByRole('button', { name: /end day/i })).toHaveCount(0)

    await expect(
      page.getByRole('button', { name: /Steriliser cycle check/i }).first()
    ).toBeVisible({ timeout: 20_000 })
  })
})
