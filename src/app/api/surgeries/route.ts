import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import {
  MemberAuthError,
  requireManagerOrAdmin,
  requireMember,
} from '@/lib/auth/member'
import { jsonError, jsonOk } from '@/lib/api/response'
import { createSurgerySchema } from '@/lib/validation/surgeries'
import { createSurgery } from '@/lib/services/surgeries'
import { loadSurgeriesData } from '@/lib/app/page-data'

export async function GET() {
  try {
    const supabase = await createClient()
    const member = await requireMember(supabase)
    const admin = createAdminClient()
    const data = await loadSurgeriesData(admin, member)

    return jsonOk(data)
  } catch (error) {
    if (error instanceof MemberAuthError) {
      return jsonError(error.message, error.status)
    }
    console.error('Surgeries list failed:', error)
    return jsonError('Something went wrong', 500)
  }
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const member = await requireManagerOrAdmin(supabase)
    const body = await request.json()
    const parsed = createSurgerySchema.safeParse(body)

    if (!parsed.success) {
      return jsonError(parsed.error.issues[0]?.message ?? 'Invalid request', 400)
    }

    const admin = createAdminClient()
    const surgery = await createSurgery(admin, member.practiceId, parsed.data)

    return jsonOk({ surgery })
  } catch (error) {
    if (error instanceof MemberAuthError) {
      return jsonError(error.message, error.status)
    }
    console.error('Surgery create failed:', error)
    return jsonError('Something went wrong', 500)
  }
}
