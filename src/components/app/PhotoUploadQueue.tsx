'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { Loader2, Check, AlertCircle, RotateCcw, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { compressPhoto } from '@/lib/uploads/compress-photo'
import { runDeferredEffect } from '@/lib/react/defer-effect'

export type PhotoQueueItem = {
  id: string
  file: File
}

export type PhotoUploadStatus = {
  isUploading: boolean
  hasErrors: boolean
  pendingCount: number
  doneCount: number
}

type ItemState = {
  id: string
  file: File
  previewUrl: string
  status: 'pending' | 'uploading' | 'done' | 'error'
  progress: number
}

async function uploadPhoto(taskId: string, file: File) {
  const compressed = await compressPhoto(file)

  const signRes = await fetch('/api/uploads/sign', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ taskId, contentType: 'image/jpeg' }),
  })

  if (!signRes.ok) throw new Error('Failed to get upload URL')

  const { data } = await signRes.json()

  const uploadRes = await fetch(data.signedUrl, {
    method: 'PUT',
    headers: { 'Content-Type': 'image/jpeg' },
    body: compressed,
  })

  if (!uploadRes.ok) throw new Error('Upload failed')

  const patchRes = await fetch(`/api/tasks/${taskId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ photoPath: data.path }),
  })

  if (!patchRes.ok) throw new Error('Failed to save photo')

  return data.path as string
}

function buildStatus(items: ItemState[]): PhotoUploadStatus {
  const doneCount = items.filter((item) => item.status === 'done').length
  const hasErrors = items.some((item) => item.status === 'error')
  const pendingCount = items.filter(
    (item) => item.status === 'pending' || item.status === 'uploading'
  ).length
  const isUploading = items.some(
    (item) => item.status === 'pending' || item.status === 'uploading'
  )

  return { isUploading, hasErrors, pendingCount, doneCount }
}

export default function PhotoUploadQueue({
  taskId,
  items,
  onComplete,
  onStatusChange,
  onRemove,
}: {
  taskId: string
  items: PhotoQueueItem[]
  onComplete?: (path: string) => void
  onStatusChange?: (status: PhotoUploadStatus) => void
  onRemove?: (id: string) => void
}) {
  const [queue, setQueue] = useState<ItemState[]>([])
  const processing = useRef<Set<string>>(new Set())
  const previewUrls = useRef<Set<string>>(new Set())

  useEffect(() => {
    setQueue((prev) => {
      const existing = new Map(prev.map((item) => [item.id, item]))
      const next: ItemState[] = []

      for (const item of items) {
        const current = existing.get(item.id)
        if (current) {
          next.push(current)
          continue
        }

        const previewUrl = URL.createObjectURL(item.file)
        previewUrls.current.add(previewUrl)
        next.push({
          id: item.id,
          file: item.file,
          previewUrl,
          status: 'pending',
          progress: 0,
        })
      }

      const keepIds = new Set(items.map((item) => item.id))
      for (const removed of prev) {
        if (!keepIds.has(removed.id)) {
          URL.revokeObjectURL(removed.previewUrl)
          previewUrls.current.delete(removed.previewUrl)
        }
      }

      return next
    })
  }, [items])

  useEffect(() => {
    return () => {
      for (const url of previewUrls.current) {
        URL.revokeObjectURL(url)
      }
      previewUrls.current.clear()
    }
  }, [])

  useEffect(() => {
    onStatusChange?.(buildStatus(queue))
  }, [queue, onStatusChange])

  const processItem = useCallback(
    async (id: string, file: File) => {
      if (processing.current.has(id)) return
      processing.current.add(id)

      setQueue((prev) =>
        prev.map((item) =>
          item.id === id ? { ...item, status: 'uploading', progress: 20 } : item
        )
      )

      try {
        const path = await uploadPhoto(taskId, file)
        setQueue((prev) =>
          prev.map((item) =>
            item.id === id ? { ...item, status: 'done', progress: 100 } : item
          )
        )
        onComplete?.(path)
      } catch (error) {
        console.error('Photo upload failed:', error)
        setQueue((prev) =>
          prev.map((item) =>
            item.id === id ? { ...item, status: 'error', progress: 0 } : item
          )
        )
      } finally {
        processing.current.delete(id)
      }
    },
    [taskId, onComplete]
  )

  useEffect(() => {
    const pending = queue.filter(
      (item) => item.status === 'pending' && !processing.current.has(item.id)
    )
    if (!pending.length) return

    runDeferredEffect(() => {
      for (const item of pending) {
        processItem(item.id, item.file)
      }
    })
  }, [queue, processItem])

  function handleRetry(id: string, file: File) {
    setQueue((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, status: 'pending', progress: 0 } : item
      )
    )
    processItem(id, file)
  }

  function handleRemove(id: string) {
    setQueue((prev) => {
      const removed = prev.find((item) => item.id === id)
      if (removed) {
        URL.revokeObjectURL(removed.previewUrl)
        previewUrls.current.delete(removed.previewUrl)
      }
      return prev.filter((item) => item.id !== id)
    })
    onRemove?.(id)
  }

  if (queue.length === 0) return null

  return (
    <div className="space-y-3">
      <p className="text-sm font-medium">Photos</p>
      <div className="grid grid-cols-3 gap-2">
        {queue.map((item) => (
          <div
            key={item.id}
            className="relative aspect-square overflow-hidden rounded-lg border border-border bg-muted"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={item.previewUrl}
              alt="Selected evidence"
              className="h-full w-full object-cover"
            />

            <div className="absolute inset-x-0 bottom-0 flex items-center justify-between gap-1 bg-background/85 px-1.5 py-1">
              {item.status === 'uploading' || item.status === 'pending' ? (
                <Loader2 className="size-4 shrink-0 animate-spin text-muted-foreground" />
              ) : null}
              {item.status === 'done' ? (
                <Check className="size-4 shrink-0 text-success" />
              ) : null}
              {item.status === 'error' ? (
                <AlertCircle className="size-4 shrink-0 text-danger" />
              ) : null}
              <span className="min-w-0 flex-1 truncate text-[10px] text-muted-foreground">
                {item.status === 'uploading'
                  ? 'Uploading…'
                  : item.status === 'pending'
                    ? 'Waiting…'
                    : item.status === 'done'
                      ? 'Uploaded'
                      : 'Failed'}
              </span>
            </div>

            {item.status === 'error' ? (
              <Button
                type="button"
                size="icon"
                variant="secondary"
                className="absolute left-1 top-1 size-8 rounded-full shadow-sm"
                onClick={() => handleRetry(item.id, item.file)}
                aria-label="Retry photo upload"
              >
                <RotateCcw className="size-3.5" />
              </Button>
            ) : null}

            {item.status !== 'uploading' && item.status !== 'pending' ? (
              <Button
                type="button"
                size="icon"
                variant="secondary"
                className="absolute right-1 top-1 size-8 rounded-full shadow-sm"
                onClick={() => handleRemove(item.id)}
                aria-label="Remove photo"
              >
                <X className="size-3.5" />
              </Button>
            ) : null}
          </div>
        ))}
      </div>

      {queue.some((item) => item.status === 'pending' || item.status === 'uploading') ? (
        <p className="text-sm text-muted-foreground">
          Uploading photos — you can complete the task once uploads finish.
        </p>
      ) : null}

      {queue.some((item) => item.status === 'error') ? (
        <p className="text-sm text-danger">
          One or more uploads failed. Retry or remove them before completing.
        </p>
      ) : null}
    </div>
  )
}
