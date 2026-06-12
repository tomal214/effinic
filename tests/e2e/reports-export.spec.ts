import { test, expect } from '@playwright/test'
import { hasSupabaseEnv, loginAsManager } from './helpers'

test.describe('reports export', () => {
  test.skip(!hasSupabaseEnv(), 'Requires local Supabase')

  test('manager can export CSV when weekly data exists', async ({ page }) => {
    await loginAsManager(page)

    const weeklyResponse = page.waitForResponse(
      (res) =>
        res.url().includes('/api/reports/weekly') && res.status() === 200,
      { timeout: 20_000 }
    )
    await page.goto('/app/reports')
    await weeklyResponse

    await expect(page.getByRole('button', { name: /export csv/i })).toBeEnabled({
      timeout: 20_000,
    })
  })
})
