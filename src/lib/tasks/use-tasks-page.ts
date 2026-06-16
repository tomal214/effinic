'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { getMinutesUntilLock } from '@/lib/session/minutes-until-lock'
import { runDeferredEffect } from '@/lib/react/defer-effect'
import {
  categoryLabel,
  countByCategory,
  filterTasksByCategory,
} from '@/lib/tasks/categories'
import type { TaskCategory } from '@/lib/tasks/categories'
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
  surgeriesData: SurgeriesPageData | null,
  setTasks: (tasks: EnrichedTask[]) => void,
  setTaskDate: (date: string) => void,
  setTimezone: (tz: string) => void,
  setSurgeries: (surgeries: Surgery[]) => void,
  setActiveSurgeryId: (id: string | null) => void
) {
  setTasks(tasksData.tasks ?? [])
  setTaskDate(tasksData.taskDate ?? '')
  if (tasksData.timezone) setTimezone(tasksData.timezone)

  if (!surgeriesData) return
  const active = (surgeriesData.surgeries ?? []).filter((s) => s.is_active !== false)
  setSurgeries(active)
  setActiveSurgeryId(surgeriesData.defaultSurgeryId ?? null)
}

export default function useTasksPage({
  initialData,
  showSurgerySwitcher,
}: {
  initialData?: { tasks: TasksPageData; surgeries: SurgeriesPageData }
  showSurgerySwitcher: boolean
}) {
  const router = useRouter()

  const [tasks, setTasks] = useState<EnrichedTask[]>(initialData?.tasks.tasks ?? [])
  const [taskDate, setTaskDate] = useState(initialData?.tasks.taskDate ?? '')
  const [timezone, setTimezone] = useState(initialData?.tasks.timezone ?? 'Europe/London')

  const [surgeries, setSurgeries] = useState<Surgery[]>(() => {
    if (!initialData || !showSurgerySwitcher) return []
    return (initialData.surgeries.surgeries ?? []).filter((s) => s.is_active !== false)
  })
  const [activeSurgeryId, setActiveSurgeryId] = useState<string | null>(
    showSurgerySwitcher ? (initialData?.surgeries.defaultSurgeryId ?? null) : null
  )

  const [selectedTask, setSelectedTask] = useState<EnrichedTask | null>(null)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [loading, setLoading] = useState(!initialData)
  const [signOffError, setSignOffError] = useState('')
  const [signingOff, setSigningOff] = useState(false)
  const [fetchError, setFetchError] = useState('')
  const [category, setCategory] = useState<TaskCategory>('all')

  const loadTasks = useCallback(async () => {
    setLoading(true)
    setFetchError('')

    try {
      const requests = [fetch('/api/tasks')]
      if (showSurgerySwitcher) requests.push(fetch('/api/surgeries'))

      const responses = await Promise.all(requests)
      if (responses.some((r) => !r.ok)) {
        setFetchError('Could not load tasks. Check your connection and try again.')
        return
      }

      const tasksBody = await responses[0].json()
      const surgeriesBody = showSurgerySwitcher ? await responses[1].json() : null

      applyTasksPageData(
        {
          tasks: tasksBody.data?.tasks ?? [],
          taskDate: tasksBody.data?.taskDate ?? '',
          timezone: tasksBody.data?.timezone ?? 'Europe/London',
        },
        showSurgerySwitcher
          ? {
              surgeries: surgeriesBody?.data?.surgeries ?? [],
              defaultSurgeryId: surgeriesBody?.data?.defaultSurgeryId ?? null,
            }
          : null,
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
  }, [showSurgerySwitcher])

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

  const categories = useMemo(() => {
    const counts = countByCategory(tasks)
    const total = tasks.length
    const rows = [{ key: 'all', label: 'All', count: total }]

    for (const [key, count] of counts.entries()) {
      if (!key) continue
      rows.push({
        key,
        label: categoryLabel(key),
        count,
      })
    }

    return rows.sort((a, b) => {
      if (a.key === 'all') return -1
      if (b.key === 'all') return 1
      return b.count - a.count
    })
  }, [tasks])

  const filteredTasks = useMemo(
    () => filterTasksByCategory(tasks, category),
    [tasks, category]
  )
  const pendingTasks = useMemo(
    () => filteredTasks.filter((t) => t.computedStatus !== 'completed'),
    [filteredTasks]
  )
  const completedTasks = useMemo(
    () => filteredTasks.filter((t) => t.computedStatus === 'completed'),
    [filteredTasks]
  )

  const completedCount = useMemo(
    () => tasks.filter((t) => t.computedStatus === 'completed').length,
    [tasks]
  )

  function handleSelectTask(task: EnrichedTask) {
    if (task.status === 'completed' && task.isLocked) return
    setSelectedTask(task)
    setDialogOpen(true)
  }

  async function handleMorningSignOff() {
    setSigningOff(true)
    setSignOffError('')

    try {
      const res = await fetch('/api/auth/nurse/sign-off/morning', { method: 'POST' })
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
      const res = await fetch('/api/auth/nurse/sign-off/end-day', { method: 'POST' })
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

  const showMorningSignOff = session === 'morning' || session === 'all_day'
  const showEndDay = session === 'afternoon' || session === 'all_day'

  return {
    tasks,
    taskDate,
    timezone,
    loading,
    fetchError,
    signOffError,
    signingOff,
    loadTasks,
    surgeries,
    activeSurgeryId,
    session,
    minutesUntilLock,
    category,
    setCategory,
    categories,
    filteredTasks,
    pendingTasks,
    completedTasks,
    completedCount,
    selectedTask,
    dialogOpen,
    setDialogOpen,
    handleSelectTask,
    handleMorningSignOff,
    handleEndDay,
    showMorningSignOff,
    showEndDay,
  }
}

