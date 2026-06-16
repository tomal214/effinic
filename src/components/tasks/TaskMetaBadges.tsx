import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

function priorityLabel(priority?: string | null) {
  if (!priority) return null
  const value = String(priority).toLowerCase()
  if (value === 'low') return 'Low'
  if (value === 'medium') return 'Medium'
  if (value === 'high') return 'High'
  if (value === 'urgent') return 'Urgent'
  if (value === 'critical') return 'Critical'
  return priority
}

function priorityClasses(priority?: string | null) {
  const value = String(priority ?? '').toLowerCase()
  if (value === 'high' || value === 'urgent') return 'bg-warning/15 text-foreground'
  if (value === 'critical') return 'bg-danger/10 text-danger'
  if (value === 'low') return 'bg-muted text-muted-foreground'
  return 'bg-info/10 text-info'
}

export default function TaskMetaBadges({
  priority,
  isMandatory,
  evidenceLabel,
  categoryLabel,
  className,
}: {
  priority?: string | null
  isMandatory?: boolean
  evidenceLabel?: string | null
  categoryLabel?: string | null
  className?: string
}) {
  const priorityText = priorityLabel(priority)
  const evidenceText = evidenceLabel ?? null
  const categoryText = categoryLabel ?? null

  if (!priorityText && !isMandatory && !evidenceText && !categoryText) return null

  return (
    <div className={cn('flex flex-wrap items-center gap-1.5', className)}>
      {priorityText ? (
        <Badge className={cn('rounded-full', priorityClasses(priority))}>
          {priorityText}
        </Badge>
      ) : null}
      {isMandatory ? (
        <Badge className="rounded-full bg-warning/15 text-foreground">
          Mandatory
        </Badge>
      ) : null}
      {evidenceText ? (
        <Badge className="rounded-full bg-info/10 text-info">{evidenceText}</Badge>
      ) : null}
      {categoryText ? (
        <Badge variant="outline" className="rounded-full">
          {categoryText}
        </Badge>
      ) : null}
    </div>
  )
}

