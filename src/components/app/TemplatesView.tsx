'use client'

import { useCallback, useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
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
import { TASK_CATEGORIES, categoryLabel } from '@/lib/tasks/categories'
import { parseEvidenceRequired } from '@/lib/tasks/evidence'
import { createTemplateSchema, updateTemplateSchema } from '@/lib/validation/templates'
type Template = {
  id: string
  title: string
  description: string | null
  time_due: string | null
  role_responsible: string
  priority: string | null
  category: string | null
  surgery_ids: string[]
  checklist_steps: string[]
  is_mandatory: boolean
  evidence_required: string | null
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
  const [description, setDescription] = useState('')
  const [timeDue, setTimeDue] = useState('')
  const [roleResponsible, setRoleResponsible] = useState('nurse')
  const [priority, setPriority] = useState<'low' | 'medium' | 'high'>('medium')
  const [category, setCategory] = useState<string>('general')
  const [surgeryIds, setSurgeryIds] = useState<string[]>([])
  const [checklistText, setChecklistText] = useState('')
  const [isMandatory, setIsMandatory] = useState(true)
  const [evidencePhoto, setEvidencePhoto] = useState(false)
  const [evidenceChecklist, setEvidenceChecklist] = useState(false)
  const [complianceFileUrl, setComplianceFileUrl] = useState('')
  const [loading, setLoading] = useState(!initialData)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [fetchError, setFetchError] = useState('')
  const [editingTemplate, setEditingTemplate] = useState<Template | null>(null)
  const [editTitle, setEditTitle] = useState('')
  const [editDescription, setEditDescription] = useState('')
  const [editTimeDue, setEditTimeDue] = useState('')
  const [editRoleResponsible, setEditRoleResponsible] = useState('nurse')
  const [editPriority, setEditPriority] = useState<'low' | 'medium' | 'high'>(
    'medium'
  )
  const [editCategory, setEditCategory] = useState<string>('general')
  const [editSurgeryIds, setEditSurgeryIds] = useState<string[]>([])
  const [editChecklistText, setEditChecklistText] = useState('')
  const [editIsMandatory, setEditIsMandatory] = useState(true)
  const [editEvidencePhoto, setEditEvidencePhoto] = useState(false)
  const [editEvidenceChecklist, setEditEvidenceChecklist] = useState(false)
  const [editComplianceFileUrl, setEditComplianceFileUrl] = useState('')
  const [editing, setEditing] = useState(false)
  const [editError, setEditError] = useState('')

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

  function toggleEditSurgery(surgeryId: string, checked: boolean) {
    setEditSurgeryIds((prev) =>
      checked ? [...prev, surgeryId] : prev.filter((id) => id !== surgeryId)
    )
  }

  function openEdit(template: Template) {
    const evidence = parseEvidenceRequired(template.evidence_required)
    setEditError('')
    setEditingTemplate(template)
    setEditTitle(template.title ?? '')
    setEditDescription(template.description ?? '')
    setEditTimeDue(template.time_due?.slice(0, 5) ?? '')
    setEditRoleResponsible(template.role_responsible ?? 'nurse')
    setEditPriority(
      (template.priority as typeof editPriority | null) ?? 'medium'
    )
    setEditCategory(template.category ?? 'general')
    setEditSurgeryIds(template.surgery_ids ?? [])
    setEditChecklistText((template.checklist_steps ?? []).join('\n'))
    setEditIsMandatory(template.is_mandatory ?? true)
    setEditEvidencePhoto(evidence.includes('photo'))
    setEditEvidenceChecklist(evidence.includes('checklist'))
    setEditComplianceFileUrl(template.compliance_file_url ?? '')
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
      const parsed = createTemplateSchema.safeParse({
        title,
        description: description || undefined,
        timeDue: timeDue || null,
        roleResponsible,
        priority,
        category,
        surgeryIds,
        checklistSteps,
        isMandatory,
        evidencePhoto,
        evidenceChecklist,
        complianceFileUrl: complianceFileUrl || '',
      })

      if (!parsed.success) {
        setError(parsed.error.issues[0]?.message ?? 'Invalid request')
        return
      }

      const res = await fetch('/api/templates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(parsed.data),
      })
      const body = await res.json()

      if (!res.ok) {
        setError(body.error ?? 'Failed to create template')
        return
      }

      setTitle('')
      setDescription('')
      setTimeDue('')
      setRoleResponsible('nurse')
      setPriority('medium')
      setCategory('general')
      setSurgeryIds([])
      setChecklistText('')
      setIsMandatory(true)
      setEvidencePhoto(false)
      setEvidenceChecklist(false)
      setComplianceFileUrl('')
      await loadData()
    } catch (err) {
      console.error('Create template failed:', err)
      setError('Something went wrong')
    } finally {
      setSaving(false)
    }
  }

  async function handleSaveEdit() {
    if (!editingTemplate) return
    setEditing(true)
    setEditError('')

    const checklistSteps = editChecklistText
      .split('\n')
      .map((line) => line.trim())
      .filter(Boolean)

    try {
      const parsed = updateTemplateSchema.safeParse({
        title: editTitle,
        description: editDescription || undefined,
        timeDue: editTimeDue || null,
        roleResponsible: editRoleResponsible,
        priority: editPriority,
        category: editCategory,
        surgeryIds: editSurgeryIds,
        checklistSteps,
        isMandatory: editIsMandatory,
        evidencePhoto: editEvidencePhoto,
        evidenceChecklist: editEvidenceChecklist,
        complianceFileUrl: editComplianceFileUrl || '',
      })

      if (!parsed.success) {
        setEditError(parsed.error.issues[0]?.message ?? 'Invalid request')
        return
      }

      const res = await fetch(`/api/templates/${editingTemplate.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(parsed.data),
      })
      const body = await res.json()
      if (!res.ok) {
        setEditError(body.error ?? 'Failed to update template')
        return
      }

      setEditingTemplate(null)
      await loadData()
    } catch (err) {
      console.error('Update template failed:', err)
      setEditError('Something went wrong')
    } finally {
      setEditing(false)
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

        <div className="space-y-1.5 md:col-span-2">
          <Label htmlFor="description">Description (optional)</Label>
          <textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            className="min-h-[96px] w-full rounded-lg border border-input bg-transparent px-3 py-2 text-sm"
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

        <div className="space-y-1.5">
          <Label>Priority</Label>
          <Select
            value={priority}
            onValueChange={(v) => v && setPriority(v as typeof priority)}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="low">Low</SelectItem>
              <SelectItem value="medium">Medium</SelectItem>
              <SelectItem value="high">High</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1.5">
          <Label>Category</Label>
          <Select value={category} onValueChange={(v) => v && setCategory(v)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {TASK_CATEGORIES.map((c) => (
                <SelectItem key={c} value={c}>
                  {categoryLabel(c)}
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

        <div className="space-y-2 md:col-span-2">
          <Label>Evidence required</Label>
          <div className="flex flex-wrap gap-4">
            <label className="flex items-center gap-2 text-sm">
              <Checkbox
                checked={evidencePhoto}
                onCheckedChange={(checked) => setEvidencePhoto(checked === true)}
              />
              Photo
            </label>
            <label className="flex items-center gap-2 text-sm">
              <Checkbox
                checked={evidenceChecklist}
                onCheckedChange={(checked) =>
                  setEvidenceChecklist(checked === true)
                }
              />
              Checklist
            </label>
          </div>
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
                      variant="outline"
                      size="sm"
                      className="mr-2 h-11"
                      onClick={() => openEdit(template)}
                    >
                      Edit
                    </Button>
                    <Button
                      type="button"
                      variant="destructive"
                      size="sm"
                      className="h-11"
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

      <Dialog
        open={!!editingTemplate}
        onOpenChange={(open) => !open && setEditingTemplate(null)}
      >
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>Edit template</DialogTitle>
          </DialogHeader>

          <div className="space-y-5">
            <div className="space-y-1.5">
              <Label htmlFor="edit-title">Title</Label>
              <Input
                id="edit-title"
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="edit-description">Description (optional)</Label>
              <textarea
                id="edit-description"
                value={editDescription}
                onChange={(e) => setEditDescription(e.target.value)}
                rows={3}
                className="min-h-[96px] w-full rounded-lg border border-input bg-transparent px-3 py-2 text-sm"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="edit-time-due">Time due</Label>
                <Input
                  id="edit-time-due"
                  type="time"
                  value={editTimeDue}
                  onChange={(e) => setEditTimeDue(e.target.value)}
                />
              </div>

              <div className="space-y-1.5">
                <Label>Role responsible</Label>
                <Select
                  value={editRoleResponsible}
                  onValueChange={(v) => v && setEditRoleResponsible(v)}
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
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Priority</Label>
                <Select
                  value={editPriority}
                  onValueChange={(v) =>
                    v && setEditPriority(v as typeof editPriority)
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label>Category</Label>
                <Select
                  value={editCategory}
                  onValueChange={(v) => v && setEditCategory(v)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {TASK_CATEGORIES.map((c) => (
                      <SelectItem key={c} value={c}>
                        {categoryLabel(c)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Surgeries</Label>
              <div className="flex flex-wrap gap-4">
                {surgeries.map((surgery) => (
                  <label
                    key={surgery.id}
                    className="flex items-center gap-2 text-sm"
                  >
                    <Checkbox
                      checked={editSurgeryIds.includes(surgery.id)}
                      onCheckedChange={(checked) =>
                        toggleEditSurgery(surgery.id, checked === true)
                      }
                    />
                    {surgery.name}
                  </label>
                ))}
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="edit-checklist">Checklist steps (one per line)</Label>
              <textarea
                id="edit-checklist"
                value={editChecklistText}
                onChange={(e) => setEditChecklistText(e.target.value)}
                rows={4}
                className="w-full rounded-lg border border-input bg-transparent px-3 py-2 text-sm"
              />
            </div>

            <div className="space-y-2">
              <Label>Evidence required</Label>
              <div className="flex flex-wrap gap-4">
                <label className="flex items-center gap-2 text-sm">
                  <Checkbox
                    checked={editEvidencePhoto}
                    onCheckedChange={(checked) =>
                      setEditEvidencePhoto(checked === true)
                    }
                  />
                  Photo
                </label>
                <label className="flex items-center gap-2 text-sm">
                  <Checkbox
                    checked={editEvidenceChecklist}
                    onCheckedChange={(checked) =>
                      setEditEvidenceChecklist(checked === true)
                    }
                  />
                  Checklist
                </label>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="edit-compliance-url">Compliance file URL</Label>
              <Input
                id="edit-compliance-url"
                type="url"
                value={editComplianceFileUrl}
                onChange={(e) => setEditComplianceFileUrl(e.target.value)}
                placeholder="https://…"
              />
            </div>

            <label className="flex items-center gap-2 text-sm">
              <Checkbox
                checked={editIsMandatory}
                onCheckedChange={(checked) => setEditIsMandatory(checked === true)}
              />
              Mandatory task
            </label>

            {editError ? (
              <p className="text-sm text-danger" role="alert">
                {editError}
              </p>
            ) : null}
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setEditingTemplate(null)}
              disabled={editing}
              className="h-11"
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleSaveEdit}
              disabled={editing}
              className="h-11 rounded-full"
            >
              {editing ? 'Saving…' : 'Save changes'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
