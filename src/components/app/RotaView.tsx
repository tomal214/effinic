'use client'

import { useCallback, useEffect, useState } from 'react'
import { addWeeks, format, parseISO, startOfWeek, subWeeks } from 'date-fns'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { cn } from '@/lib/utils'
import { runDeferredEffect } from '@/lib/react/defer-effect'

type Surgery = { id: string; name: string }
type Staff = { userId: string; fullName: string; role: string }
type Assignment = {
  id: string
  userId: string
  userName: string
  surgeryId: string
  shiftDate: string
  shiftType: string
  isPublished: boolean
}

function mondayOf(date: Date) {
  return startOfWeek(date, { weekStartsOn: 1 })
}

export default function RotaView() {
  const [weekStart, setWeekStart] = useState(() =>
    format(mondayOf(new Date()), 'yyyy-MM-dd')
  )
  const [dates, setDates] = useState<string[]>([])
  const [surgeries, setSurgeries] = useState<Surgery[]>([])
  const [assignments, setAssignments] = useState<Assignment[]>([])
  const [staff, setStaff] = useState<Staff[]>([])
  const [canEdit, setCanEdit] = useState(false)
  const [allPublished, setAllPublished] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [fetchError, setFetchError] = useState<string | null>(null)
  const [publishing, setPublishing] = useState(false)
  const [selectedCell, setSelectedCell] = useState<{
    surgeryId: string
    shiftDate: string
  } | null>(null)
  const [assigning, setAssigning] = useState(false)

  const loadRota = useCallback(async () => {
    setLoading(true)
    setFetchError(null)
    try {
      const res = await fetch(`/api/rota?weekStart=${weekStart}`)
      const json = await res.json()
      if (!res.ok) {
        setFetchError(json.error ?? 'Failed to load rota')
        return
      }
      const data = json.data
      setDates(data.dates)
      setSurgeries(data.surgeries)
      setAssignments(data.assignments)
      setStaff(data.staff)
      setCanEdit(data.canEdit)
      setAllPublished(data.allPublished)
    } catch {
      setFetchError('Failed to load rota')
    } finally {
      setLoading(false)
    }
  }, [weekStart])

  useEffect(() => {
    runDeferredEffect(() => loadRota())
  }, [loadRota])

  function shiftWeek(delta: number) {
    const next = delta > 0
      ? addWeeks(parseISO(weekStart), 1)
      : subWeeks(parseISO(weekStart), 1)
    setWeekStart(format(mondayOf(next), 'yyyy-MM-dd'))
  }

  function cellAssignments(surgeryId: string, shiftDate: string) {
    return assignments.filter(
      (a) => a.surgeryId === surgeryId && a.shiftDate === shiftDate
    )
  }

  async function assignStaff(userId: string) {
    if (!selectedCell) return
    setAssigning(true)
    setError(null)
    try {
      const res = await fetch('/api/rota/assign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          surgeryId: selectedCell.surgeryId,
          shiftDate: selectedCell.shiftDate,
          shiftType: 'full_day',
        }),
      })
      const json = await res.json()
      if (!res.ok) {
        setError(json.error ?? 'Failed to assign staff')
        return
      }
      setSelectedCell(null)
      await loadRota()
    } catch {
      setError('Failed to assign staff')
    } finally {
      setAssigning(false)
    }
  }

  async function removeAssignment(id: string) {
    setError(null)
    try {
      const res = await fetch(`/api/rota/assign/${id}`, { method: 'DELETE' })
      const json = await res.json()
      if (!res.ok) {
        setError(json.error ?? 'Failed to remove assignment')
        return
      }
      await loadRota()
    } catch {
      setError('Failed to remove assignment')
    }
  }

  async function publishWeek() {
    setPublishing(true)
    setError(null)
    try {
      const res = await fetch('/api/rota/publish', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ weekStart }),
      })
      const json = await res.json()
      if (!res.ok) {
        setError(json.error ?? 'Failed to publish rota')
        return
      }
      await loadRota()
    } catch {
      setError('Failed to publish rota')
    } finally {
      setPublishing(false)
    }
  }

  const weekLabel =
    dates.length >= 2
      ? `${format(parseISO(dates[0]), 'd MMM')} – ${format(parseISO(dates[6]), 'd MMM yyyy')}`
      : ''

  return (
    <div className="flex flex-1 flex-col gap-4 p-5">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold">Weekly rota</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Click a cell to assign staff. Publish when ready for nurses.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button type="button" variant="outline" size="icon" onClick={() => shiftWeek(-1)}>
            <ChevronLeft className="size-4" />
          </Button>
          <span className="min-w-[140px] text-center text-sm font-medium">{weekLabel}</span>
          <Button type="button" variant="outline" size="icon" onClick={() => shiftWeek(1)}>
            <ChevronRight className="size-4" />
          </Button>
          {canEdit && (
            <Button
              type="button"
              onClick={publishWeek}
              disabled={publishing || allPublished}
            >
              {allPublished ? 'Published' : publishing ? 'Publishing…' : 'Publish week'}
            </Button>
          )}
        </div>
      </div>

      {fetchError ? (
        <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3">
          <p className="text-sm text-destructive">{fetchError}</p>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="mt-3"
            onClick={loadRota}
          >
            Try again
          </Button>
        </div>
      ) : null}

      {error && (
        <p className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-2 text-sm text-destructive">
          {error}
        </p>
      )}

      {loading ? (
        <p className="text-sm text-muted-foreground">Loading rota…</p>
      ) : (
        <div className="overflow-x-auto rounded-xl border">
          <table className="w-full min-w-[720px] border-collapse text-sm">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="p-3 text-left font-medium">Surgery</th>
                {dates.map((date) => (
                  <th key={date} className="p-3 text-left font-medium">
                    <div>{format(parseISO(date), 'EEE')}</div>
                    <div className="text-xs font-normal text-muted-foreground">
                      {format(parseISO(date), 'd MMM')}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {surgeries.map((surgery) => (
                <tr key={surgery.id} className="border-b last:border-b-0">
                  <td className="p-3 align-top font-medium">{surgery.name}</td>
                  {dates.map((date) => {
                    const cell = cellAssignments(surgery.id, date)
                    return (
                      <td key={date} className="p-2 align-top">
                        <div
                          role={canEdit ? 'button' : undefined}
                          tabIndex={canEdit ? 0 : undefined}
                          onClick={() =>
                            canEdit &&
                            setSelectedCell({ surgeryId: surgery.id, shiftDate: date })
                          }
                          onKeyDown={(e) => {
                            if (canEdit && (e.key === 'Enter' || e.key === ' ')) {
                              e.preventDefault()
                              setSelectedCell({ surgeryId: surgery.id, shiftDate: date })
                            }
                          }}
                          className={cn(
                            'flex min-h-[72px] w-full flex-col gap-1 rounded-lg border border-dashed p-2 text-left transition-colors',
                            canEdit && 'cursor-pointer hover:border-primary hover:bg-muted/50',
                            !canEdit && 'cursor-default'
                          )}
                        >
                          {cell.length === 0 ? (
                            <span className="text-xs text-muted-foreground">
                              {canEdit ? 'Assign' : '—'}
                            </span>
                          ) : (
                            cell.map((a) => (
                              <div
                                key={a.id}
                                className="flex items-center justify-between gap-1"
                              >
                                <span className="truncate text-xs font-medium">
                                  {a.userName}
                                </span>
                                <div className="flex shrink-0 items-center gap-1">
                                  {!a.isPublished && (
                                    <Badge variant="outline" className="text-[10px]">
                                      draft
                                    </Badge>
                                  )}
                                  {canEdit && (
                                    <button
                                      type="button"
                                      className="text-muted-foreground hover:text-destructive"
                                      onClick={(e) => {
                                        e.stopPropagation()
                                        removeAssignment(a.id)
                                      }}
                                    >
                                      ×
                                    </button>
                                  )}
                                </div>
                              </div>
                            ))
                          )}
                        </div>
                      </td>
                    )
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Dialog open={!!selectedCell} onOpenChange={(open) => !open && setSelectedCell(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Assign staff</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-2">
            {staff.length === 0 ? (
              <p className="text-sm text-muted-foreground">No staff available.</p>
            ) : (
              staff.map((member) => (
                <Button
                  key={member.userId}
                  type="button"
                  variant="outline"
                  className="justify-start"
                  disabled={assigning}
                  onClick={() => assignStaff(member.userId)}
                >
                  {member.fullName}
                  <span className="ml-2 text-xs text-muted-foreground">
                    {member.role}
                  </span>
                </Button>
              ))
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
