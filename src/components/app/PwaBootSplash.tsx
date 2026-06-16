'use client'

import { useEffect } from 'react'

const MIN_VISIBLE_MS = 500
const FADE_MS = 280
const MAX_WAIT_MS = 10000

function isStandalonePwa() {
  if (typeof window === 'undefined') return false
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    (window.navigator as Navigator & { standalone?: boolean }).standalone ===
      true
  )
}

function hasAppContent() {
  const main = document.querySelector('main.app-main')
  if (main && main.childElementCount > 0) return true

  const kiosk = document.querySelector('[data-kiosk-shell]')
  if (kiosk) return true

  return false
}

export default function PwaBootSplash() {
  useEffect(() => {
    const splash = document.getElementById('effinic-boot')
    if (!splash) return

    if (!isStandalonePwa()) {
      splash.remove()
      return
    }

    const started = performance.now()
    const splashEl = splash
    let cancelled = false

    function fadeOut() {
      if (cancelled) return
      splashEl.style.opacity = '0'
      splashEl.style.pointerEvents = 'none'
      window.setTimeout(() => splashEl.remove(), FADE_MS)
    }

    function tryDismiss() {
      if (cancelled) return

      const elapsed = performance.now() - started
      if (elapsed < MIN_VISIBLE_MS) {
        window.requestAnimationFrame(tryDismiss)
        return
      }

      if (hasAppContent() || elapsed >= MAX_WAIT_MS) {
        fadeOut()
        return
      }

      window.requestAnimationFrame(tryDismiss)
    }

    function startDismiss() {
      window.requestAnimationFrame(tryDismiss)
    }

    if (document.readyState === 'complete') {
      startDismiss()
    } else {
      window.addEventListener('load', startDismiss, { once: true })
    }

    return () => {
      cancelled = true
      window.removeEventListener('load', startDismiss)
    }
  }, [])

  return null
}
