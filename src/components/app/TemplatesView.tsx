'use client'

import { useCallback, useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

import FetchErrorPanel from '@/components/app/FetchErrorPanel'
import { runDeferredEffect } from '@/lib/react/defer-effect'
type Template = {
  id: string
  title: string
  time_due: string | null
  role_responsible: string
  surgery_ids: string[]
  checklist_steps: string[]
  is_mandatory: boolean
  compliance_file_url: string | null
}

type Surgery = { id: string; name: string }

const ROLES = [
  'admin',
  'manager',
  'nurse',
  'receptionist',
  'dentist',
  'hygienist',
  'viewer',
]

export default function TemplatesView({
  readOnly = false,
  initialData,
}: {
  readOnly?: boolean
  initialData?: {
    templates: Array<Omit<Template, 'checklist_steps'> & { checklist_steps: unknown }>
    surgeries: Surgery[]
  }
}) {
  const [templates, setTemplates] = useState<Template[]>(
    (initialData?.templates ?? []).map((template) => ({
      ...template,
      checklist_steps: Array.isArray(template.checklist_steps)
        ? template.checklist_steps
        : [],
    }))
  )
  const [surgeries, setSurgeries] = useState<Surgery[]>(
    initialData?.surgeries ?? []
  )
  const [title, setTitle] = useState('')
  const [timeDue, setTimeDue] = useState('')
  const [roleResponsible, setRoleResponsible] = useState('nurse')
  const [surgeryIds, setSurgeryIds] = useState<string[]>([])
  const [checklistText, setChecklistText] = useState('')
  const [isMandatory, setIsMandatory] = useState(true)
  const [complianceFileUrl, setComplianceFileUrl] = useState('')
  const [loading, setLoading] = useState(!initialData)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [fetchError, setFetchError] = useState('')

  const loadData = useCallback(async () => {
    setLoading(true)
    setFetchError('')
    try {
      const [templatesRes, surgeriesRes] = await Promise.all([
        fetch('/api/templates'),
        fetch('/api/surgeries'),
      ])

      if (!templatesRes.ok || !surgeriesRes.ok) {
        setFetchError('Could not load templates. Check your connection and try again.')
        return
      }

      const templatesBody = await templatesRes.json()
      const surgeriesBody = await surgeriesRes.json()
      setTemplates(templatesBody.data?.templates ?? [])
      setSurgeries(
        (surgeriesBody.data?.surgeries ?? []).filter(
          (s: Surgery & { is_active?: boolean }) => s.is_active !== false
        )
      )
    } catch (err) {
      console.error('Failed to load templates:', err)
      setFetchError('Could not load templates. Check your connection and try again.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (initialData) return
    runDeferredEffect(() => loadData())
  }, [loadData, initialData])

  function toggleSurgery(surgeryId: string, checked: boolean) {
    setSurgeryIds((prev) =>
      checked ? [...prev, surgeryId] : prev.filter((id) => id !== surgeryId)
    )
  }

  async function handleCreate(event: React.FormEvent) {
    event.preventDefault()
    setSaving(true)
    setError('')

    const checklistSteps = checklistText
      .split('\n')
      .map((line) => line.trim())
      .filter(Boolean)

    try {
      const res = await fetch('/api/templates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          timeDue: timeDue || null,
          roleResponsible,
          surgeryIds,
          checklistSteps,
          isMandatory,
          complianceFileUrl: complianceFileUrl || '',
        }),
      })
      const body = await res.json()

      if (!res.ok) {
        setError(body.error ?? 'Failed to create template')
        return
      }

      setTitle('')
      setTimeDue('')
      setRoleResponsible('nurse')
      setSurgeryIds([])
      setChecklistText('')
      setIsMandatory(true)
      setComplianceFileUrl('')
      await loadData()
    } catch (err) {
      console.error('Create template failed:', err)
      setError('Something went wrong')
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(templateId: string) {
    const res = await fetch(`/api/templates/${templateId}`, {
      method: 'DELETE',
    })

    if (res.ok) await loadData()
  }

  return (
    <div className="flex flex-1 flex-col gap-8 px-5 py-6 md:px-8">
      <div>
        <h1 className="text-2xl font-semibold">Task templates</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {readOnly
            ? 'View task templates for your practice (read-only).'
            : 'Define daily tasks generated for your practice.'}
        </p>
      </div>

      {fetchError ? (
        <FetchErrorPanel message={fetchError} onRetry={loadData} />
      ) : null}

      {!readOnly ? (
      <form
        onSubmit={handleCreate}
        className="grid gap-4 rounded-lg border border-border p-5 md:grid-cols-2"
      >
        <div className="space-y-1.5 md:col-span-2">
          <Label htmlFor="title">Title</Label>
          <Input
            id="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="time-due">Time due</Label>
          <Input
            id="time-due"
            type="time"
            value={timeDue}
            onChange={(e) => setTimeDue(e.target.value)}
          />
        </div>

        <div className="space-y-1.5">
          <Label>Role responsible</Label>
          <Select
            value={roleResponsible}
            onValueChange={(v) => v && setRoleResponsible(v)}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {ROLES.map((r) => (
                <SelectItem key={r} value={r}>
                  {r}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2 md:col-span-2">
          <Label>Surgeries</Label>
          <div className="flex flex-wrap gap-4">
            {surgeries.map((surgery) => (
              <label
                key={surgery.id}
                className="flex items-center gap-2 text-sm"
              >
                <Checkbox
                  checked={surgeryIds.includes(surgery.id)}
                  onCheckedChange={(checked) =>
                    toggleSurgery(surgery.id, checked === true)
                  }
                />
                {surgery.name}
              </label>
            ))}
          </div>
        </div>

        <div className="space-y-1.5 md:col-span-2">
          <Label htmlFor="checklist">Checklist steps (one per line)</Label>
          <textarea
            id="checklist"
            value={checklistText}
            onChange={(e) => setChecklistText(e.target.value)}
            rows={4}
            className="w-full rounded-lg border border-input bg-transparent px-3 py-2 text-sm"
          />
        </div>

        <div className="space-y-1.5 md:col-span-2">
          <Label htmlFor="compliance-url">Compliance file URL</Label>
          <Input
            id="compliance-url"
            type="url"
            value={complianceFileUrl}
            onChange={(e) => setComplianceFileUrl(e.target.value)}
            placeholder="https://…"
          />
        </div>

        <label className="flex items-center gap-2 text-sm md:col-span-2">
          <Checkbox
            checked={isMandatory}
            onCheckedChange={(checked) => setIsMandatory(checked === true)}
          />
          Mandatory task
        </label>

        <div className="md:col-span-2">
          <Button type="submit" disabled={saving} className="rounded-full">
            {saving ? 'Saving…' : 'Add template'}
          </Button>
          {error && <p className="mt-2 text-sm text-danger">{error}</p>}
        </div>
      </form>
      ) : null}

      <div className="overflow-x-auto rounded-lg border border-border">
        <Table>
          <caption className="sr-only">Task templates</caption>
          <TableHeader>
            <TableRow>
              <TableHead>Title</TableHead>
              <TableHead>Due</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Mandatory</TableHead>
              {!readOnly ? (
                <TableHead className="text-right">Actions</TableHead>
              ) : null}
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={readOnly ? 4 : 5} className="text-muted-foreground" role="status">
                  Loading templates…
                </TableCell>
              </TableRow>
            ) : templates.length === 0 ? (
              <TableRow>
                <TableCell colSpan={readOnly ? 4 : 5} className="text-muted-foreground">
                  No templates yet.
                </TableCell>
              </TableRow>
            ) : (
              templates.map((template) => (
                <TableRow key={template.id}>
                  <TableCell className="font-medium">{template.title}</TableCell>
                  <TableCell className="tabular-nums">
                    {template.time_due?.slice(0, 5) ?? '—'}
                  </TableCell>
                  <TableCell>{template.role_responsible}</TableCell>
                  <TableCell>{template.is_mandatory ? 'Yes' : 'No'}</TableCell>
                  {!readOnly ? (
                  <TableCell className="text-right">
                    <Button
                      type="button"
                      variant="destructive"
                      size="sm"
                      onClick={() => handleDelete(template.id)}
                    >
                      Remove
                    </Button>
                  </TableCell>
                  ) : null}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
