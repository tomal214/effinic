import { config as loadEnv } from 'dotenv'
import { resolve } from 'path'
import { defineConfig, devices } from '@playwright/test'

loadEnv({ path: resolve(process.cwd(), '.env.local') })

function hasSupabaseEnv() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  const service = process.env.SUPABASE_SERVICE_ROLE_KEY
  return Boolean(
    url &&
      anon &&
      service &&
      !url.includes('your-') &&
      !anon.includes('your-')
  )
}

const e2eEnabled = hasSupabaseEnv()

export default defineConfig({
  testDir: 'tests/e2e',
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: 1,
  reporter: 'list',
  use: {
    baseURL: process.env.PLAYWRIGHT_BASE_URL ?? 'http://localhost:3000',
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  webServer: e2eEnabled
    ? {
        command: 'pnpm exec next dev --webpack',
        url: 'http://localhost:3000',
        reuseExistingServer: !process.env.CI,
        timeout: 120_000,
      }
    : undefined,
})
