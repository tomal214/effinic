import { describe, expect, it } from 'vitest'
import {
  aggregateByCategory,
  aggregateByNurse,
  aggregateBySurgery,
  aggregateWeekSummary,
  buildWeekReportDetail,
  type WeekTaskRow,
} from '@/lib/reports/week-breakdown'

const tasks: WeekTaskRow[] = [
  {
    status: 'completed',
    surgeryId: 's1',
    surgeryName: 'Surgery 1',
    nurseUserId: 'n1',
    nurseName: 'Sarah',
    category: 'sterilisation',
    isMandatory: true,
    hasPhoto: true,
  },
  {
    status: 'pending',
    surgeryId: 's1',
    surgeryName: 'Surgery 1',
    nurseUserId: 'n1',
    nurseName: 'Sarah',
    category: 'sterilisation',
    isMandatory: true,
    hasPhoto: false,
  },
  {
    status: 'completed',
    surgeryId: 's2',
    surgeryName: 'Surgery 2',
    nurseUserId: 'n2',
    nurseName: 'James',
    category: 'cleaning',
    isMandatory: false,
    hasPhoto: false,
  },
]

describe('aggregateWeekSummary', () => {
  it('counts completion, mandatory misses, photos, and incidents', () => {
    expect(aggregateWeekSummary(tasks, 2)).toEqual({
      totalTasks: 3,
      completedTasks: 2,
      completionRate: 67,
      mandatoryIncomplete: 1,
      incidentCount: 2,
      tasksWithPhotos: 1,
    })
  })
})

describe('aggregateBySurgery', () => {
  it('groups by surgery with completion rates', () => {
    const rows = aggregateBySurgery(tasks)
    expect(rows).toHaveLength(2)
    expect(rows.find((row) => row.label === 'Surgery 1')).toMatchObject({
      total: 2,
      completed: 1,
      completionRate: 50,
    })
  })
})

describe('aggregateByNurse', () => {
  it('groups by nurse name', () => {
    const rows = aggregateByNurse(tasks)
    expect(rows.map((row) => row.label).sort()).toEqual(['James', 'Sarah'])
  })
})

describe('aggregateByCategory', () => {
  it('labels categories for display', () => {
    const rows = aggregateByCategory(tasks)
    expect(rows.find((row) => row.label === 'Sterilisation')?.total).toBe(2)
    expect(rows.find((row) => row.label === 'Cleaning')?.total).toBe(1)
  })
})

describe('buildWeekReportDetail', () => {
  it('returns summary and all breakdown tables', () => {
    const detail = buildWeekReportDetail(tasks, 1)
    expect(detail.summary.totalTasks).toBe(3)
    expect(detail.bySurgery).toHaveLength(2)
    expect(detail.byNurse).toHaveLength(2)
    expect(detail.byCategory).toHaveLength(2)
  })
})
