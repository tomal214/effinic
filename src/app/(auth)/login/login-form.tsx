'use client'

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Logo from '@/components/app/Logo'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { createClient } from '@/lib/supabase/client'
import { safeNext } from '@/lib/auth/safe-next'
import { unregisterServiceWorkers } from '@/lib/auth/parse-auth-hash'

export default function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const next = safeNext(searchParams.get('next'))
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (window.location.hash.includes('access_token')) {
      void unregisterServiceWorkers().then(() => {
        const search = window.location.search
        router.replace(`/auth/confirm${search}${window.location.hash}`)
      })
    }
  }, [router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const supabase = createClient()
      await supabase.auth.signOut()
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      })

      if (signInError) {
        setError(
          signInError.message === 'Invalid login credentials'
            ? 'Invalid email or password'
            : signInError.message
        )
        setLoading(false)
        return
      }

      await supabase.auth.updateUser({ data: { password_set: true } })

      router.push(next)
      router.refresh()
    } catch (err) {
      console.error('Login failed:', err)
      setError('Something went wrong. Check Supabase is running.')
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-full flex-col items-center justify-center bg-background px-5 py-12">
        <Logo className="mb-6 justify-center" size="lg" />
        <p className="text-sm text-muted-foreground">Signing in…</p>
      </div>
    )
  }

  return (
    <div className="flex min-h-full flex-col items-center justify-center bg-background px-5 py-12">
      <div className="w-full max-w-sm">
        <Logo className="mb-8 justify-center" size="lg" />
        <h1 className="mb-2 text-center text-xl font-semibold">Manager sign in</h1>
        <p className="mb-8 text-center text-sm text-muted-foreground">
          Use your practice email and password.
        </p>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          {error && (
            <p className="text-sm text-destructive" role="alert">
              {error}
            </p>
          )}

          <Button type="submit" className="h-11 w-full">
            Sign in
          </Button>
        </form>
      </div>
    </div>
  )
}
