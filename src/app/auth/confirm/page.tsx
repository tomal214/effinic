import { Suspense } from 'react'
import ConfirmForm from './confirm-form'

export default function AuthConfirmPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-full items-center justify-center">
          <p className="text-muted-foreground">Loading…</p>
        </div>
      }
    >
      <ConfirmForm />
    </Suspense>
  )
}
