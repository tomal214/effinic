import { requireManagerOrViewerPage } from '@/lib/auth/page-guards'
import {
  defaultTaskHistoryRange,
  loadTaskHistoryPageData,
} from '@/lib/app/page-data'
import TaskHistoryView from '@/components/app/TaskHistoryView'

export default async function TaskHistoryPage() {
  const member = await requireManagerOrViewerPage()
  const { from, to } = defaultTaskHistoryRange()
  const initialData = await loadTaskHistoryPageData(member, from, to)

  return (
    <TaskHistoryView
      readOnly={member.role === 'viewer'}
      initialData={initialData}
    />
  )
}
