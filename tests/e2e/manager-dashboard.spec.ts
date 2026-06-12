import { test, expect } from '@playwright/test'
import { hasSupabaseEnv, loginAsManager } from './helpers'

test.describe('manager dashboard', () => {
  test.skip(
    !hasSupabaseEnv(),
    'Requires local Supabase — run supabase start && supabase db reset'
  )

  test('manager sees dashboard stats after login', async ({ page }) => {
    await loginAsManager(page)

    await expect(page.getByRole('heading', { name: 'Dashboard' })).toBeVisible({
      timeout: 20_000,
    })

    await expect(page.getByText('Incomplete today')).toBeVisible()
    await expect(page.getByText('Overdue today')).toBeVisible()
    await expect(page.getByText('By surgery')).toBeVisible()
  })
})
