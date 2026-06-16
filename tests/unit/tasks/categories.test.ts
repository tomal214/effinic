import { describe, expect, it } from 'vitest'
import {
  categoryLabel,
  countByCategory,
  filterTasksByCategory,
} from '@/lib/tasks/categories'

describe('categoryLabel', () => {
  it('returns General for null', () => {
    expect(categoryLabel(null)).toBe('General')
  })

  it('returns label for known category', () => {
    expect(categoryLabel('sterilisation')).toBe('Sterilisation')
  })
})

describe('filterTasksByCategory', () => {
  const tasks = [
    { category: 'sterilisation' },
    { category: 'cleaning' },
    { category: null },
  ]

  it('returns all when category is all', () => {
    expect(filterTasksByCategory(tasks, 'all')).toHaveLength(3)
  })

  it('filters by category', () => {
    expect(filterTasksByCategory(tasks, 'cleaning')).toHaveLength(1)
  })

  it('treats null category as general', () => {
    expect(filterTasksByCategory(tasks, 'general')).toHaveLength(1)
  })
})

describe('countByCategory', () => {
  it('counts tasks per category', () => {
    const tasks = [
      { category: 'cleaning' },
      { category: 'cleaning' },
      { category: null },
    ]
    const counts = countByCategory(tasks)
    expect(counts.get('cleaning')).toBe(2)
    expect(counts.get('general')).toBe(1)
  })
})
