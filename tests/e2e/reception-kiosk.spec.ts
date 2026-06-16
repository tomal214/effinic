import { test, expect } from '@playwright/test'
import { hasSupabaseEnv, loginAsReceptionist } from './helpers'

test.describe('reception kiosk', () => {
  test.skip(
    !hasSupabaseEnv(),
    'Requires local Supabase — run supabase start && supabase db reset'
  )

  test('desk reception → PIN → tasks visible (no surgery step)', async ({ page }) => {
    test.setTimeout(60_000)
    await loginAsReceptionist(page)

    await expect(page.getByRole('heading', { name: "Today's tasks" })).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Select your surgery' })).toHaveCount(
      0
    )

    await expect(
      page.getByRole('button', { name: /Cash-up and card totals/i }).first()
    ).toBeVisible({ timeout: 20_000 })
  })
})

