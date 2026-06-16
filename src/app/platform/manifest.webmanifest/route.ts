import { NextResponse } from 'next/server'
import { buildPlatformManifest } from '@/lib/pwa/platform-manifest'

export async function GET(request: Request) {
  const origin = new URL(request.url).origin
  const manifest = buildPlatformManifest(origin)

  return new NextResponse(JSON.stringify(manifest), {
    headers: {
      'Content-Type': 'application/manifest+json',
      'Cache-Control': 'public, max-age=3600',
    },
  })
}
