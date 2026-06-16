export type IncidentExportRow = {
  title: string
  type: string
  severity: string
  status: string
  surgery: string
  reporter: string
  createdAt: string
  description: string
}

export const INCIDENTS_CSV_HEADERS = [
  'Title',
  'Type',
  'Severity',
  'Status',
  'Surgery',
  'Reporter',
  'Created at',
  'Description',
] as const

function escapeCsvCell(value: string): string {
  if (/[",\n]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`
  }
  return value
}

export function buildIncidentsCsv(rows: IncidentExportRow[]): string {
  const lines = [
    INCIDENTS_CSV_HEADERS.join(','),
    ...rows.map((row) =>
      [
        row.title,
        row.type,
        row.severity,
        row.status,
        row.surgery,
        row.reporter,
        row.createdAt,
        row.description,
      ]
        .map(escapeCsvCell)
        .join(',')
    ),
  ]
  return lines.join('\n')
}
