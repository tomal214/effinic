import { requireManagerOrViewerPage } from '@/lib/auth/page-guards'

export default async function SurgeriesLayout({
  children,
}: {
  children: React.ReactNode
}) {
  await requireManagerOrViewerPage()
  return children
}
