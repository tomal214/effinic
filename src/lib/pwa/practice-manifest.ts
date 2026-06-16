export type PracticeManifestInput = {
  name: string
  slug: string
  token: string
}

export function buildPracticeManifest({
  name,
  slug,
  token,
}: PracticeManifestInput) {
  const startUrl = `/p/${slug}/${token}`

  return {
    name: `${name} · Effinic`,
    short_name: name,
    id: startUrl,
    start_url: startUrl,
    scope: '/',
    display: 'standalone',
    theme_color: '#0d9488',
    background_color: '#f8f7f4',
    icons: [
      {
        src: '/brand/icon-192.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/brand/icon-512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/brand/icon-512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'maskable',
      },
    ],
  }
}
