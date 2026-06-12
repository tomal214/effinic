export type TaskTemplateForGeneration = {
  id: string
  practice_id: string
  surgery_ids: string[]
  assigned_user_id: string | null
  is_active: boolean
}

export type DailyTaskInsert = {
  practice_id: string
  task_template_id: string
  surgery_id: string | null
  task_date: string
  assigned_to: string | null
  status: 'pending'
}

export function generateDailyTasksFromTemplates(
  templates: TaskTemplateForGeneration[],
  taskDate: string
): DailyTaskInsert[] {
  const rows: DailyTaskInsert[] = []

  for (const template of templates) {
    if (!template.is_active) {
      continue
    }

    const base = {
      practice_id: template.practice_id,
      task_template_id: template.id,
      task_date: taskDate,
      assigned_to: template.assigned_user_id,
      status: 'pending' as const,
    }

    if (template.surgery_ids.length === 0) {
      rows.push({ ...base, surgery_id: null })
      continue
    }

    for (const surgeryId of template.surgery_ids) {
      rows.push({ ...base, surgery_id: surgeryId })
    }
  }

  return rows
}
