export type FilterableTask = {
  roleResponsible: string
  assignedUserId: string | null
  surgeryId: string | null
  computedStatus: string
}

export type TaskFilterUser = {
  role: string
  userId: string
  activeSurgeryId: string | null
}

const NO_TASK_ROLES = new Set(['dentist', 'hygienist'])

export function filterTasksForUser<T extends FilterableTask>(
  tasks: T[],
  user: TaskFilterUser
): T[] {
  if (NO_TASK_ROLES.has(user.role)) {
    return []
  }

  if (user.role === 'manager' || user.role === 'admin' || user.role === 'viewer') {
    return tasks
  }

  return tasks.filter((task) => matchesUser(task, user))
}

function matchesUser(task: FilterableTask, user: TaskFilterUser): boolean {
  if (task.assignedUserId) {
    return task.assignedUserId === user.userId
  }

  if (user.role === 'nurse') {
    if (task.roleResponsible !== 'nurse') {
      return false
    }

    if (user.activeSurgeryId) {
      return task.surgeryId === user.activeSurgeryId || task.surgeryId === null
    }

    return task.surgeryId === null
  }

  if (user.role === 'receptionist') {
    return task.roleResponsible === 'receptionist' || task.computedStatus === 'overdue'
  }

  return false
}
