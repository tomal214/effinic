import Image from 'next/image'
import { cn } from '@/lib/utils'

export default function BrandedBootScreen({
  message = 'Loading…',
  className,
  fullScreen = false,
}: {
  message?: string
  className?: string
  fullScreen?: boolean
}) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center gap-6 px-6',
        fullScreen
          ? 'fixed inset-0 z-[9998] bg-canvas'
          : 'min-h-[min(70vh,32rem)] flex-1 py-16',
        className
      )}
      role="status"
      aria-live="polite"
      aria-busy="true"
      aria-label={message}
    >
      <div className="flex flex-col items-center gap-4">
        <div className="relative size-16 overflow-hidden rounded-2xl border border-border bg-surface shadow-sm">
          <Image
            src="/brand/icon-192.png"
            alt=""
            width={64}
            height={64}
            className="size-full object-cover"
            priority
          />
        </div>
        <p className="text-xl font-semibold tracking-tight text-foreground">
          Effinic
        </p>
      </div>

      <div className="w-full max-w-[12rem] space-y-2">
        <div
          className="h-1 overflow-hidden rounded-full bg-muted"
          aria-hidden="true"
        >
          <div className="boot-progress-bar h-full w-2/5 rounded-full bg-primary" />
        </div>
        <p className="text-center text-sm text-muted-foreground">{message}</p>
      </div>
    </div>
  )
}
