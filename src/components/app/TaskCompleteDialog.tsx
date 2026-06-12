'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import PhotoUploadQueue from '@/components/app/PhotoUploadQueue'
import type { EnrichedTask } from '@/lib/services/tasks'

export default function TaskCompleteDialog({
  task,
  open,
  onOpenChange,
  onCompleted,
}: {
  task: EnrichedTask | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onCompleted: () => void
}) {
  const [checklist, setChecklist] = useState<Record<string, boolean>>({})
  const [startTime, setStartTime] = useState('')
  const [endTime, setEndTime] = useState('')
  const [materials, setMaterials] = useState('')
  const [notes, setNotes] = useState('')
  const [photos, setPhotos] = useState<File[]>([])
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  if (!task) return null

  function resetForm() {
    setChecklist({})
    setStartTime('')
    setEndTime('')
    setMaterials('')
    setNotes('')
    setPhotos([])
    setError('')
  }

  function handleOpenChange(next: boolean) {
    if (!next) resetForm()
    onOpenChange(next)
  }

  function toggleStep(step: string, checked: boolean) {
    setChecklist((prev) => ({ ...prev, [step]: checked }))
  }

  function handlePhotoSelect(event: React.ChangeEvent<HTMLInputElement>) {
    const selected = event.target.files
    if (!selected?.length) return
    setPhotos(Array.from(selected))
  }

  async function handleSubmit() {
    if (!task) return

    setSubmitting(true)
    setError('')

    try {
      const res = await fetch(`/api/tasks/${task.id}/complete`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          checklistProgress: checklist,
          startTime: startTime || undefined,
          endTime: endTime || undefined,
          materialsUsed: materials || undefined,
          notes: notes || undefined,
        }),
      })

      if (!res.ok) {
        const body = await res.json()
        throw new Error(body.error ?? 'Failed to complete task')
      }

      handleOpenChange(false)
      onCompleted()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{task.title}</DialogTitle>
        </DialogHeader>

        <div className="space-y-5">
          {task.checklistSteps.length > 0 && (
            <div className="space-y-3">
              <p className="text-sm font-medium">Checklist</p>
              {task.checklistSteps.map((step) => (
                <label
                  key={step}
                  className="flex items-start gap-3 text-sm leading-snug"
                >
                  <Checkbox
                    checked={checklist[step] ?? false}
                    onCheckedChange={(checked) =>
                      toggleStep(step, checked === true)
                    }
                    className="mt-0.5"
                  />
                  <span>{step}</span>
                </label>
              ))}
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="start-time">Start time</Label>
              <Input
                id="start-time"
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="end-time">End time</Label>
              <Input
                id="end-time"
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="materials">Materials used</Label>
            <Input
              id="materials"
              value={materials}
              onChange={(e) => setMaterials(e.target.value)}
              placeholder="Optional"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="notes">Notes</Label>
            <Input
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Optional"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="photos">Photos</Label>
            <Input
              id="photos"
              type="file"
              accept="image/*"
              capture="environment"
              multiple
              onChange={handlePhotoSelect}
            />
          </div>

          {photos.length > 0 && (
            <PhotoUploadQueue taskId={task.id} files={photos} />
          )}

          {error && (
            <p className="text-sm text-danger" role="alert">
              {error}
            </p>
          )}
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => handleOpenChange(false)}
            disabled={submitting}
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={handleSubmit}
            disabled={submitting}
            className="rounded-full"
          >
            {submitting ? 'Saving…' : 'Complete task'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
