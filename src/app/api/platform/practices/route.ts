import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { isPlatformAdmin } from '@/lib/auth/platform-admin'
import { jsonError, jsonOk } from '@/lib/api/response'
import { createPracticeSchema } from '@/lib/validation/auth'

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user || !isPlatformAdmin(user.email)) {
      return jsonError('Forbidden', 403)
    }

    const body = await request.json()
    const parsed = createPracticeSchema.safeParse(body)
    if (!parsed.success) {
      return jsonError(parsed.error.issues[0]?.message ?? 'Invalid request', 400)
    }

    const admin = createAdminClient()
    const { data: practice, error } = await admin
      .from('practices')
      .insert({
        name: parsed.data.name,
        slug: parsed.data.slug,
        timezone: parsed.data.timezone,
      })
      .select('id, name, slug, practice_token, timezone')
      .single()

    if (error) {
      if (error.code === '23505') {
        return jsonError('Slug already in use', 409)
      }
      console.error('Create practice failed:', error)
      return jsonError('Failed to create practice', 500)
    }

    return jsonOk({
      practice,
      practiceUrl: `/p/${practice.slug}/${practice.practice_token}`,
    })
  } catch (error) {
    console.error('Create practice failed:', error)
    return jsonError('Something went wrong', 500)
  }
}
