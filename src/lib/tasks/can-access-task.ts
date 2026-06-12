import {
  filterTasksForUser,
  type FilterableTask,
  type TaskFilterUser,
} from '@/lib/tasks/filter-tasks'

export function userCanActOnTask(
  task: FilterableTask,
  member: TaskFilterUser
): boolean {
  return filterTasksForUser([task], member).length > 0
}
