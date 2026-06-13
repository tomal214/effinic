import { createClient } from '@/lib/supabase/server'
import { MemberAuthError, requireMember } from '@/lib/auth/member'
import { jsonError, jsonOk } from '@/lib/api/response'
import { weekStartQuerySchema } from '@/lib/validation/rota'
import { loadRotaPageData } from '@/lib/app/page-data'

export async function GET(request: Request) {
  try {
    const supabase = await createClient()
    const member = await requireMember(supabase)

    const { searchParams } = new URL(request.url)
    const parsed = weekStartQuerySchema.safeParse({
      weekStart: searchParams.get('weekStart'),
    })
    if (!parsed.success) {
      return jsonError(parsed.error.issues[0]?.message ?? 'Invalid weekStart', 400)
    }

    if (!['admin', 'manager', 'viewer'].includes(member.role)) {
      return jsonError('Forbidden', 403)
    }

    const data = await loadRotaPageData(
      supabase,
      member,
      parsed.data.weekStart
    )

    return jsonOk(data)
  } catch (error) {
    if (error instanceof MemberAuthError) {
      return jsonError(error.message, error.status)
    }
    console.error('Rota list failed:', error)
    return jsonError('Something went wrong', 500)
  }
}
