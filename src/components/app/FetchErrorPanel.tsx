import { Button } from '@/components/ui/button'

export default function FetchErrorPanel({
  message,
  onRetry,
}: {
  message: string
  onRetry: () => void
}) {
  return (
    <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3">
      <p className="text-sm text-destructive">{message}</p>
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="mt-3"
        onClick={onRetry}
      >
        Try again
      </Button>
    </div>
  )
}
