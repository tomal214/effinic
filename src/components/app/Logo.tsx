import { cn } from '@/lib/utils'

export default function Logo({
  className,
  size = 'md',
}: {
  className?: string
  size?: 'sm' | 'md' | 'lg'
}) {
  const sizes = {
    sm: 'text-lg',
    md: 'text-2xl',
    lg: 'text-3xl',
  }

  return (
    <div className={cn('flex items-center gap-2', className)}>
      <span
        className={cn(
          'inline-flex size-9 items-center justify-center rounded-xl bg-primary font-semibold text-primary-foreground',
          size === 'sm' && 'size-7 text-sm',
          size === 'lg' && 'size-11 text-xl'
        )}
        aria-hidden
      >
        E
      </span>
      <span className={cn('font-semibold tracking-tight text-foreground', sizes[size])}>
        Effinic
      </span>
    </div>
  )
}
