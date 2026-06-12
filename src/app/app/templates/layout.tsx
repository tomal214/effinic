import { requireManagerOrViewerPage } from '@/lib/auth/page-guards'

export default async function TemplatesLayout({
  children,
}: {
  children: React.ReactNode
}) {
  await requireManagerOrViewerPage()
  return children
}
