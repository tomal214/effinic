import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

export default function TaskSection({
  title,
  count,
  children,
  className,
}: {
  title: string
  count: number
  children: ReactNode
  className?: string
}) {
  return (
    <section className={cn('space-y-2', className)}>
      <div className="flex items-baseline justify-between gap-3">
        <h2 className="text-sm font-semibold text-foreground">{title}</h2>
        <p className="text-xs tabular-nums text-muted-foreground">{count}</p>
      </div>
      {children}
    </section>
  )
}

