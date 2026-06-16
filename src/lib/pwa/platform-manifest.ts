import { withOriginIcons } from '@/lib/pwa/icons'

export function buildPlatformManifest(origin?: string) {
  const startPath = '/platform'
  const startUrl = origin ? `${origin}${startPath}` : startPath
  const scope = origin ? `${origin}${startPath}/` : `${startPath}/`

  return {
    name: 'Effinic Platform',
    short_name: 'Platform',
    id: startUrl,
    start_url: startUrl,
    scope,
    display: 'standalone',
    prefer_related_applications: false,
    theme_color: '#0d9488',
    background_color: '#f8f7f4',
    icons: withOriginIcons(origin),
  }
}
