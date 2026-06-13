import { createClient } from '@/lib/supabase/server'
import { getOnboardingStatus } from '@/lib/auth/onboarding-status'
import { jsonError, jsonOk } from '@/lib/api/response'

export async function GET() {
  try {
    const supabase = await createClient()
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser()

    if (error || !user) {
      return jsonError('Unauthorized', 401)
    }

    const status = await getOnboardingStatus(user)
    return jsonOk(status)
  } catch (err) {
    console.error('Onboarding status failed:', err)
    return jsonError('Something went wrong', 500)
  }
}
