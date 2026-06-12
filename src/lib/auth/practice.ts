import { createAdminClient } from '@/lib/supabase/admin'

export async function getPracticeBySlugToken(slug: string, token: string) {
  const admin = createAdminClient()
  const { data, error } = await admin
    .from('practices')
    .select('id, name, slug, practice_token, timezone')
    .eq('slug', slug)
    .eq('practice_token', token)
    .maybeSingle()

  if (error || !data) return null
  return data
}
