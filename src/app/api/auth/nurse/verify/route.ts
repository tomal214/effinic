import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { verifyPin } from '@/lib/auth/pin'
import { createSessionForUser } from '@/lib/auth/nurse-session'
import { getPracticeBySlugToken } from '@/lib/auth/practice'
import { jsonError, jsonOk } from '@/lib/api/response'
import { nurseVerifySchema } from '@/lib/validation/auth'
import {
  PIN_LOCKOUT_MINUTES,
  PIN_MAX_ATTEMPTS,
} from '@/lib/session/constants'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const parsed = nurseVerifySchema.safeParse(body)
    if (!parsed.success) {
      return jsonError('Invalid request', 400)
    }

    const { slug, token, memberId, pin } = parsed.data
    const practice = await getPracticeBySlugToken(slug, token)
    if (!practice) {
      return jsonError('Not found', 404)
    }

    const admin = createAdminClient()
    const { data: member } = await admin
      .from('practice_members')
      .select(
        'id, user_id, role, is_active, practice_member_pins ( pin_hash, pin_failed_attempts, pin_locked_until )'
      )
      .eq('id', memberId)
      .eq('practice_id', practice.id)
      .maybeSingle()

    const pinRecord = member?.practice_member_pins
    const pinData = Array.isArray(pinRecord) ? pinRecord[0] : pinRecord

    if (!member?.is_active || !pinData?.pin_hash) {
      return jsonError('Not found', 404)
    }

    if (pinData.pin_locked_until) {
      const lockedUntil = new Date(pinData.pin_locked_until)
      if (lockedUntil > new Date()) {
        return jsonError('PIN locked. Try again later.', 429)
      }
    }

    const valid = await verifyPin(pin, pinData.pin_hash)
    if (!valid) {
      const attempts = pinData.pin_failed_attempts + 1
      const updates: {
        pin_failed_attempts: number
        pin_locked_until?: string
      } = { pin_failed_attempts: attempts }

      if (attempts >= PIN_MAX_ATTEMPTS) {
        const lockUntil = new Date()
        lockUntil.setMinutes(lockUntil.getMinutes() + PIN_LOCKOUT_MINUTES)
        updates.pin_locked_until = lockUntil.toISOString()
      }

      await admin
        .from('practice_member_pins')
        .update(updates)
        .eq('member_id', member.id)

      return jsonError('Incorrect PIN', 401)
    }

    await admin
      .from('practice_member_pins')
      .update({ pin_failed_attempts: 0, pin_locked_until: null })
      .eq('member_id', member.id)

    const supabase = await createClient()
    await supabase.auth.signOut()
    await createSessionForUser(supabase, member.user_id)

    return jsonOk({ ok: true, role: member.role })
  } catch (error) {
    console.error('PIN verify failed:', error)
    return jsonError('Something went wrong', 500)
  }
}
