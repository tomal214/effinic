import { expect, type Page } from '@playwright/test'

export function hasSupabaseEnv() {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY &&
      process.env.SUPABASE_SERVICE_ROLE_KEY
  )
}

export const DEMO = {
  practiceUrl: '/p/demo-dental/11111111-1111-1111-1111-111111111111',
  managerEmail: 'manager@demo.effinic.test',
  managerPassword: 'DemoManager1!',
  nursePin: '1234',
}

export async function loginAsManager(page: Page) {
  await page.goto('/login')
  await page.getByLabel(/email/i).fill(DEMO.managerEmail)
  await page.getByLabel(/password/i).fill(DEMO.managerPassword)
  await page.getByRole('button', { name: /sign in|log in/i }).click()
  await expect(page.getByRole('button', { name: /signing in/i })).toBeHidden({
    timeout: 15_000,
  })
  await expect(page).toHaveURL(/\/app/, { timeout: 20_000 })
}
