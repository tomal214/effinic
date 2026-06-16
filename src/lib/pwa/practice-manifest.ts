import { withOriginIcons } from '@/lib/pwa/icons'

export type PracticeManifestInput = {
  name: string
  slug: string
  token: string
  origin?: string
}

function practiceShortName(name: string) {
  const trimmed = name.trim()
  if (trimmed.length <= 12) return trimmed
  return trimmed.slice(0, 12).trimEnd()
}

export function buildPracticeManifest({
  name,
  slug,
  token,
  origin,
}: PracticeManifestInput) {
  const startPath = `/p/${slug}/${token}`
  const startUrl = origin ? `${origin}${startPath}` : startPath
  const scope = origin ? `${origin}/` : '/'

  return {
    name: `${name} · Effinic`,
    short_name: practiceShortName(name),
    id: startPath,
    start_url: startUrl,
    scope,
    display: 'standalone',
    prefer_related_applications: false,
    theme_color: '#0d9488',
    background_color: '#f8f7f4',
    icons: withOriginIcons(origin),
  }
}
