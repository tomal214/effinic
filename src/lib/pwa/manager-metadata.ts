import type { Metadata } from 'next'

export const managerPwaMetadata: Metadata = {
  manifest: '/manifest.webmanifest',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Effinic',
  },
}
