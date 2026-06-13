'use client'

import { useCallback, useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Logo from '@/components/app/Logo'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  clearUrlHash,
  parseHashSession,
  unregisterServiceWorkers,
} from '@/lib/auth/parse-auth-hash'
import { safeNext } from '@/lib/auth/safe-next'
import { createClient } from '@/lib/supabase/client'

type Step = 'loading' | 'password' | 'linking' | 'error'

type OnboardingStatus = {
  needsPassword: boolean
  ready: boolean
}

export default function ConfirmForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const next = safeNext(searchParams.get('next'))

  const [step, setStep] = useState<Step>('loading')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const finishSignup = useCallback(async () => {
    setStep('linking')
    setError(null)

    try {
      const res = await fetch('/api/auth/complete-signup', { method: 'POST' })
      const body = await res.json()

      if (!res.ok) {
        setError(body.error ?? 'Could not finish setting up your account')
        setStep('error')
        return
      }

      router.push(next)
      router.refresh()
    } catch (err) {
      console.error('Finish signup failed:', err)
      setError('Something went wrong. Try again.')
      setStep('error')
    }
  }, [next, router])

  useEffect(() => {
    const code = searchParams.get('code')
    if (code) {
      const callbackUrl = new URL('/auth/callback', window.location.origin)
      callbackUrl.searchParams.set('code', code)
      callbackUrl.searchParams.set('next', next)
      router.replace(`${callbackUrl.pathname}${callbackUrl.search}`)
      return
    }

    let cancelled = false
    const hash = window.location.hash

    async function bootstrap() {
      if (hash.includes('access_token')) {
        await unregisterServiceWorkers()
      }

      const supabase = createClient()
      const tokens = parseHashSession(hash)

      if (tokens) {
        const { error: sessionError } = await supabase.auth.setSession(tokens)
        if (cancelled) return

        if (sessionError) {
          console.error('Set session from invite hash failed:', sessionError)
          setError('This link is invalid or has expired. Ask for a new invite.')
          setStep('error')
          return
        }

        clearUrlHash()
      }

      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession()

      if (cancelled) return

      if (sessionError || !session) {
        setError('This link is invalid or has expired. Ask for a new invite.')
        setStep('error')
        return
      }

      const statusRes = await fetch('/api/auth/onboarding-status')
      if (cancelled) return

      if (!statusRes.ok) {
        setError('Could not verify your invite. Try again or ask for a new invite.')
        setStep('error')
        return
      }

      const payload = await statusRes.json()
      const status = payload.data as OnboardingStatus

      if (status.ready) {
        router.push(next)
        router.refresh()
        return
      }

      if (status.needsPassword) {
        setStep('password')
        return
      }

      await finishSignup()
    }

    const timeout = window.setTimeout(() => {
      if (cancelled) return
      setError('This is taking too long. Try opening the invite link in a private window.')
      setStep('error')
    }, 15000)

    bootstrap()
      .catch((err) => {
        console.error('Invite confirm bootstrap failed:', err)
        if (!cancelled) {
          setError('Something went wrong. Try again or ask for a new invite.')
          setStep('error')
        }
      })
      .finally(() => {
        window.clearTimeout(timeout)
      })

    return () => {
      cancelled = true
      window.clearTimeout(timeout)
    }
  }, [finishSignup, next, router, searchParams])

  async function handleSetPassword(event: React.FormEvent) {
    event.preventDefault()
    setError(null)

    if (password.length < 8) {
      setError('Password must be at least 8 characters')
      return
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match')
      return
    }

    setSubmitting(true)

    try {
      const supabase = createClient()
      const { error: updateError } = await supabase.auth.updateUser({
        password,
        data: { password_set: true },
      })

      if (updateError) {
        setError(updateError.message)
        setSubmitting(false)
        return
      }

      await finishSignup()
    } catch (err) {
      console.error('Set password failed:', err)
      setError('Something went wrong. Try again.')
    } finally {
      setSubmitting(false)
    }
  }

  if (step === 'loading' || step === 'linking') {
    return (
      <div className="flex min-h-full flex-col items-center justify-center bg-background px-5 py-12">
        <Logo className="mb-6 justify-center" size="lg" />
        <p className="text-sm text-muted-foreground">
          {step === 'linking' ? 'Finishing setup…' : 'Confirming your invite…'}
        </p>
      </div>
    )
  }

  if (step === 'error') {
    return (
      <div className="flex min-h-full flex-col items-center justify-center bg-background px-5 py-12">
        <div className="w-full max-w-sm text-center">
          <Logo className="mb-6 justify-center" size="lg" />
          <p className="mb-6 text-sm text-destructive" role="alert">
            {error}
          </p>
          <Button type="button" variant="outline" onClick={() => router.push('/login')}>
            Back to sign in
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-full flex-col items-center justify-center bg-background px-5 py-12">
      <div className="w-full max-w-sm">
        <Logo className="mb-8 justify-center" size="lg" />
        <h1 className="mb-2 text-center text-xl font-semibold">Set your password</h1>
        <p className="mb-8 text-center text-sm text-muted-foreground">
          Create a password to finish accepting your invite.
        </p>

        <form onSubmit={handleSetPassword} className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={8}
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="confirm-password">Confirm password</Label>
            <Input
              id="confirm-password"
              type="password"
              autoComplete="new-password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              minLength={8}
            />
          </div>

          {error && (
            <p className="text-sm text-destructive" role="alert">
              {error}
            </p>
          )}

          <Button type="submit" className="h-11 w-full" disabled={submitting}>
            {submitting ? 'Saving…' : 'Continue to Effinic'}
          </Button>
        </form>
      </div>
    </div>
  )
}
