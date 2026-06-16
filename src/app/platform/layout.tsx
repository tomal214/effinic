import { platformPwaMetadata } from '@/lib/pwa/platform-metadata'

export const metadata = platformPwaMetadata

export default function PlatformLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
