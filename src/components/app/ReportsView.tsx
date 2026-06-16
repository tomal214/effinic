'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Button } from '@/components/ui/button'
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import WeekChart, { type WeekChartPoint } from '@/components/app/WeekChart'
import FetchErrorPanel from '@/components/app/FetchErrorPanel'
import {
  buildExportRange,
  pickDefaultWeekStart,
} from '@/lib/reports/export-range'
import type { BreakdownRow } from '@/lib/reports/week-breakdown'
import { runDeferredEffect } from '@/lib/react/defer-effect'

type WeekBucket = {
  weekStart: string
  weekLabel: string
  completionRate: number
  incidentCount: number
  totalTasks: number
  completedTasks: number
}

type WeekSummary = {
  totalTasks: number
  completedTasks: number
  completionRate: number
  mandatoryIncomplete: number
  incidentCount: number
  tasksWithPhotos: number
}

type WeekReportDetail = {
  weekStart: string
  weekEnd: string
  summary: WeekSummary
  bySurgery: BreakdownRow[]
  byNurse: BreakdownRow[]
  byCategory: BreakdownRow[]
}

function StatCard({
  label,
  value,
  subtext,
  tone,
}: {
  label: string
  value: string | number
  subtext?: string
  tone?: 'warning' | 'danger'
}) {
  return (
    <div className="rounded-xl border border-border bg-surface p-4">
      <p className="text-sm text-muted-foreground">{label}</p>
      <p
        className={`mt-2 text-2xl font-semibold ${
          tone === 'danger'
            ? 'text-destructive'
            : tone === 'warning'
              ? 'text-warning'
              : 'text-foreground'
        }`}
      >
        {value}
      </p>
      {subtext ? (
        <p className="mt-1 text-xs text-muted-foreground">{subtext}</p>
      ) : null}
    </div>
  )
}

function BreakdownTable({ rows }: { rows: BreakdownRow[] }) {
  if (!rows.length) {
    return (
      <p className="py-8 text-center text-sm text-muted-foreground">
        No tasks in this period.
      </p>
    )
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Name</TableHead>
          <TableHead className="text-right">Completed</TableHead>
          <TableHead className="text-right">Total</TableHead>
          <TableHead className="text-right">Rate</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {rows.map((row) => (
          <TableRow key={row.key}>
            <TableCell className="font-medium">{row.label}</TableCell>
            <TableCell className="text-right tabular-nums">
              {row.completed}
            </TableCell>
            <TableCell className="text-right tabular-nums">{row.total}</TableCell>
            <TableCell className="text-right tabular-nums">
              {row.completionRate}%
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}

export default function ReportsView({
  readOnly,
  initialData,
}: {
  readOnly?: boolean
  initialData?: { weeks: WeekBucket[] }
}) {
  const [weeks, setWeeks] = useState<WeekBucket[]>(initialData?.weeks ?? [])
  const [weekCount, setWeekCount] = useState('8')
  const [selectedWeekStart, setSelectedWeekStart] = useState(() =>
    initialData?.weeks?.length
      ? pickDefaultWeekStart(initialData.weeks)
      : ''
  )
  const [weekDetail, setWeekDetail] = useState<WeekReportDetail | null>(null)
  const [loading, setLoading] = useState(!initialData)
  const [loadingDetail, setLoadingDetail] = useState(false)
  const skippedInitialLoad = useRef(!!initialData)
  const [exportingTasks, setExportingTasks] = useState(false)
  const [exportingIncidents, setExportingIncidents] = useState(false)
  const [fetchError, setFetchError] = useState('')
  const [detailError, setDetailError] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    setFetchError('')
    try {
      const res = await fetch(`/api/reports/weekly?weeks=${weekCount}`)
      if (!res.ok) {
        setFetchError('Could not load reports. Check your connection and try again.')
        return
      }
      const { data } = await res.json()
      const rows = data.weeks ?? []
      setWeeks(rows)
      setSelectedWeekStart((prev) => {
        if (prev && rows.some((w: WeekBucket) => w.weekStart === prev)) {
          return prev
        }
        return pickDefaultWeekStart(rows)
      })
    } catch (error) {
      console.error('Failed to load reports:', error)
      setFetchError('Could not load reports. Check your connection and try again.')
    } finally {
      setLoading(false)
    }
  }, [weekCount])

  const loadWeekDetail = useCallback(async (weekStart: string) => {
    if (!weekStart) return
    setLoadingDetail(true)
    setDetailError('')
    try {
      const res = await fetch(
        `/api/reports/week?weekStart=${encodeURIComponent(weekStart)}`
      )
      if (!res.ok) {
        setDetailError('Could not load week details.')
        setWeekDetail(null)
        return
      }
      const { data } = await res.json()
      setWeekDetail(data)
    } catch (error) {
      console.error('Failed to load week detail:', error)
      setDetailError('Could not load week details.')
      setWeekDetail(null)
    } finally {
      setLoadingDetail(false)
    }
  }, [])

  useEffect(() => {
    if (skippedInitialLoad.current) {
      skippedInitialLoad.current = false
      return
    }
    runDeferredEffect(() => load())
  }, [load])

  useEffect(() => {
    if (!selectedWeekStart) return
    runDeferredEffect(() => loadWeekDetail(selectedWeekStart))
  }, [selectedWeekStart, loadWeekDetail])

  const chartData: WeekChartPoint[] = useMemo(
    () =>
      weeks.map((w) => ({
        weekLabel: w.weekLabel,
        completionRate: w.completionRate,
        incidentCount: w.incidentCount,
      })),
    [weeks]
  )

  const exportRange = useMemo(
    () => buildExportRange(weeks, selectedWeekStart),
    [weeks, selectedWeekStart]
  )

  async function downloadExport(path: string, filename: string) {
    const res = await fetch(path)
    if (!res.ok) return false
    const blob = await res.blob()
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = filename
    link.click()
    URL.revokeObjectURL(url)
    return true
  }

  const handleExportTasks = async () => {
    if (!exportRange) return
    setExportingTasks(true)
    try {
      const params = new URLSearchParams({
        from: exportRange.from,
        to: exportRange.to,
      })
      await downloadExport(
        `/api/reports/export?${params}`,
        `effinic-tasks-${exportRange.from}.csv`
      )
    } finally {
      setExportingTasks(false)
    }
  }

  const handleExportIncidents = async () => {
    if (!exportRange) return
    setExportingIncidents(true)
    try {
      const params = new URLSearchParams({
        from: exportRange.from,
        to: exportRange.to,
      })
      await downloadExport(
        `/api/reports/export/incidents?${params}`,
        `effinic-incidents-${exportRange.from}.csv`
      )
    } finally {
      setExportingIncidents(false)
    }
  }

  const defaultWeekStart = pickDefaultWeekStart(weeks)
  const summary = weekDetail?.summary

  return (
    <div className="flex flex-1 flex-col gap-6 p-6 md:p-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Reports</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Completion and incidents by week
            {readOnly && (
              <span className="ml-2 rounded-full bg-muted px-2 py-0.5 text-xs">
                Read-only
              </span>
            )}
          </p>
        </div>
        <Select value={weekCount} onValueChange={(v) => v && setWeekCount(v)}>
          <SelectTrigger className="w-36">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="4">Last 4 weeks</SelectItem>
            <SelectItem value="8">Last 8 weeks</SelectItem>
            <SelectItem value="12">Last 12 weeks</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {fetchError ? (
        <FetchErrorPanel message={fetchError} onRetry={load} />
      ) : null}

      <div className="rounded-xl border border-border bg-background p-5">
        {loading ? (
          <div className="h-80 animate-pulse rounded-lg bg-muted" />
        ) : (
          <WeekChart data={chartData} />
        )}
      </div>

      <div className="space-y-4 rounded-xl border border-border bg-background p-5">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium">Selected week</label>
            <Select
              value={selectedWeekStart || defaultWeekStart}
              onValueChange={(v) => v && setSelectedWeekStart(v)}
              disabled={weeks.length === 0}
            >
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Select week" />
              </SelectTrigger>
              <SelectContent>
                {weeks.map((week) => (
                  <SelectItem key={week.weekStart} value={week.weekStart}>
                    Week of {week.weekLabel}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              onClick={handleExportTasks}
              disabled={exportingTasks || !exportRange || weeks.length === 0}
            >
              {exportingTasks ? 'Exporting…' : 'Export tasks CSV'}
            </Button>
            <Button
              variant="outline"
              onClick={handleExportIncidents}
              disabled={
                exportingIncidents || !exportRange || weeks.length === 0
              }
            >
              {exportingIncidents ? 'Exporting…' : 'Export incidents CSV'}
            </Button>
          </div>
        </div>

        {detailError ? (
          <FetchErrorPanel
            message={detailError}
            onRetry={() => loadWeekDetail(selectedWeekStart)}
          />
        ) : null}

        {loadingDetail ? (
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
            {Array.from({ length: 5 }).map((_, index) => (
              <div
                key={index}
                className="h-24 animate-pulse rounded-xl bg-muted"
              />
            ))}
          </div>
        ) : summary ? (
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
            <StatCard
              label="Completion"
              value={`${summary.completionRate}%`}
            />
            <StatCard
              label="Tasks done"
              value={`${summary.completedTasks}/${summary.totalTasks}`}
            />
            <StatCard
              label="Mandatory missed"
              value={summary.mandatoryIncomplete}
              tone={summary.mandatoryIncomplete > 0 ? 'warning' : undefined}
            />
            <StatCard
              label="Incidents"
              value={summary.incidentCount}
              tone={summary.incidentCount > 0 ? 'warning' : undefined}
            />
            <StatCard
              label="With photos"
              value={summary.tasksWithPhotos}
              subtext="Evidence attached"
            />
          </div>
        ) : null}

        {!loadingDetail && weekDetail ? (
          <Tabs defaultValue="surgery">
            <TabsList className="w-full justify-start overflow-x-auto">
              <TabsTrigger value="surgery">By surgery</TabsTrigger>
              <TabsTrigger value="nurse">By nurse</TabsTrigger>
              <TabsTrigger value="category">By category</TabsTrigger>
            </TabsList>
            <TabsContent value="surgery" className="mt-4">
              <BreakdownTable rows={weekDetail.bySurgery} />
            </TabsContent>
            <TabsContent value="nurse" className="mt-4">
              <BreakdownTable rows={weekDetail.byNurse} />
            </TabsContent>
            <TabsContent value="category" className="mt-4">
              <BreakdownTable rows={weekDetail.byCategory} />
            </TabsContent>
          </Tabs>
        ) : null}
      </div>
    </div>
  )
}
