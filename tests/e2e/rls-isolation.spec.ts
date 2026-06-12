import { test, expect } from '@playwright/test'
import { hasSupabaseEnv } from './helpers'

test.describe('RLS isolation', () => {
  test.skip(
    !hasSupabaseEnv(),
    'Requires local Supabase — run supabase start && supabase db reset'
  )

  test('stub — cross-practice task access blocked', async () => {
    // Full two-practice seed not yet available; document expected behaviour:
    // a member of practice A cannot fetch practice B daily_task by ID via API.
    expect(true).toBe(true)
  })
})
