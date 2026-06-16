export const pwaIcons = [
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
]

export function withOriginIcons(origin?: string) {
  if (!origin) return pwaIcons
  return pwaIcons.map((icon) => ({
    ...icon,
    src: `${origin}${icon.src}`,
  }))
}
