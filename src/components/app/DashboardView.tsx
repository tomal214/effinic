'use client'

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { AlertTriangle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import type {
  DashboardData,
  NurseBreakdown,
  SessionWarning,
  SurgeryBreakdown,
} from '@/lib/services/dashboard'
import { runDeferredEffect } from '@/lib/react/defer-effect'

function StatCard({
  label,
  value,
  tone,
}: {
  label: string
  value: number
  tone?: 'warning' | 'danger'
}) {
  return (
    <div className="rounded-xl border border-border bg-background p-5">
      <p className="text-sm text-muted-foreground">{label}</p>
      <p
        className={`mt-2 text-3xl font-semibold ${
          tone === 'danger'
            ? 'text-destructive'
            : tone === 'warning'
              ? 'text-warning'
              : 'text-foreground'
        }`}
      >
        {value}
      </p>
    </div>
  )
}

function SessionWarnings({ warnings }: { warnings: SessionWarning[] }) {
  if (!warnings.length) return null

  return (
    <div className="flex flex-col gap-3">
      {warnings.map((warning) => (
        <div
          key={warning.session}
          className="flex items-start gap-3 rounded-lg border border-warning/40 bg-warning/10 px-4 py-3 text-sm"
        >
          <AlertTriangle className="mt-0.5 size-4 shrink-0 text-warning" />
          <div>
            <p className="font-medium capitalize">{warning.session} session</p>
            <p className="text-muted-foreground">
              Locks at {warning.lockTime}.{' '}
              {warning.minutesUntilLock <= 0
                ? 'Session is locked.'
                : `${Math.ceil(warning.minutesUntilLock)} minutes remaining.`}{' '}
              {warning.incompleteMandatoryCount > 0 &&
                `${warning.incompleteMandatoryCount} mandatory task${
                  warning.incompleteMandatoryCount === 1 ? '' : 's'
                } still open.`}
            </p>
          </div>
        </div>
      ))}
    </div>
  )
}

function BreakdownTable({
  title,
  rows,
  nameHeader,
}: {
  title: string
  rows: (SurgeryBreakdown | NurseBreakdown)[]
  nameHeader: string
}) {
  return (
    <div className="rounded-xl border border-border bg-background">
      <div className="border-b border-border px-5 py-4">
        <h2 className="font-semibold">{title}</h2>
      </div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>{nameHeader}</TableHead>
            <TableHead className="text-right">Total</TableHead>
            <TableHead className="text-right">Done</TableHead>
            <TableHead className="text-right">Open</TableHead>
            <TableHead className="text-right">Overdue</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.length === 0 ? (
            <TableRow>
              <TableCell colSpan={5} className="text-muted-foreground">
                No tasks today.
              </TableCell>
            </TableRow>
          ) : (
            rows.map((row) => {
              const name =
                'surgeryName' in row ? row.surgeryName : row.name
              const key =
                'surgeryId' in row
                  ? (row.surgeryId ?? 'none')
                  : (row.userId ?? 'unassigned')

              return (
                <TableRow key={key}>
                  <TableCell className="font-medium">{name}</TableCell>
                  <TableCell className="text-right">{row.total}</TableCell>
                  <TableCell className="text-right">{row.completed}</TableCell>
                  <TableCell className="text-right">
                    {row.incomplete > 0 ? (
                      <Badge variant="secondary">{row.incomplete}</Badge>
                    ) : (
                      0
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    {row.overdue > 0 ? (
                      <Badge variant="destructive">{row.overdue}</Badge>
                    ) : (
                      0
                    )}
                  </TableCell>
                </TableRow>
              )
            })
          )}
        </TableBody>
      </Table>
    </div>
  )
}

export default function DashboardView({ readOnly }: { readOnly?: boolean }) {
  const [dashboard, setDashboard] = useState<DashboardData | null>(null)
  const [taskDate, setTaskDate] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/dashboard')
      if (!res.ok) {
        setError('Failed to load dashboard')
        return
      }
      const { data } = await res.json()
      setDashboard(data.dashboard)
      setTaskDate(data.dashboard?.taskDate ?? '')
    } catch {
      setError('Failed to load dashboard')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    runDeferredEffect(() => load())
  }, [load])

  if (loading) {
    return (
      <div className="flex flex-1 flex-col gap-4 p-6 md:p-8">
        <div className="h-8 w-48 animate-pulse rounded bg-muted" />
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="h-28 animate-pulse rounded-xl bg-muted" />
          <div className="h-28 animate-pulse rounded-xl bg-muted" />
        </div>
      </div>
    )
  }

  if (error || !dashboard) {
    return (
      <div className="flex flex-1 flex-col gap-3 p-8">
        <p className="text-sm text-destructive">
          {error || 'Dashboard unavailable'}
        </p>
        <Button type="button" variant="outline" size="sm" className="w-fit" onClick={load}>
          Try again
        </Button>
      </div>
    )
  }

  return (
    <div className="flex flex-1 flex-col gap-6 p-6 md:p-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Dashboard</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Today&apos;s tasks · {taskDate}
            {readOnly && (
              <span className="ml-2 rounded-full bg-muted px-2 py-0.5 text-xs">
                Read-only
              </span>
            )}
          </p>
        </div>
        <Link
          href="/app/reports"
          className="text-sm font-medium text-primary hover:underline"
        >
          View reports →
        </Link>
      </div>

      <SessionWarnings warnings={dashboard.sessionWarnings} />

      <div className="grid gap-4 sm:grid-cols-2">
        <StatCard label="Incomplete today" value={dashboard.incompleteCount} />
        <StatCard
          label="Overdue today"
          value={dashboard.overdueCount}
          tone={dashboard.overdueCount > 0 ? 'danger' : undefined}
        />
      </div>

      <BreakdownTable
        title="By surgery"
        nameHeader="Surgery"
        rows={dashboard.bySurgery}
      />

      <BreakdownTable
        title="By nurse"
        nameHeader="Nurse"
        rows={dashboard.byNurse}
      />
    </div>
  )
}
