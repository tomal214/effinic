'use client'

import { useEffect, useRef, useState } from 'react'
import { Loader2, Check, AlertCircle } from 'lucide-react'
import { compressPhoto } from '@/lib/uploads/compress-photo'

type QueueItem = {
  id: string
  file: File
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

export default function PhotoUploadQueue({
  taskId,
  files,
  onComplete,
}: {
  taskId: string
  files: File[]
  onComplete?: (path: string) => void
}) {
  const [items, setItems] = useState<QueueItem[]>(() =>
    files.map((file, index) => ({
      id: `${Date.now()}-${index}`,
      file,
      status: 'pending',
      progress: 0,
    }))
  )
  const started = useRef(false)

  useEffect(() => {
    if (started.current || files.length === 0) return
    started.current = true

    async function processQueue() {
      for (let index = 0; index < files.length; index++) {
        const file = files[index]
        const itemId = `${Date.now()}-${index}`

        setItems((prev) =>
          prev.map((i) =>
            i.file === file ? { ...i, status: 'uploading', progress: 20 } : i
          )
        )

        try {
          const path = await uploadPhoto(taskId, file)
          setItems((prev) =>
            prev.map((i) =>
              i.file === file
                ? { ...i, status: 'done', progress: 100 }
                : i
            )
          )
          onComplete?.(path)
        } catch (error) {
          console.error('Photo upload failed:', error)
          setItems((prev) =>
            prev.map((i) =>
              i.file === file ? { ...i, status: 'error', progress: 0 } : i
            )
          )
        }
      }
    }

    processQueue()
  }, [files, taskId, onComplete])

  if (items.length === 0) return null

  return (
    <div className="space-y-2 rounded-lg border border-border p-3">
      <p className="text-sm font-medium">Photo uploads</p>
      {items.map((item) => (
        <div key={item.id} className="flex items-center gap-2 text-sm">
          {item.status === 'uploading' && (
            <Loader2 className="size-4 animate-spin text-muted-foreground" />
          )}
          {item.status === 'done' && (
            <Check className="size-4 text-success" />
          )}
          {item.status === 'error' && (
            <AlertCircle className="size-4 text-danger" />
          )}
          {item.status === 'pending' && (
            <Loader2 className="size-4 text-muted-foreground" />
          )}
          <span className="flex-1 truncate">{item.file.name}</span>
          {item.status === 'uploading' && (
            <span className="text-xs text-muted-foreground">
              {item.progress}%
            </span>
          )}
        </div>
      ))}
    </div>
  )
}
