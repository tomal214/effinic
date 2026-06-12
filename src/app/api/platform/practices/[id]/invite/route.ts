import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { isPlatformAdmin } from '@/lib/auth/platform-admin'
import { jsonError, jsonOk } from '@/lib/api/response'
import { inviteManagerSchema } from '@/lib/validation/auth'

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: practiceId } = await params
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user || !isPlatformAdmin(user.email)) {
      return jsonError('Forbidden', 403)
    }

    const body = await request.json()
    const parsed = inviteManagerSchema.safeParse(body)
    if (!parsed.success) {
      return jsonError(parsed.error.issues[0]?.message ?? 'Invalid request', 400)
    }

    const admin = createAdminClient()
    const { data: practice } = await admin
      .from('practices')
      .select('id, name')
      .eq('id', practiceId)
      .maybeSingle()

    if (!practice) {
      return jsonError('Practice not found', 404)
    }

    const expiresAt = new Date()
    expiresAt.setDate(expiresAt.getDate() + 7)

    const { data: invite, error: inviteError } = await admin
      .from('practice_invites')
      .insert({
        practice_id: practiceId,
        email: parsed.data.email.toLowerCase(),
        role: 'manager',
        expires_at: expiresAt.toISOString(),
        created_by: user.id,
      })
      .select('id, token, email')
      .single()

    if (inviteError) {
      console.error('Create invite failed:', inviteError)
      return jsonError('Failed to create invite', 500)
    }

    const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000').replace(
      /\/$/,
      ''
    )
    const { data: authData, error: authError } =
      await admin.auth.admin.inviteUserByEmail(parsed.data.email, {
        redirectTo: `${siteUrl}/auth/confirm`,
        data: {
          practice_id: practiceId,
          full_name: parsed.data.email.split('@')[0],
        },
      })

    if (authError) {
      console.error('Invite user failed:', authError)
      return jsonError('Failed to send invite', 500)
    }

    return jsonOk({
      invite,
      userId: authData.user?.id,
      practiceName: practice.name,
    })
  } catch (error) {
    console.error('Invite manager failed:', error)
    return jsonError('Something went wrong', 500)
  }
}
