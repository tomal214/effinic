'use client'

import { useEffect, useMemo, useState } from 'react'
import { ExternalLink } from 'lucide-react'
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
import {
  formatTimeForInput,
  getTaskDialogMode,
} from '@/lib/tasks/task-dialog-mode'
import { evidenceSatisfied } from '@/lib/tasks/evidence'

function TaskCompleteForm({
  task,
  forceReadOnly,
  onClose,
  onCompleted,
}: {
  task: EnrichedTask
  forceReadOnly?: boolean
  onClose: () => void
  onCompleted: () => void
}) {
  const mode = getTaskDialogMode(task)
  const readOnly = forceReadOnly || mode === 'view'
  const [checklist, setChecklist] = useState(task.checklistProgress ?? {})
  const [startTime, setStartTime] = useState(formatTimeForInput(task.startTime))
  const [endTime, setEndTime] = useState(formatTimeForInput(task.endTime))
  const [materials, setMaterials] = useState(task.materialsUsed ?? '')
  const [notes, setNotes] = useState(task.notes ?? '')
  const [photos, setPhotos] = useState<File[]>([])
  const [photoPaths, setPhotoPaths] = useState<string[]>(task.photoPaths ?? [])
  const [signedPhotoUrls, setSignedPhotoUrls] = useState<Record<string, string>>({})
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  const checklistComplete = useMemo(() => {
    if (!task.checklistSteps.length) return true
    return task.checklistSteps.every((step) => checklist[step] === true)
  }, [task.checklistSteps, checklist])

  const evidenceOk = useMemo(() => {
    return evidenceSatisfied(task.evidenceRequired, {
      checklistComplete,
      photoCount: photoPaths.length,
    })
  }, [task.evidenceRequired, checklistComplete, photoPaths.length])

  useEffect(() => {
    if (mode !== 'view' || photoPaths.length === 0) return

    async function loadSignedUrls() {
      try {
        const res = await fetch('/api/uploads/sign', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'read',
            taskId: task.id,
            paths: photoPaths,
          }),
        })
        if (!res.ok) return
        const body = await res.json()
        setSignedPhotoUrls(body.data?.signedUrls ?? {})
      } catch (err) {
        console.error('Failed to sign read URLs:', err)
      }
    }

    loadSignedUrls()
  }, [mode, task.id, photoPaths])

  function toggleStep(step: string, checked: boolean) {
    setChecklist((prev) => ({ ...prev, [step]: checked }))
  }

  function handlePhotoSelect(event: React.ChangeEvent<HTMLInputElement>) {
    const selected = event.target.files
    if (!selected?.length) return
    setPhotos(Array.from(selected))
  }

  async function handleSubmit() {
    if (readOnly) return

    setSubmitting(true)
    setError('')

    if (!evidenceOk) {
      setSubmitting(false)
      setError('Evidence required before completing this task.')
      return
    }

    const payload = {
      checklistProgress: checklist,
      startTime: startTime || undefined,
      endTime: endTime || undefined,
      materialsUsed: materials || undefined,
      notes: notes || undefined,
    }

    try {
      const res =
        mode === 'amend'
          ? await fetch(`/api/tasks/${task.id}`, {
              method: 'PATCH',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(payload),
            })
          : await fetch(`/api/tasks/${task.id}/complete`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(payload),
            })

      if (!res.ok) {
        const body = await res.json()
        throw new Error(
          body.error ??
            (mode === 'amend' ? 'Failed to amend task' : 'Failed to complete task')
        )
      }

      onClose()
      onCompleted()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setSubmitting(false)
    }
  }

  const submitLabel =
    mode === 'amend'
      ? submitting
        ? 'Saving…'
        : 'Save changes'
      : submitting
        ? 'Saving…'
        : 'Complete task'

  return (
    <>
      <DialogHeader>
        <DialogTitle>
          {mode === 'amend' ? `Amend: ${task.title}` : task.title}
        </DialogTitle>
      </DialogHeader>

      <div className="space-y-5">
        {task.complianceFileUrl ? (
          <a
            href={task.complianceFileUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline"
          >
            View compliance doc
            <ExternalLink className="size-3.5" aria-hidden />
          </a>
        ) : null}

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
                    !readOnly && toggleStep(step, checked === true)
                  }
                  disabled={readOnly}
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
              readOnly={readOnly}
              disabled={readOnly}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="end-time">End time</Label>
            <Input
              id="end-time"
              type="time"
              value={endTime}
              onChange={(e) => setEndTime(e.target.value)}
              readOnly={readOnly}
              disabled={readOnly}
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
            readOnly={readOnly}
            disabled={readOnly}
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="notes">Notes</Label>
          <Input
            id="notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Optional"
            readOnly={readOnly}
            disabled={readOnly}
          />
        </div>

        {!readOnly && mode === 'complete' ? (
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
        ) : null}

        {photos.length > 0 && (
          <PhotoUploadQueue
            taskId={task.id}
            files={photos}
            onComplete={(path) => setPhotoPaths((prev) => [...prev, path])}
          />
        )}

        {readOnly && photoPaths.length > 0 ? (
          <div className="space-y-2">
            <p className="text-sm font-medium">Photos</p>
            <div className="grid grid-cols-3 gap-2">
              {photoPaths.map((path) => (
                <a
                  key={path}
                  href={signedPhotoUrls[path] ?? '#'}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group relative aspect-square overflow-hidden rounded-lg border border-border bg-muted"
                  aria-disabled={!signedPhotoUrls[path]}
                >
                  {signedPhotoUrls[path] ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={signedPhotoUrls[path]}
                      alt="Task evidence"
                      className="h-full w-full object-cover transition group-hover:scale-[1.02]"
                      loading="lazy"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-xs text-muted-foreground">
                      Loading…
                    </div>
                  )}
                </a>
              ))}
            </div>
          </div>
        ) : null}

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
          onClick={onClose}
          disabled={submitting}
        >
          {readOnly ? 'Close' : 'Cancel'}
        </Button>
        {!readOnly ? (
          <Button
            type="button"
            onClick={handleSubmit}
            disabled={submitting}
            className="rounded-full"
          >
            {submitLabel}
          </Button>
        ) : null}
      </DialogFooter>
    </>
  )
}

export default function TaskCompleteDialog({
  task,
  open,
  onOpenChange,
  onCompleted,
  readOnly,
}: {
  task: EnrichedTask | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onCompleted: () => void
  readOnly?: boolean
}) {
  if (!task) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-md">
        {open ? (
          <TaskCompleteForm
            key={task.id}
            task={task}
            forceReadOnly={readOnly}
            onClose={() => onOpenChange(false)}
            onCompleted={onCompleted}
          />
        ) : null}
      </DialogContent>
    </Dialog>
  )
}
