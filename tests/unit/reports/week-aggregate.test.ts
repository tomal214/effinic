import { describe, it, expect } from 'vitest'
import { aggregateWeeklyReports } from '@/lib/reports/week-aggregate'

describe('aggregateWeeklyReports', () => {
  it('computes completion rate and incidents per week', () => {
    const anchor = new Date('2026-06-12T12:00:00')
    const tasks = [
      { task_date: '2026-06-10', status: 'completed' },
      { task_date: '2026-06-10', status: 'pending' },
      { task_date: '2026-06-03', status: 'completed' },
    ]
    const incidents = [
      { created_at: '2026-06-10T09:00:00Z' },
      { created_at: '2026-06-04T09:00:00Z' },
    ]

    const weeks = aggregateWeeklyReports(tasks, incidents, anchor, 4)
    const current = weeks[weeks.length - 1]

    expect(current.totalTasks).toBe(2)
    expect(current.completedTasks).toBe(1)
    expect(current.completionRate).toBe(50)
    expect(current.incidentCount).toBe(1)
  })
})
