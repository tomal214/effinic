import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1'

type TaskTemplateForGeneration = {
  id: string
  practice_id: string
  surgery_ids: string[]
  assigned_user_id: string | null
  is_active: boolean
}

type DailyTaskInsert = {
  practice_id: string
  task_template_id: string
  surgery_id: string | null
  task_date: string
  assigned_to: string | null
  status: 'pending'
}

function generateDailyTasksFromTemplates(
  templates: TaskTemplateForGeneration[],
  taskDate: string
): DailyTaskInsert[] {
  const rows: DailyTaskInsert[] = []

  for (const template of templates) {
    if (!template.is_active) continue

    const base = {
      practice_id: template.practice_id,
      task_template_id: template.id,
      task_date: taskDate,
      assigned_to: template.assigned_user_id,
      status: 'pending' as const,
    }

    if (!template.surgery_ids?.length) {
      rows.push({ ...base, surgery_id: null })
      continue
    }

    for (const surgeryId of template.surgery_ids) {
      rows.push({ ...base, surgery_id: surgeryId })
    }
  }

  return rows
}

function todayInTimezone(timezone: string): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: timezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date())
}

Deno.serve(async (req) => {
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  const cronSecret = Deno.env.get('CRON_SECRET')
  const authHeader = req.headers.get('authorization')
  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

  if (!supabaseUrl || !serviceRoleKey) {
    return new Response(JSON.stringify({ error: 'Missing Supabase env' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  const admin = createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  })

  const { data: practices, error: practicesError } = await admin
    .from('practices')
    .select('id, timezone')

  if (practicesError) {
    console.error('Failed to load practices:', practicesError)
    return new Response(JSON.stringify({ error: 'Failed to load practices' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  let inserted = 0
  let skipped = 0

  for (const practice of practices ?? []) {
    const timezone = practice.timezone ?? 'Europe/London'
    const today = todayInTimezone(timezone)

    const { count } = await admin
      .from('daily_tasks')
      .select('*', { count: 'exact', head: true })
      .eq('practice_id', practice.id)
      .eq('task_date', today)

    if (count && count > 0) {
      skipped += 1
      continue
    }

    const { data: templates, error: templatesError } = await admin
      .from('task_templates')
      .select('id, practice_id, surgery_ids, assigned_user_id, is_active')
      .eq('practice_id', practice.id)
      .eq('is_active', true)

    if (templatesError) {
      console.error(`Templates failed for ${practice.id}:`, templatesError)
      continue
    }

    const rows = generateDailyTasksFromTemplates(
      (templates ?? []) as TaskTemplateForGeneration[],
      today
    )

    if (!rows.length) continue

    const { error: insertError } = await admin.from('daily_tasks').insert(rows)

    if (insertError && insertError.code !== '23505') {
      console.error(`Insert failed for ${practice.id}:`, insertError)
      continue
    }

    inserted += rows.length
  }

  return new Response(
    JSON.stringify({
      ok: true,
      practices: practices?.length ?? 0,
      inserted,
      skippedPractices: skipped,
    }),
    { headers: { 'Content-Type': 'application/json' } }
  )
})
