'use client'

import { AlertTriangle } from 'lucide-react'
import { getSessionBannerCopy } from '@/lib/session/banner-copy'

export default function SessionBanner({
  session,
  minutesUntilLock,
}: {
  session: 'morning' | 'afternoon' | 'all_day'
  minutesUntilLock: number | null
}) {
  if (minutesUntilLock === null || minutesUntilLock > 30) {
    return null
  }

  const copy = getSessionBannerCopy(session, minutesUntilLock)

  return (
    <div
      role="status"
      className="flex items-start gap-3 rounded-lg border border-warning/40 bg-warning/10 px-4 py-3 text-sm text-foreground"
    >
      <AlertTriangle className="mt-0.5 size-4 shrink-0 text-warning" />
      <div>
        <p className="font-medium">{copy.title}</p>
        <p className="text-muted-foreground">{copy.body}</p>
      </div>
    </div>
  )
}
