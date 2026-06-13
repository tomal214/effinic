import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import {
  MemberAuthError,
  requireManagerOrAdmin,
  requireManagerViewerOrAdmin,
} from '@/lib/auth/member'
import { jsonError, jsonOk } from '@/lib/api/response'
import { createStaffSchema } from '@/lib/validation/staff'
import { createStaff } from '@/lib/services/staff'
import { loadStaffPageData } from '@/lib/app/page-data'

export async function GET() {
  try {
    const supabase = await createClient()
    const member = await requireManagerViewerOrAdmin(supabase)
    const data = await loadStaffPageData(member)

    return jsonOk(data)
  } catch (error) {
    if (error instanceof MemberAuthError) {
      return jsonError(error.message, error.status)
    }
    console.error('Staff list failed:', error)
    return jsonError('Something went wrong', 500)
  }
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const member = await requireManagerOrAdmin(supabase)
    const body = await request.json()
    const parsed = createStaffSchema.safeParse(body)

    if (!parsed.success) {
      return jsonError(parsed.error.issues[0]?.message ?? 'Invalid request', 400)
    }

    const admin = createAdminClient()
    const { data: practice } = await admin
      .from('practices')
      .select('slug')
      .eq('id', member.practiceId)
      .single()

    if (!practice) {
      return jsonError('Practice not found', 404)
    }

    const result = await createStaff(
      admin,
      member.practiceId,
      practice.slug,
      parsed.data
    )

    return jsonOk(result)
  } catch (error) {
    if (error instanceof MemberAuthError) {
      return jsonError(error.message, error.status)
    }
    console.error('Staff create failed:', error)
    return jsonError('Something went wrong', 500)
  }
}
