export type HistoryExportRow = {
  title: string
  role: string
  surgery: string
  status: string
  completedBy: string
  times: string
  materials: string
  notes: string
}

export const HISTORY_CSV_HEADERS = [
  'Task Title',
  'Role',
  'Surgery',
  'Status',
  'Completed By',
  'Times',
  'Materials',
  'Notes',
] as const

function escapeCsvCell(value: string): string {
  if (/[",\n]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`
  }
  return value
}

export function formatTaskTimes(
  startTime: string | null,
  endTime: string | null
): string {
  if (!startTime && !endTime) return ''
  if (startTime && endTime) return `${startTime} – ${endTime}`
  return startTime ?? endTime ?? ''
}

export function buildHistoryCsv(rows: HistoryExportRow[]): string {
  const lines = [
    HISTORY_CSV_HEADERS.join(','),
    ...rows.map((row) =>
      [
        row.title,
        row.role,
        row.surgery,
        row.status,
        row.completedBy,
        row.times,
        row.materials,
        row.notes,
      ]
        .map(escapeCsvCell)
        .join(',')
    ),
  ]
  return lines.join('\n')
}
