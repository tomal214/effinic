import { describe, expect, it } from 'vitest'
import {
  canSubmitWithPhotos,
  photoSubmitBlockReason,
} from '@/lib/tasks/photo-submit'

const idle = {
  isUploading: false,
  hasErrors: false,
  pendingCount: 0,
  doneCount: 1,
}

describe('canSubmitWithPhotos', () => {
  it('allows submit when no photos were added', () => {
    expect(canSubmitWithPhotos(idle, 0)).toBe(true)
  })

  it('blocks submit while uploads are in progress', () => {
    expect(
      canSubmitWithPhotos(
        { ...idle, isUploading: true, pendingCount: 1 },
        1
      )
    ).toBe(false)
  })

  it('blocks submit when an upload failed', () => {
    expect(
      canSubmitWithPhotos({ ...idle, hasErrors: true }, 1)
    ).toBe(false)
  })

  it('allows submit when all queued photos finished', () => {
    expect(canSubmitWithPhotos(idle, 1)).toBe(true)
  })
})

describe('photoSubmitBlockReason', () => {
  it('returns null when no photos were added', () => {
    expect(photoSubmitBlockReason(idle, 0)).toBeNull()
  })

  it('explains when uploads are still running', () => {
    expect(
      photoSubmitBlockReason(
        { ...idle, isUploading: true, pendingCount: 1 },
        1
      )
    ).toMatch(/wait for photo uploads/i)
  })

  it('explains when uploads failed', () => {
    expect(
      photoSubmitBlockReason({ ...idle, hasErrors: true }, 1)
    ).toMatch(/failed photo uploads/i)
  })
})
