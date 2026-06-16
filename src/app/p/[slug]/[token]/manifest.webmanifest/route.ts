import { NextResponse } from 'next/server'
import { getPracticeBySlugToken } from '@/lib/auth/practice'
import { buildPracticeManifest } from '@/lib/pwa/practice-manifest'

type RouteContext = { params: Promise<{ slug: string; token: string }> }

export async function GET(_request: Request, context: RouteContext) {
  const { slug, token } = await context.params
  const practice = await getPracticeBySlugToken(slug, token)

  if (!practice) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  const manifest = buildPracticeManifest({
    name: practice.name,
    slug,
    token,
  })

  return new NextResponse(JSON.stringify(manifest), {
    headers: {
      'Content-Type': 'application/manifest+json',
      'Cache-Control': 'public, max-age=3600',
    },
  })
}
