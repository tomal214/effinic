import { describe, expect, it } from 'vitest'
import {
  evidenceLabel,
  evidenceSatisfied,
  formatEvidenceRequired,
  parseEvidenceRequired,
} from '@/lib/tasks/evidence'

describe('parseEvidenceRequired', () => {
  it('parses comma-separated values', () => {
    expect(parseEvidenceRequired('photo, checklist')).toEqual(['photo', 'checklist'])
  })

  it('returns empty array for null', () => {
    expect(parseEvidenceRequired(null)).toEqual([])
  })

  it('ignores unknown values', () => {
    expect(parseEvidenceRequired('photo, signature')).toEqual(['photo'])
  })
})

describe('evidenceSatisfied', () => {
  it('requires photo when photo in template', () => {
    expect(
      evidenceSatisfied(['photo'], { checklistComplete: true, photoCount: 0 })
    ).toBe(false)
  })

  it('passes when all requirements met', () => {
    expect(
      evidenceSatisfied(['photo', 'checklist'], {
        checklistComplete: true,
        photoCount: 1,
      })
    ).toBe(true)
  })

  it('requires checklist when checklist in template', () => {
    expect(
      evidenceSatisfied(['checklist'], { checklistComplete: false, photoCount: 1 })
    ).toBe(false)
  })
})

describe('evidenceLabel', () => {
  it('returns null when empty', () => {
    expect(evidenceLabel([])).toBeNull()
  })

  it('joins labels', () => {
    expect(evidenceLabel(['photo', 'checklist'])).toBe('Photo, Checklist')
  })
})

describe('formatEvidenceRequired', () => {
  it('formats photo and checklist flags', () => {
    expect(formatEvidenceRequired(true, true)).toBe('photo, checklist')
  })

  it('returns null when neither required', () => {
    expect(formatEvidenceRequired(false, false)).toBeNull()
  })
})
