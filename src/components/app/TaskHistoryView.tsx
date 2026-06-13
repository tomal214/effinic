'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { format, subDays } from 'date-fns'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import FetchErrorPanel from '@/components/app/FetchErrorPanel'
import { runDeferredEffect } from '@/lib/react/defer-effect'

type HistoryRow = {
  id: string
  taskDate: string
  title: string
  role: string
  surgery: string
  status: string
  completedBy: string
  notes: string | null
}

type Surgery = { id: string; name: string }

export default function TaskHistoryView({
  readOnly,
  initialData,
}: {
  readOnly?: boolean
  initialData?: {
    history: HistoryRow[]
    surgeries: Surgery[]
    from: string
    to: string
    surgeryId: string
  }
}) {
  const today = format(new Date(), 'yyyy-MM-dd')
  const [from, setFrom] = useState(initialData?.from ?? format(subDays(new Date(), 7), 'yyyy-MM-dd'))
  const [to, setTo] = useState(initialData?.to ?? today)
  const [surgeryId, setSurgeryId] = useState(initialData?.surgeryId ?? 'all')
  const [history, setHistory] = useState<HistoryRow[]>(initialData?.history ?? [])
  const [surgeries, setSurgeries] = useState<Surgery[]>(initialData?.surgeries ?? [])
  const [loading, setLoading] = useState(!initialData)
  const skippedInitialHistoryLoad = useRef(!!initialData)
  const skippedInitialSurgeriesLoad = useRef(!!initialData)
  const [exporting, setExporting] = useState(false)
  const [fetchError, setFetchError] = useState('')

  const loadSurgeries = useCallback(async () => {
    try {
      const res = await fetch('/api/surgeries')
      if (res.ok) {
        const { data } = await res.json()
        setSurgeries(data.surgeries ?? [])
      }
    } catch (error) {
      console.error('Failed to load surgeries:', error)
    }
  }, [])

  const loadHistory = useCallback(async () => {
    setLoading(true)
    setFetchError('')
    try {
      const params = new URLSearchParams({ from, to })
      if (surgeryId !== 'all') params.set('surgeryId', surgeryId)
      const res = await fetch(`/api/tasks/history?${params}`)
      if (!res.ok) {
        setFetchError('Could not load task history. Check your connection and try again.')
        return
      }
      const { data } = await res.json()
      setHistory(data.history ?? [])
    } catch (error) {
      console.error('Failed to load history:', error)
      setFetchError('Could not load task history. Check your connection and try again.')
    } finally {
      setLoading(false)
    }
  }, [from, to, surgeryId])

  useEffect(() => {
    if (skippedInitialSurgeriesLoad.current) {
      skippedInitialSurgeriesLoad.current = false
      return
    }
    runDeferredEffect(() => loadSurgeries())
  }, [loadSurgeries])

  useEffect(() => {
    if (skippedInitialHistoryLoad.current) {
      skippedInitialHistoryLoad.current = false
      return
    }
    runDeferredEffect(() => loadHistory())
  }, [loadHistory])

  const handleExport = async () => {
    setExporting(true)
    try {
      const params = new URLSearchParams({ from, to })
      if (surgeryId !== 'all') params.set('surgeryId', surgeryId)
      const res = await fetch(`/api/tasks/history/export?${params}`)
      if (!res.ok) return
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `task-history-${from}-${to}.csv`
      link.click()
      URL.revokeObjectURL(url)
    } finally {
      setExporting(false)
    }
  }

  return (
    <div className="flex flex-1 flex-col gap-6 p-6 md:p-8">
      <div>
        <h1 className="text-2xl font-semibold">Task history</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Audit log of completed and missed tasks
          {readOnly && (
            <span className="ml-2 rounded-full bg-muted px-2 py-0.5 text-xs">
              Read-only
            </span>
          )}
        </p>
      </div>

      {fetchError ? (
        <FetchErrorPanel message={fetchError} onRetry={loadHistory} />
      ) : null}

      <div className="flex flex-wrap items-end gap-4 rounded-xl border border-border bg-background p-5">
        <div className="flex flex-col gap-2">
          <Label htmlFor="from">From</Label>
          <Input
            id="from"
            type="date"
            value={from}
            onChange={(e) => setFrom(e.target.value)}
            className="w-40"
          />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="to">To</Label>
          <Input
            id="to"
            type="date"
            value={to}
            onChange={(e) => setTo(e.target.value)}
            className="w-40"
          />
        </div>
        <div className="flex flex-col gap-2">
          <Label>Surgery</Label>
          <Select value={surgeryId} onValueChange={(v) => v && setSurgeryId(v)}>
            <SelectTrigger className="w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All surgeries</SelectItem>
              {surgeries.map((surgery) => (
                <SelectItem key={surgery.id} value={surgery.id}>
                  {surgery.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <Button variant="outline" onClick={loadHistory}>
          Apply
        </Button>
        <Button onClick={handleExport} disabled={exporting}>
          {exporting ? 'Exporting…' : 'Export CSV'}
        </Button>
      </div>

      <div className="rounded-xl border border-border bg-background">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Task</TableHead>
              <TableHead>Surgery</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Completed by</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={5} className="text-muted-foreground">
                  Loading…
                </TableCell>
              </TableRow>
            ) : history.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-muted-foreground">
                  No tasks in this range.
                </TableCell>
              </TableRow>
            ) : (
              history.map((row) => (
                <TableRow key={row.id}>
                  <TableCell>{row.taskDate}</TableCell>
                  <TableCell className="font-medium">{row.title}</TableCell>
                  <TableCell>{row.surgery || '—'}</TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        row.status === 'completed' ? 'secondary' : 'outline'
                      }
                    >
                      {row.status}
                    </Badge>
                  </TableCell>
                  <TableCell>{row.completedBy || '—'}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
