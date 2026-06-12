import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import {
  MemberAuthError,
  requireManagerViewerOrAdmin,
} from '@/lib/auth/member'
import { jsonError } from '@/lib/api/response'
import { taskHistoryQuerySchema } from '@/lib/validation/tasks'
import { exportTaskHistoryCsv } from '@/lib/services/tasks'

export async function GET(request: Request) {
  try {
    const supabase = await createClient()
    const member = await requireManagerViewerOrAdmin(supabase)

    const { searchParams } = new URL(request.url)
    const parsed = taskHistoryQuerySchema.safeParse({
      from: searchParams.get('from'),
      to: searchParams.get('to'),
      surgeryId: searchParams.get('surgeryId') ?? undefined,
    })

    if (!parsed.success) {
      return jsonError(parsed.error.issues[0]?.message ?? 'Invalid request', 400)
    }

    const admin = createAdminClient()
    const csv = await exportTaskHistoryCsv(
      admin,
      member,
      parsed.data.from,
      parsed.data.to,
      parsed.data.surgeryId
    )

    return new Response(csv, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="task-history-${parsed.data.from}-${parsed.data.to}.csv"`,
      },
    })
  } catch (error) {
    if (error instanceof MemberAuthError) {
      return jsonError(error.message, error.status)
    }
    console.error('Task history export failed:', error)
    return jsonError('Something went wrong', 500)
  }
}
