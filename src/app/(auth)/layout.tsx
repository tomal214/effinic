import { managerPwaMetadata } from '@/lib/pwa/manager-metadata'

export const metadata = managerPwaMetadata

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
