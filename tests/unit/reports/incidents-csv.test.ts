import { describe, expect, it } from 'vitest'
import { buildIncidentsCsv } from '@/lib/reports/incidents-csv'

describe('buildIncidentsCsv', () => {
  it('builds a header row and escaped incident rows', () => {
    const csv = buildIncidentsCsv([
      {
        title: 'Slip near steriliser',
        type: 'near_miss',
        severity: 'low',
        status: 'resolved',
        surgery: 'Surgery 1',
        reporter: 'Sarah Nurse',
        createdAt: '2026-06-10T09:00:00Z',
        description: 'Wet floor, mopped immediately.',
      },
    ])

    expect(csv.split('\n')[0]).toBe(
      'Title,Type,Severity,Status,Surgery,Reporter,Created at,Description'
    )
    expect(csv).toContain('Slip near steriliser')
    expect(csv).toContain('Sarah Nurse')
  })
})
