import { describe, it, expect } from 'vitest'
import {
  buildHistoryCsv,
  formatTaskTimes,
  HISTORY_CSV_HEADERS,
} from '@/lib/tasks/history-csv'

describe('history csv', () => {
  it('formats task times', () => {
    expect(formatTaskTimes('09:00', '09:15')).toBe('09:00 – 09:15')
    expect(formatTaskTimes(null, null)).toBe('')
    expect(formatTaskTimes('10:00', null)).toBe('10:00')
  })

  it('builds csv with headers and escaped values', () => {
    const csv = buildHistoryCsv([
      {
        title: 'Task "A"',
        role: 'nurse',
        surgery: 'Surgery 1',
        status: 'completed',
        completedBy: 'Jane',
        times: '09:00 – 09:15',
        materials: 'Gloves',
        notes: 'All good',
      },
    ])

    expect(csv.startsWith(HISTORY_CSV_HEADERS.join(','))).toBe(true)
    expect(csv).toContain('"Task ""A"""')
  })
})
