import { describe, it, expect } from 'vitest'
import { buildExportRange, pickDefaultWeekStart } from '@/lib/reports/export-range'

const weeks = [
  { weekStart: '2026-05-25', weekLabel: '25 May' },
  { weekStart: '2026-06-01', weekLabel: '1 Jun' },
  { weekStart: '2026-06-08', weekLabel: '8 Jun' },
]

describe('export-range', () => {
  it('pickDefaultWeekStart returns the latest week', () => {
    expect(pickDefaultWeekStart(weeks)).toBe('2026-06-08')
  })

  it('pickDefaultWeekStart returns empty string when no weeks', () => {
    expect(pickDefaultWeekStart([])).toBe('')
  })

  it('buildExportRange returns a seven-day range', () => {
    const range = buildExportRange(weeks, '2026-06-01')
    expect(range).toEqual({ from: '2026-06-01', to: '2026-06-07' })
  })

  it('buildExportRange returns null for unknown week', () => {
    expect(buildExportRange(weeks, '2026-01-01')).toBeNull()
  })
})
