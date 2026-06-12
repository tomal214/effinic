'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import WeekChart, { type WeekChartPoint } from '@/components/app/WeekChart'
import FetchErrorPanel from '@/components/app/FetchErrorPanel'
import {
  buildExportRange,
  pickDefaultWeekStart,
} from '@/lib/reports/export-range'
import { runDeferredEffect } from '@/lib/react/defer-effect'

type WeekBucket = {
  weekStart: string
  weekLabel: string
  completionRate: number
  incidentCount: number
}

export default function ReportsView({ readOnly }: { readOnly?: boolean }) {
  const [weeks, setWeeks] = useState<WeekBucket[]>([])
  const [weekCount, setWeekCount] = useState('8')
  const [selectedWeekStart, setSelectedWeekStart] = useState('')
  const [loading, setLoading] = useState(true)
  const [exporting, setExporting] = useState(false)
  const [fetchError, setFetchError] = useState('')

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

  useEffect(() => {
    runDeferredEffect(() => load())
  }, [load])

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

  const handleExport = async () => {
    if (!exportRange) return
    setExporting(true)
    try {
      const params = new URLSearchParams({
        from: exportRange.from,
        to: exportRange.to,
      })
      const res = await fetch(`/api/reports/export?${params}`)
      if (!res.ok) return
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `effinic-report-${exportRange.from}.csv`
      link.click()
      URL.revokeObjectURL(url)
    } finally {
      setExporting(false)
    }
  }

  const defaultWeekStart = pickDefaultWeekStart(weeks)

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
        <div className="flex flex-wrap items-center gap-3">
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

      <div className="flex flex-wrap items-end gap-4 rounded-xl border border-border bg-background p-5">
        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium">Export week</label>
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
        <Button
          onClick={handleExport}
          disabled={exporting || !exportRange || weeks.length === 0}
        >
          {exporting ? 'Exporting…' : 'Export CSV'}
        </Button>
      </div>
    </div>
  )
}
