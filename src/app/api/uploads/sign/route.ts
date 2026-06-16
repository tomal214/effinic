import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import {
  MemberAuthError,
  requireManagerViewerOrAdmin,
  requireWriteMember,
} from '@/lib/auth/member'
import { jsonError, jsonOk } from '@/lib/api/response'
import { uploadSignSchema } from '@/lib/validation/tasks'
import { signTaskPhotoUpload } from '@/lib/services/uploads'

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const body = await request.json()
    const parsed = uploadSignSchema.safeParse(body)

    if (!parsed.success) {
      return jsonError(parsed.error.issues[0]?.message ?? 'Invalid request', 400)
    }

    const admin = createAdminClient()
    if (parsed.data.action === 'read') {
      const member = await requireManagerViewerOrAdmin(supabase)
      const paths = parsed.data.paths ?? []
      if (!paths.length) return jsonError('No paths provided', 400)

      const signedUrls: Record<string, string> = {}

      for (const path of paths) {
        const parts = path.split('/').filter(Boolean)
        const [practiceId, scope, taskId] = parts
        if (practiceId !== member.practiceId || scope !== 'tasks' || !taskId) {
          return jsonError('Invalid path', 400)
        }

        const { data: taskRow, error } = await admin
          .from('daily_tasks')
          .select('id')
          .eq('id', taskId)
          .eq('practice_id', member.practiceId)
          .maybeSingle()

        if (error) throw error
        if (!taskRow) return jsonError('Task not found', 404)

        const { data, error: signError } = await admin.storage
          .from('task-evidence')
          .createSignedUrl(path, 60)
        if (signError) throw signError
        signedUrls[path] = data.signedUrl
      }

      return jsonOk({ signedUrls })
    }

    const member = await requireWriteMember(supabase)
    const signed = await signTaskPhotoUpload(admin, member, parsed.data.taskId)

    if (!signed) {
      return jsonError('Task not found', 404)
    }

    return jsonOk(signed)
  } catch (error) {
    if (error instanceof MemberAuthError) {
      return jsonError(error.message, error.status)
    }
    console.error('Upload sign failed:', error)
    return jsonError('Something went wrong', 500)
  }
}
