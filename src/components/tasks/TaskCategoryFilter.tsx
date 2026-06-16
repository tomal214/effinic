import { cn } from '@/lib/utils'

export default function TaskCategoryFilter({
  categories,
  selected,
  onSelect,
  className,
}: {
  categories: { key: string; label: string; count: number }[]
  selected: string
  onSelect: (category: string) => void
  className?: string
}) {
  return (
    <div className={cn('overflow-x-auto', className)}>
      <div className="flex w-max items-center gap-2 pr-2">
        {categories.map((cat) => {
          const active = cat.key === selected
          return (
            <button
              key={cat.key}
              type="button"
              onClick={() => onSelect(cat.key)}
              className={cn(
                'inline-flex h-10 items-center gap-2 rounded-full border px-4 text-sm font-medium transition-colors',
                active
                  ? 'border-accent bg-accent/10 text-foreground'
                  : 'border-border bg-surface text-muted-foreground hover:bg-muted/40 active:bg-muted'
              )}
            >
              <span className="whitespace-nowrap">{cat.label}</span>
              <span
                className={cn(
                  'tabular-nums',
                  active ? 'text-foreground' : 'text-muted-foreground'
                )}
                aria-label={`${cat.count} tasks`}
              >
                {cat.count}
              </span>
            </button>
          )
        })}
      </div>
    </div>
  )
}

