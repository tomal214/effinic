import type { Metadata } from 'next'

export const platformPwaMetadata: Metadata = {
  manifest: '/platform/manifest.webmanifest',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Effinic Platform',
  },
}
