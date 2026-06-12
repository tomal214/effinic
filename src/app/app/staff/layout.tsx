import { requireManagerOrViewerPage } from '@/lib/auth/page-guards'

export default async function StaffLayout({
  children,
}: {
  children: React.ReactNode
}) {
  await requireManagerOrViewerPage()
  return children
}
