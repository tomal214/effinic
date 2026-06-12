import { NextResponse } from 'next/server'
import { getPracticeBySlugToken } from '@/lib/auth/practice'

const MANIFEST_BASE = {
  name: 'Effinic',
  short_name: 'Effinic',
  display: 'standalone',
  theme_color: 'oklch(0.58 0.14 175)',
  background_color: 'oklch(0.975 0.010 82)',
  icons: [
    { src: '/brand/logo.png', sizes: '192x192', type: 'image/png' },
    { src: '/brand/logo.png', sizes: '512x512', type: 'image/png' },
  ],
}

type RouteContext = { params: Promise<{ slug: string; token: string }> }

export async function GET(_request: Request, context: RouteContext) {
  const { slug, token } = await context.params
  const practice = await getPracticeBySlugToken(slug, token)

  if (!practice) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  return NextResponse.json({
    ...MANIFEST_BASE,
    start_url: `/p/${slug}/${token}`,
  })
}
