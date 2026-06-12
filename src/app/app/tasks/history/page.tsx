import { requireManagerOrViewerPage } from '@/lib/auth/page-guards'
import TaskHistoryView from '@/components/app/TaskHistoryView'

export default async function TaskHistoryPage() {
  const member = await requireManagerOrViewerPage()
  return <TaskHistoryView readOnly={member.role === 'viewer'} />
}
