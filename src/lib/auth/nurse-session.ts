import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database'
import { createAdminClient } from '@/lib/supabase/admin'

export async function createSessionForUser(
  supabase: SupabaseClient<Database>,
  userId: string
) {
  const admin = createAdminClient()
  const { data: userData, error: userError } =
    await admin.auth.admin.getUserById(userId)
  if (userError || !userData.user?.email) {
    throw new Error('User not found')
  }

  const { data: linkData, error: linkError } =
    await admin.auth.admin.generateLink({
      type: 'magiclink',
      email: userData.user.email,
    })
  if (linkError || !linkData?.properties?.hashed_token) {
    throw new Error('Failed to create session')
  }

  const { error: sessionError } = await supabase.auth.verifyOtp({
    token_hash: linkData.properties.hashed_token,
    type: 'email',
  })
  if (sessionError) {
    throw new Error('Failed to verify session')
  }
}
