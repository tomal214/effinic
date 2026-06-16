'use client'

import { Button } from '@/components/ui/button'
import TaskRow from '@/components/app/TaskRow'
import TaskCompleteDialog from '@/components/app/TaskCompleteDialog'
import SessionBanner from '@/components/app/SessionBanner'
import FetchErrorPanel from '@/components/app/FetchErrorPanel'
import useTasksPage from '@/lib/tasks/use-tasks-page'
import TaskProgressHeader from '@/components/tasks/TaskProgressHeader'
import TaskCategoryFilter from '@/components/tasks/TaskCategoryFilter'
import TaskSection from '@/components/tasks/TaskSection'
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

export default function ReceptionTasksView({
  initialData,
}: {
  initialData?: { tasks: TasksPageData; surgeries: SurgeriesPageData }
}) {
  const {
    tasks,
    taskDate,
    loading,
    fetchError,
    signOffError,
    signingOff,
    loadTasks,
    session,
    minutesUntilLock,
    category,
    setCategory,
    categories,
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
  } = useTasksPage({ initialData, showSurgerySwitcher: false })

  return (
    <div className="flex flex-1 flex-col px-5 pb-8 pt-5 md:px-8">
      <div className="mb-4">
        <h1 className="text-xl font-semibold">Today&apos;s tasks</h1>
        <div className="mt-2">
          <TaskProgressHeader
            completedCount={completedCount}
            totalCount={tasks.length}
            dateLabel={taskDate}
          />
        </div>
      </div>

      <div className="mb-4 space-y-3">
        <SessionBanner session={session} minutesUntilLock={minutesUntilLock} />
        {signOffError ? (
          <p className="rounded-lg border border-danger/30 bg-danger/10 px-4 py-3 text-sm text-danger">
            {signOffError}
          </p>
        ) : null}
        {fetchError ? <FetchErrorPanel message={fetchError} onRetry={loadTasks} /> : null}
      </div>

      <div className="mb-4">
        <TaskCategoryFilter
          categories={categories}
          selected={category}
          onSelect={(next) => setCategory(next as TaskCategory)}
        />
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
          <div className="space-y-5">
            <TaskSection title="Pending" count={pendingTasks.length}>
              {pendingTasks.length ? (
                <div className="overflow-hidden rounded-lg border border-border bg-surface">
                  {pendingTasks.map((task) => (
                    <TaskRow
                      key={task.id}
                      task={task}
                      onSelect={handleSelectTask}
                      showStepCount
                      className="py-5"
                    />
                  ))}
                </div>
              ) : (
                <p className="py-2 text-sm text-muted-foreground">
                  Nothing pending in this category.
                </p>
              )}
            </TaskSection>

            <TaskSection title="Completed" count={completedTasks.length}>
              {completedTasks.length ? (
                <div className="overflow-hidden rounded-lg border border-border bg-surface">
                  {completedTasks.map((task) => (
                    <TaskRow
                      key={task.id}
                      task={task}
                      onSelect={handleSelectTask}
                      showStepCount
                      className="py-5"
                    />
                  ))}
                </div>
              ) : (
                <p className="py-2 text-sm text-muted-foreground">
                  No completed tasks in this category.
                </p>
              )}
            </TaskSection>
          </div>
        )}
      </div>

      <div className="sticky bottom-[var(--app-mobile-nav-offset)] z-30 mt-6 flex flex-col gap-2 border-t border-border bg-canvas pt-4 pb-4 md:bottom-0 md:pb-[max(1rem,env(safe-area-inset-bottom))]">
        {showMorningSignOff ? (
          <Button
            type="button"
            variant="outline"
            className="h-12 rounded-full"
            onClick={handleMorningSignOff}
            disabled={signingOff}
          >
            End morning session
          </Button>
        ) : null}
        {showEndDay ? (
          <Button
            type="button"
            className="h-12 rounded-full"
            onClick={handleEndDay}
            disabled={signingOff}
          >
            End day / Sign off
          </Button>
        ) : null}
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

