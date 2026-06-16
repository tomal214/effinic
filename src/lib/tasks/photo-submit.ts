import type { PhotoUploadStatus } from '@/components/app/PhotoUploadQueue'

export function canSubmitWithPhotos(
  uploadStatus: PhotoUploadStatus,
  queuedPhotoCount: number
) {
  if (queuedPhotoCount === 0) return true
  return (
    !uploadStatus.isUploading &&
    !uploadStatus.hasErrors &&
    uploadStatus.pendingCount === 0
  )
}

export function photoSubmitBlockReason(
  uploadStatus: PhotoUploadStatus,
  queuedPhotoCount: number
) {
  if (queuedPhotoCount === 0) return null
  if (uploadStatus.isUploading || uploadStatus.pendingCount > 0) {
    return 'Wait for photo uploads to finish before completing this task.'
  }
  if (uploadStatus.hasErrors) {
    return 'Fix or remove failed photo uploads before completing this task.'
  }
  return null
}
