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

export async function loginAsNurse(
  page: Page,
  options?: { surgeryName?: string }
) {
  const surgeryName = options?.surgeryName ?? 'Surgery 1'

  await page.goto(DEMO.practiceUrl)
  await expect(page.getByRole('heading', { name: 'Who are you?' })).toBeVisible()
  await expect(page.getByRole('button', { name: 'Sarah Nurse' })).toBeVisible({
    timeout: 20_000,
  })
  await page.getByRole('button', { name: 'Sarah Nurse' }).click()
  await page.getByRole('button', { name: 'Continue' }).click()

  for (const digit of DEMO.nursePin) {
    await page.getByRole('button', { name: digit, exact: true }).click()
  }

  await expect(
    page.getByRole('heading', { name: 'Select your surgery' })
  ).toBeVisible({ timeout: 20_000 })

  const surgeryButton = page.getByRole('button', { name: surgeryName })
  await expect(surgeryButton).toBeVisible({ timeout: 15_000 })
  await surgeryButton.click()

  const startShift = page.getByRole('button', { name: 'Start shift' })
  await expect(startShift).toBeEnabled({ timeout: 10_000 })
  await startShift.click()
  await expect(page).toHaveURL(/\/app\/tasks/, { timeout: 30_000 })
}
