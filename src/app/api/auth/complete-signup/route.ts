import { createClient } from '@/lib/supabase/server'
import { linkManagerToPractice } from '@/lib/auth/link-manager-to-practice'
import { isPasswordSet } from '@/lib/auth/onboarding-status'
import { jsonError, jsonOk } from '@/lib/api/response'

export async function POST() {
  try {
    const supabase = await createClient()
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser()

    if (error || !user) {
      return jsonError('Unauthorized', 401)
    }

    const result = await linkManagerToPractice(user)

    if (!result.linked) {
      if (result.reason === 'no_practice') {
        return jsonError('No practice linked to this account', 400)
      }
      if (result.reason === 'no_invite') {
        return jsonError(
          'No valid invite found for this email. Ask your admin to send a new invite from the platform.',
          403
        )
      }
      return jsonError('Could not finish account setup', 500)
    }

    if (!result.alreadyMember && !isPasswordSet(user)) {
      return jsonError('Set a password before continuing', 400)
    }

    return jsonOk({
      ok: true,
      practiceId: result.practiceId,
      alreadyMember: result.alreadyMember,
    })
  } catch (err) {
    console.error('Complete signup failed:', err)
    return jsonError('Something went wrong', 500)
  }
}
