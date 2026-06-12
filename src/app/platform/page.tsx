'use client'

import { useState } from 'react'
import Logo from '@/components/app/Logo'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

type Practice = {
  id: string
  name: string
  slug: string
  practice_token: string
  timezone: string
}

export default function PlatformPage() {
  const [name, setName] = useState('')
  const [slug, setSlug] = useState('')
  const [timezone, setTimezone] = useState('Europe/London')
  const [creating, setCreating] = useState(false)
  const [practice, setPractice] = useState<Practice | null>(null)
  const [practiceUrl, setPracticeUrl] = useState<string | null>(null)
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviting, setInviting] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const handleCreatePractice = async (e: React.FormEvent) => {
    e.preventDefault()
    setCreating(true)
    setError(null)
    setMessage(null)

    try {
      const res = await fetch('/api/platform/practices', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, slug, timezone }),
      })
      const json = await res.json()
      if (!res.ok) {
        setError(json.error ?? 'Failed to create practice')
        return
      }
      setPractice(json.data.practice)
      setPracticeUrl(json.data.practiceUrl)
      setMessage('Practice created. Invite a manager below.')
    } catch {
      setError('Something went wrong')
    } finally {
      setCreating(false)
    }
  }

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!practice) return
    setInviting(true)
    setError(null)
    setMessage(null)

    try {
      const res = await fetch(`/api/platform/practices/${practice.id}/invite`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: inviteEmail }),
      })
      const json = await res.json()
      if (!res.ok) {
        setError(json.error ?? 'Failed to send invite')
        return
      }
      setMessage(`Invite sent to ${inviteEmail}`)
      setInviteEmail('')
    } catch {
      setError('Something went wrong')
    } finally {
      setInviting(false)
    }
  }

  return (
    <div className="min-h-full bg-background px-5 py-10">
      <div className="mx-auto max-w-lg">
        <Logo className="mb-8" />
        <h1 className="mb-2 text-2xl font-semibold">Platform admin</h1>
        <p className="mb-8 text-sm text-muted-foreground">
          Create practices and invite managers.
        </p>

        <form onSubmit={handleCreatePractice} className="mb-10 flex flex-col gap-4 rounded-xl border border-border bg-card p-6">
          <h2 className="text-lg font-medium">New practice</h2>
          <div className="flex flex-col gap-2">
            <Label htmlFor="name">Practice name</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="slug">Slug</Label>
            <Input
              id="slug"
              value={slug}
              onChange={(e) =>
                setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))
              }
              placeholder="demo-dental"
              required
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="timezone">Timezone</Label>
            <Input
              id="timezone"
              value={timezone}
              onChange={(e) => setTimezone(e.target.value)}
              required
            />
          </div>
          <Button type="submit" disabled={creating}>
            {creating ? 'Creating…' : 'Create practice'}
          </Button>
        </form>

        {practiceUrl && (
          <div className="mb-8 rounded-lg bg-muted px-4 py-3 text-sm">
            <p className="font-medium">Nurse practice URL</p>
            <p className="mt-1 break-all text-muted-foreground">{practiceUrl}</p>
          </div>
        )}

        {practice && (
          <form onSubmit={handleInvite} className="flex flex-col gap-4 rounded-xl border border-border bg-card p-6">
            <h2 className="text-lg font-medium">Invite manager</h2>
            <p className="text-sm text-muted-foreground">
              For {practice.name}
            </p>
            <div className="flex flex-col gap-2">
              <Label htmlFor="invite-email">Manager email</Label>
              <Input
                id="invite-email"
                type="email"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                required
              />
            </div>
            <Button type="submit" disabled={inviting}>
              {inviting ? 'Sending…' : 'Send invite'}
            </Button>
          </form>
        )}

        {message && (
          <p className="mt-6 text-sm text-primary">{message}</p>
        )}
        {error && (
          <p className="mt-6 text-sm text-destructive" role="alert">
            {error}
          </p>
        )}
      </div>
    </div>
  )
}
