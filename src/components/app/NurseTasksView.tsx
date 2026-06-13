'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import TaskRow from '@/components/app/TaskRow'
import TaskCompleteDialog from '@/components/app/TaskCompleteDialog'
import SessionBanner from '@/components/app/SessionBanner'
import SurgerySwitcher from '@/components/app/SurgerySwitcher'
import FetchErrorPanel from '@/components/app/FetchErrorPanel'
import { getMinutesUntilLock } from '@/lib/session/minutes-until-lock'
import { runDeferredEffect } from '@/lib/react/defer-effect'
import type { EnrichedTask } from '@/lib/services/tasks'

type Surgery = { id: string; name: string }

type TasksPageData = {
  tasks: EnrichedTask[]
  taskDate: string
  timezone: string
}

type SurgeriesPageData = {
  surgeries: (Surgery & { is_active?: boolean })[]
  defaultSurgeryId: string | null
}

function applyTasksPageData(
  tasksData: TasksPageData,
  surgeriesData: SurgeriesPageData,
  setTasks: (tasks: EnrichedTask[]) => void,
  setTaskDate: (date: string) => void,
  setTimezone: (tz: string) => void,
  setSurgeries: (surgeries: Surgery[]) => void,
  setActiveSurgeryId?: (id: string | null) => void
) {
  setTasks(tasksData.tasks ?? [])
  setTaskDate(tasksData.taskDate ?? '')
  if (tasksData.timezone) setTimezone(tasksData.timezone)

  const active = (surgeriesData.surgeries ?? []).filter(
    (s) => s.is_active !== false
  )
  setSurgeries(active)
  if (setActiveSurgeryId) {
    setActiveSurgeryId(surgeriesData.defaultSurgeryId ?? null)
  }
}

export default function NurseTasksView({
  initialData,
}: {
  initialData?: { tasks: TasksPageData; surgeries: SurgeriesPageData }
}) {
  const router = useRouter()
  const [tasks, setTasks] = useState<EnrichedTask[]>(
    initialData?.tasks.tasks ?? []
  )
  const [taskDate, setTaskDate] = useState(initialData?.tasks.taskDate ?? '')
  const [timezone, setTimezone] = useState(
    initialData?.tasks.timezone ?? 'Europe/London'
  )
  const [surgeries, setSurgeries] = useState<Surgery[]>(() => {
    if (!initialData) return []
    return (initialData.surgeries.surgeries ?? []).filter(
      (s) => s.is_active !== false
    )
  })
  const [activeSurgeryId, setActiveSurgeryId] = useState<string | null>(
    initialData?.surgeries.defaultSurgeryId ?? null
  )
  const [selectedTask, setSelectedTask] = useState<EnrichedTask | null>(null)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [loading, setLoading] = useState(!initialData)
  const [signOffError, setSignOffError] = useState('')
  const [signingOff, setSigningOff] = useState(false)
  const [fetchError, setFetchError] = useState('')

  const loadTasks = useCallback(async () => {
    setLoading(true)
    setFetchError('')
    try {
      const [tasksRes, surgeriesRes] = await Promise.all([
        fetch('/api/tasks'),
        fetch('/api/surgeries'),
      ])

      if (!tasksRes.ok || !surgeriesRes.ok) {
        setFetchError('Could not load tasks. Check your connection and try again.')
        return
      }

      const tasksBody = await tasksRes.json()
      const surgeriesBody = await surgeriesRes.json()
      applyTasksPageData(
        {
          tasks: tasksBody.data?.tasks ?? [],
          taskDate: tasksBody.data?.taskDate ?? '',
          timezone: tasksBody.data?.timezone ?? 'Europe/London',
        },
        {
          surgeries: surgeriesBody.data?.surgeries ?? [],
          defaultSurgeryId: surgeriesBody.data?.defaultSurgeryId ?? null,
        },
        setTasks,
        setTaskDate,
        setTimezone,
        setSurgeries,
        setActiveSurgeryId
      )
    } catch (error) {
      console.error('Failed to load tasks:', error)
      setFetchError('Could not load tasks. Check your connection and try again.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (initialData) return
    runDeferredEffect(() => loadTasks())
  }, [loadTasks, initialData])

  const session = useMemo(() => {
    const morningTasks = tasks.filter((t) => t.session === 'morning')
    const afternoonTasks = tasks.filter((t) => t.session === 'afternoon')

    if (morningTasks.some((t) => t.computedStatus !== 'completed')) {
      return 'morning' as const
    }
    if (afternoonTasks.length > 0) return 'afternoon' as const
    return 'all_day' as const
  }, [tasks])

  const minutesUntilLock = getMinutesUntilLock(session, taskDate, timezone)

  const pendingTasks = tasks.filter((t) => t.computedStatus !== 'completed')
  const showMorningSignOff = session === 'morning' || session === 'all_day'
  const showEndDay = session === 'afternoon' || session === 'all_day'

  function handleSelectTask(task: EnrichedTask) {
    if (task.status === 'completed' && task.isLocked) return

    setSelectedTask(task)
    setDialogOpen(true)
  }

  async function handleMorningSignOff() {
    setSigningOff(true)
    setSignOffError('')

    try {
      const res = await fetch('/api/auth/nurse/sign-off/morning', {
        method: 'POST',
      })
      const body = await res.json()

      if (!res.ok) {
        setSignOffError(body.error ?? 'Sign-off failed')
        return
      }

      await loadTasks()
    } catch (error) {
      console.error('Morning sign-off failed:', error)
      setSignOffError('Something went wrong')
    } finally {
      setSigningOff(false)
    }
  }

  async function handleEndDay() {
    setSigningOff(true)
    setSignOffError('')

    try {
      const res = await fetch('/api/auth/nurse/sign-off/end-day', {
        method: 'POST',
      })
      const body = await res.json()

      if (!res.ok) {
        setSignOffError(body.error ?? 'Sign-off failed')
        return
      }

      if (body.data?.practiceUrl) {
        router.push(body.data.practiceUrl)
      }
    } catch (error) {
      console.error('End day sign-off failed:', error)
      setSignOffError('Something went wrong')
    } finally {
      setSigningOff(false)
    }
  }

  return (
    <div className="flex flex-1 flex-col px-5 pb-8 pt-5 md:px-8">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold">Today&apos;s tasks</h1>
          <p className="text-sm text-muted-foreground">
            {pendingTasks.length} remaining
          </p>
        </div>
        <SurgerySwitcher
          surgeries={surgeries}
          activeSurgeryId={activeSurgeryId}
          onSwitch={() => loadTasks()}
        />
      </div>

      <div className="mb-4 space-y-3">
        <SessionBanner
          session={session}
          minutesUntilLock={minutesUntilLock}
        />
        {signOffError && (
          <p className="rounded-lg border border-danger/30 bg-danger/10 px-4 py-3 text-sm text-danger">
            {signOffError}
          </p>
        )}
        {fetchError ? (
          <FetchErrorPanel message={fetchError} onRetry={loadTasks} />
        ) : null}
      </div>

      <div className="flex-1">
        {loading ? (
          <div className="space-y-3 py-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-16 animate-pulse rounded-lg bg-muted" />
            ))}
          </div>
        ) : tasks.length === 0 ? (
          <p className="py-12 text-center text-muted-foreground">
            No tasks for today.
          </p>
        ) : (
          <div className="divide-y divide-border rounded-lg border border-border bg-surface">
            {tasks.map((task) => (
              <TaskRow
                key={task.id}
                task={task}
                onSelect={handleSelectTask}
              />
            ))}
          </div>
        )}
      </div>

      <div className="sticky bottom-[var(--app-mobile-nav-offset)] z-30 mt-6 flex flex-col gap-2 border-t border-border bg-canvas pt-4 pb-4 md:bottom-0 md:pb-[max(1rem,env(safe-area-inset-bottom))]">
        {showMorningSignOff && (
          <Button
            type="button"
            variant="outline"
            className="h-12 rounded-full"
            onClick={handleMorningSignOff}
            disabled={signingOff}
          >
            End morning session
          </Button>
        )}
        {showEndDay && (
          <Button
            type="button"
            className="h-12 rounded-full"
            onClick={handleEndDay}
            disabled={signingOff}
          >
            End day / Sign off
          </Button>
        )}
      </div>

      <TaskCompleteDialog
        task={selectedTask}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onCompleted={loadTasks}
      />
    </div>
  )
}
