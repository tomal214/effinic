import { NextResponse } from 'next/server'
import { getPracticeBySlugToken } from '@/lib/auth/practice'

const MANIFEST_BASE = {
  name: 'Effinic',
  short_name: 'Effinic',
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
      purpose: 'any maskable',
    },
  ],
}

type RouteContext = { params: Promise<{ slug: string; token: string }> }

export async function GET(_request: Request, context: RouteContext) {
  const { slug, token } = await context.params
  const practice = await getPracticeBySlugToken(slug, token)

  if (!practice) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  const startUrl = `/p/${slug}/${token}`
  const manifest = {
    ...MANIFEST_BASE,
    name: `${practice.name} · Effinic`,
    short_name: practice.name,
    id: startUrl,
    start_url: startUrl,
    scope: '/',
  }

  return new NextResponse(JSON.stringify(manifest), {
    headers: {
      'Content-Type': 'application/manifest+json',
    },
  })
}
