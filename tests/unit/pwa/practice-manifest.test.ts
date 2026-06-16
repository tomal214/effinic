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
    expect(manifest.icons).toHaveLength(3)
  })
})
