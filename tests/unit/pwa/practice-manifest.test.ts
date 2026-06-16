import { describe, expect, it } from 'vitest'
import { buildPracticeManifest } from '@/lib/pwa/practice-manifest'

describe('buildPracticeManifest', () => {
  it('uses site-wide scope and practice-specific start_url', () => {
    const manifest = buildPracticeManifest({
      name: 'Demo Dental',
      slug: 'demo-dental',
      token: '11111111-1111-1111-1111-111111111111',
    })

    expect(manifest.scope).toBe('/')
    expect(manifest.start_url).toBe(
      '/p/demo-dental/11111111-1111-1111-1111-111111111111'
    )
    expect(manifest.id).toBe(manifest.start_url)
    expect(manifest.name).toBe('Demo Dental · Effinic')
    expect(manifest.short_name).toBe('Demo Dental')
    expect(manifest.prefer_related_applications).toBe(false)
    expect(manifest.icons).toHaveLength(3)
  })

  it('truncates long practice names for short_name', () => {
    const manifest = buildPracticeManifest({
      name: 'Demo Dental Practice',
      slug: 'demo-dental',
      token: '11111111-1111-1111-1111-111111111111',
    })

    expect(manifest.short_name).toBe('Demo Dental')
    expect(manifest.short_name.length).toBeLessThanOrEqual(12)
  })

  it('uses absolute URLs when origin is provided', () => {
    const manifest = buildPracticeManifest({
      name: 'Demo Dental',
      slug: 'demo-dental',
      token: '11111111-1111-1111-1111-111111111111',
      origin: 'https://effinic.vercel.app',
    })

    expect(manifest.start_url).toBe(
      'https://effinic.vercel.app/p/demo-dental/11111111-1111-1111-1111-111111111111'
    )
    expect(manifest.scope).toBe('https://effinic.vercel.app/')
    expect(manifest.id).toBe(
      '/p/demo-dental/11111111-1111-1111-1111-111111111111'
    )
  })
})
