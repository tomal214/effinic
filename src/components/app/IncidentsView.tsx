'use client'

import { useCallback, useEffect, useState } from 'react'
import { format, parseISO } from 'date-fns'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

type Incident = {
  id: string
  title: string
  type: string
  severity: string
  description: string
  surgeryName: string | null
  reporterName: string
  status: string
  managerNotes: string | null
  createdAt: string
}

const severityVariant: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  low: 'secondary',
  medium: 'outline',
  high: 'default',
  critical: 'destructive',
}

const statusVariant: Record<
  string,
  'default' | 'secondary' | 'outline' | 'destructive'
> = {
  open: 'destructive',
  under_review: 'outline',
  resolved: 'secondary',
}

export default function IncidentsView({
  canCreate,
  canManage,
}: {
  canCreate: boolean
  canManage: boolean
}) {
  const [incidents, setIncidents] = useState<Incident[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [title, setTitle] = useState('')
  const [type, setType] = useState('incident')
  const [severity, setSeverity] = useState('medium')
  const [description, setDescription] = useState('')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editStatus, setEditStatus] = useState('open')
  const [editNotes, setEditNotes] = useState('')

  const loadIncidents = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/incidents')
      const json = await res.json()
      if (!res.ok) {
        setError(json.error ?? 'Failed to load incidents')
        return
      }
      setIncidents(json.data.incidents)
    } catch {
      setError('Failed to load incidents')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadIncidents()
  }, [loadIncidents])

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    setSubmitting(true)
    setError(null)
    try {
      const res = await fetch('/api/incidents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, type, severity, description }),
      })
      const json = await res.json()
      if (!res.ok) {
        setError(json.error ?? 'Failed to log incident')
        return
      }
      setTitle('')
      setType('incident')
      setSeverity('medium')
      setDescription('')
      setShowForm(false)
      await loadIncidents()
    } catch {
      setError('Failed to log incident')
    } finally {
      setSubmitting(false)
    }
  }

  async function handleUpdate(id: string) {
    setSubmitting(true)
    setError(null)
    try {
      const res = await fetch(`/api/incidents/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: editStatus,
          managerNotes: editNotes || null,
        }),
      })
      const json = await res.json()
      if (!res.ok) {
        setError(json.error ?? 'Failed to update incident')
        return
      }
      setEditingId(null)
      await loadIncidents()
    } catch {
      setError('Failed to update incident')
    } finally {
      setSubmitting(false)
    }
  }

  function startEdit(incident: Incident) {
    setEditingId(incident.id)
    setEditStatus(incident.status)
    setEditNotes(incident.managerNotes ?? '')
  }

  return (
    <div className="flex flex-1 flex-col gap-6 p-5">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold">Incidents</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Log and track clinical incidents, near misses, and issues.
          </p>
        </div>
        {canCreate && (
          <Button
            type="button"
            onClick={() => setShowForm((v) => !v)}
            variant={showForm ? 'outline' : 'default'}
          >
            {showForm ? 'Cancel' : 'Log incident'}
          </Button>
        )}
      </div>

      {error && (
        <p className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-2 text-sm text-destructive">
          {error}
        </p>
      )}

      {showForm && canCreate && (
        <form
          onSubmit={handleCreate}
          className="flex flex-col gap-4 rounded-xl border bg-card p-4"
        >
          <h2 className="font-medium">Quick log</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-2 sm:col-span-2">
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Brief summary"
                required
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label>Type</Label>
              <Select value={type} onValueChange={(v) => v && setType(v)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="incident">Incident</SelectItem>
                  <SelectItem value="near_miss">Near miss</SelectItem>
                  <SelectItem value="issue">Issue</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-2">
              <Label>Severity</Label>
              <Select value={severity} onValueChange={(v) => v && setSeverity(v)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="critical">Critical</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-2 sm:col-span-2">
              <Label htmlFor="description">Description</Label>
              <textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="What happened?"
                required
                rows={3}
                className="flex min-h-[80px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
              />
            </div>
          </div>
          <Button type="submit" disabled={submitting}>
            {submitting ? 'Saving…' : 'Submit report'}
          </Button>
        </form>
      )}

      {loading ? (
        <p className="text-sm text-muted-foreground">Loading incidents…</p>
      ) : incidents.length === 0 ? (
        <p className="text-sm text-muted-foreground">No incidents logged yet.</p>
      ) : (
        <ul className="flex flex-col gap-3">
          {incidents.map((incident) => (
            <li
              key={incident.id}
              className="rounded-xl border bg-card p-4"
            >
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <h3 className="font-medium">{incident.title}</h3>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {format(parseISO(incident.createdAt), 'd MMM yyyy, HH:mm')}
                    {incident.surgeryName ? ` · ${incident.surgeryName}` : ''}
                    {' · '}
                    {incident.reporterName}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Badge variant="outline">{incident.type.replace('_', ' ')}</Badge>
                  <Badge variant={severityVariant[incident.severity] ?? 'outline'}>
                    {incident.severity}
                  </Badge>
                  <Badge variant={statusVariant[incident.status] ?? 'outline'}>
                    {incident.status.replace('_', ' ')}
                  </Badge>
                </div>
              </div>
              <p className="mt-3 text-sm">{incident.description}</p>
              {incident.managerNotes && editingId !== incident.id && (
                <p className="mt-2 rounded-lg bg-muted px-3 py-2 text-sm">
                  <span className="font-medium">Manager notes: </span>
                  {incident.managerNotes}
                </p>
              )}
              {canManage && editingId === incident.id ? (
                <div className="mt-4 flex flex-col gap-3 border-t pt-4">
                  <div className="flex flex-col gap-2">
                    <Label>Status</Label>
                    <Select
                      value={editStatus}
                      onValueChange={(v) => v && setEditStatus(v)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="open">Open</SelectItem>
                        <SelectItem value="under_review">Under review</SelectItem>
                        <SelectItem value="resolved">Resolved</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex flex-col gap-2">
                    <Label htmlFor={`notes-${incident.id}`}>Manager notes</Label>
                    <textarea
                      id={`notes-${incident.id}`}
                      value={editNotes}
                      onChange={(e) => setEditNotes(e.target.value)}
                      rows={2}
                      className="flex min-h-[60px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      size="sm"
                      disabled={submitting}
                      onClick={() => handleUpdate(incident.id)}
                    >
                      Save
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={() => setEditingId(null)}
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              ) : canManage ? (
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  className="mt-3"
                  onClick={() => startEdit(incident)}
                >
                  Update status
                </Button>
              ) : null}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
