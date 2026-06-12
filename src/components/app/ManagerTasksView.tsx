'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import TaskRow from '@/components/app/TaskRow'
import TaskCompleteDialog from '@/components/app/TaskCompleteDialog'
import SessionBanner from '@/components/app/SessionBanner'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { getMinutesUntilLock } from '@/lib/session/minutes-until-lock'
import type { EnrichedTask } from '@/lib/services/tasks'

type Surgery = { id: string; name: string }

export default function ManagerTasksView({ readOnly }: { readOnly?: boolean }) {
  const [tasks, setTasks] = useState<EnrichedTask[]>([])
  const [taskDate, setTaskDate] = useState('')
  const [timezone, setTimezone] = useState('Europe/London')
  const [surgeries, setSurgeries] = useState<Surgery[]>([])
  const [surgeryFilter, setSurgeryFilter] = useState('all')
  const [selectedTask, setSelectedTask] = useState<EnrichedTask | null>(null)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [loading, setLoading] = useState(true)

  const loadTasks = useCallback(async () => {
    setLoading(true)
    try {
      const [tasksRes, surgeriesRes] = await Promise.all([
        fetch('/api/tasks'),
        fetch('/api/surgeries'),
      ])

      if (tasksRes.ok) {
        const { data } = await tasksRes.json()
        setTasks(data.tasks ?? [])
        setTaskDate(data.taskDate ?? '')
        if (data.timezone) setTimezone(data.timezone)
      }

      if (surgeriesRes.ok) {
        const { data } = await surgeriesRes.json()
        const active = (data.surgeries ?? []).filter(
          (s: Surgery & { is_active?: boolean }) => s.is_active !== false
        )
        setSurgeries(active)
      }
    } catch (error) {
      console.error('Failed to load tasks:', error)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadTasks()
  }, [loadTasks])

  const filteredTasks = useMemo(() => {
    if (surgeryFilter === 'all') return tasks
    return tasks.filter((t) => t.surgeryId === surgeryFilter)
  }, [tasks, surgeryFilter])

  const session = useMemo(() => {
    const morningTasks = filteredTasks.filter((t) => t.session === 'morning')
    const afternoonTasks = filteredTasks.filter((t) => t.session === 'afternoon')

    if (morningTasks.some((t) => t.computedStatus !== 'completed')) {
      return 'morning' as const
    }
    if (afternoonTasks.length > 0) return 'afternoon' as const
    return 'all_day' as const
  }, [filteredTasks])

  const minutesUntilLock = getMinutesUntilLock(session, taskDate, timezone)
  const pendingTasks = filteredTasks.filter((t) => t.computedStatus !== 'completed')

  function handleSelectTask(task: EnrichedTask) {
    if (readOnly) return
    if (task.status === 'completed' && task.isLocked) return
    if (task.status === 'completed') return

    setSelectedTask(task)
    setDialogOpen(true)
  }

  return (
    <div className="flex flex-1 flex-col px-5 pb-8 pt-5 md:px-8">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold">Today&apos;s tasks</h1>
          <p className="text-sm text-muted-foreground">
            {pendingTasks.length} remaining
            {surgeryFilter !== 'all' && ` · filtered`}
          </p>
        </div>
        {surgeries.length > 0 && (
          <Select value={surgeryFilter} onValueChange={(v) => v && setSurgeryFilter(v)}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="All surgeries" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All surgeries</SelectItem>
              {surgeries.map((s) => (
                <SelectItem key={s.id} value={s.id}>
                  {s.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </div>

      <div className="mb-4">
        <SessionBanner session={session} minutesUntilLock={minutesUntilLock} />
      </div>

      <div className="flex-1">
        {loading ? (
          <div className="space-y-3 py-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-16 animate-pulse rounded-lg bg-muted" />
            ))}
          </div>
        ) : filteredTasks.length === 0 ? (
          <p className="py-12 text-center text-muted-foreground">
            No tasks for today.
          </p>
        ) : (
          <div className="divide-y divide-border rounded-lg border border-border bg-surface">
            {filteredTasks.map((task) => (
              <TaskRow
                key={task.id}
                task={task}
                onSelect={handleSelectTask}
              />
            ))}
          </div>
        )}
      </div>

      {!readOnly && (
        <TaskCompleteDialog
          task={selectedTask}
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          onCompleted={loadTasks}
        />
      )}
    </div>
  )
}
