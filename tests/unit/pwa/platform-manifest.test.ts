import { describe, expect, it } from 'vitest'
import { buildPlatformManifest } from '@/lib/pwa/platform-manifest'

describe('buildPlatformManifest', () => {
  it('opens /platform after install', () => {
    const manifest = buildPlatformManifest()

    expect(manifest.start_url).toBe('/platform')
    expect(manifest.scope).toBe('/platform/')
    expect(manifest.id).toBe('/platform')
    expect(manifest.name).toBe('Effinic Platform')
    expect(manifest.short_name).toBe('Platform')
    expect(manifest.prefer_related_applications).toBe(false)
  })

  it('uses absolute URLs when origin is provided', () => {
    const manifest = buildPlatformManifest('https://effinic.vercel.app')

    expect(manifest.start_url).toBe('https://effinic.vercel.app/platform')
    expect(manifest.scope).toBe('https://effinic.vercel.app/platform/')
    expect(manifest.icons[0].src).toBe(
      'https://effinic.vercel.app/brand/icon-192.png'
    )
  })
})
