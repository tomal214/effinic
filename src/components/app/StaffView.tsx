'use client'

import { useCallback, useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
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
import { Badge } from '@/components/ui/badge'
import FetchErrorPanel from '@/components/app/FetchErrorPanel'
import { runDeferredEffect } from '@/lib/react/defer-effect'
import { updateStaffSchema } from '@/lib/validation/staff'

type StaffMember = {
  id: string
  fullName: string
  email: string | null
  role: string
  isActive: boolean
}

type PracticeInfo = {
  slug: string
  practiceUrl: string
}

const ROLES = [
  'admin',
  'manager',
  'nurse',
  'receptionist',
  'dentist',
  'hygienist',
  'viewer',
]

export default function StaffView({
  readOnly = false,
  initialData,
}: {
  readOnly?: boolean
  initialData?: { staff: StaffMember[]; practice: PracticeInfo | null }
}) {
  const [staff, setStaff] = useState<StaffMember[]>(initialData?.staff ?? [])
  const [practiceInfo, setPracticeInfo] = useState<PracticeInfo | null>(
    initialData?.practice ?? null
  )
  const [siteOrigin, setSiteOrigin] = useState('')
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [role, setRole] = useState('nurse')
  const [newPin, setNewPin] = useState<string | null>(null)
  const [loading, setLoading] = useState(!initialData)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [fetchError, setFetchError] = useState('')
  const [editingMember, setEditingMember] = useState<StaffMember | null>(null)
  const [editFullName, setEditFullName] = useState('')
  const [editRole, setEditRole] = useState('nurse')
  const [editIsActive, setEditIsActive] = useState(true)
  const [editing, setEditing] = useState(false)
  const [editError, setEditError] = useState('')

  const loadStaff = useCallback(async () => {
    setLoading(true)
    setFetchError('')
    try {
      const res = await fetch('/api/staff')
      if (!res.ok) {
        setFetchError('Could not load staff. Check your connection and try again.')
        return
      }
      const { data } = await res.json()
      setStaff(data.staff ?? [])
      setPracticeInfo(data.practice ?? null)
    } catch (err) {
      console.error('Failed to load staff:', err)
      setFetchError('Could not load staff. Check your connection and try again.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    setSiteOrigin(window.location.origin)
  }, [])

  useEffect(() => {
    if (initialData) return
    runDeferredEffect(() => loadStaff())
  }, [loadStaff, initialData])

  async function handleCreate(event: React.FormEvent) {
    event.preventDefault()
    setSaving(true)
    setError('')
    setNewPin(null)

    try {
      const res = await fetch('/api/staff', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fullName, role, email: email || undefined }),
      })
      const body = await res.json()

      if (!res.ok) {
        setError(body.error ?? 'Failed to create staff')
        return
      }

      setNewPin(body.data.pin)
      setFullName('')
      setEmail('')
      setRole('nurse')
      await loadStaff()
    } catch (err) {
      console.error('Create staff failed:', err)
      setError('Something went wrong')
    } finally {
      setSaving(false)
    }
  }

  async function handleResetPin(memberId: string) {
    const res = await fetch(`/api/staff/${memberId}/reset-pin`, {
      method: 'POST',
    })
    const body = await res.json()

    if (res.ok) {
      setNewPin(body.data.pin)
    } else {
      setError(body.error ?? 'Failed to reset PIN')
    }
  }

  async function handleDeactivate(memberId: string) {
    const res = await fetch(`/api/staff/${memberId}`, { method: 'DELETE' })
    if (res.ok) await loadStaff()
  }

  function openEdit(member: StaffMember) {
    setEditError('')
    setEditingMember(member)
    setEditFullName(member.fullName ?? '')
    setEditRole(member.role ?? 'nurse')
    setEditIsActive(member.isActive ?? true)
  }

  async function handleSaveEdit() {
    if (!editingMember) return
    setEditing(true)
    setEditError('')

    try {
      const parsed = updateStaffSchema.safeParse({
        fullName: editFullName,
        role: editRole,
        isActive: editIsActive,
      })

      if (!parsed.success) {
        setEditError(parsed.error.issues[0]?.message ?? 'Invalid request')
        return
      }

      const res = await fetch(`/api/staff/${editingMember.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(parsed.data),
      })
      const body = await res.json()

      if (!res.ok) {
        setEditError(body.error ?? 'Failed to update staff')
        return
      }

      setEditingMember(null)
      await loadStaff()
    } catch (err) {
      console.error('Update staff failed:', err)
      setEditError('Something went wrong')
    } finally {
      setEditing(false)
    }
  }

  const colSpan = readOnly ? 4 : 5

  return (
    <div className="flex flex-1 flex-col gap-8 px-5 py-6 md:px-8">
      <div>
        <h1 className="text-2xl font-semibold">Staff</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {readOnly
            ? 'View practice members.'
            : 'Manage practice members and PIN access.'}
        </p>
      </div>

      {practiceInfo ? (
        <div className="rounded-lg border border-border bg-muted/50 px-4 py-3 text-sm">
          <p>
            <span className="font-medium">Practice slug:</span>{' '}
            <span className="font-mono text-muted-foreground">{practiceInfo.slug}</span>
          </p>
          <p className="mt-2">
            <span className="font-medium">Nurse kiosk URL:</span>{' '}
            <span className="break-all font-mono text-muted-foreground">
              {siteOrigin}
              {practiceInfo.practiceUrl}
            </span>
          </p>
        </div>
      ) : null}

      {fetchError ? (
        <FetchErrorPanel message={fetchError} onRetry={loadStaff} />
      ) : null}

      {!readOnly && (
        <form
          onSubmit={handleCreate}
          className="grid gap-4 rounded-lg border border-border p-5 md:grid-cols-2"
        >
          <div className="space-y-1.5">
            <Label htmlFor="fullName">Full name</Label>
            <Input
              id="fullName"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              required
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="email">Email (optional)</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label>Role</Label>
            <Select value={role} onValueChange={(v) => v && setRole(v)}>
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
          <div className="flex items-end">
            <Button type="submit" disabled={saving} className="rounded-full">
              {saving ? 'Adding…' : 'Add staff member'}
            </Button>
          </div>
          {error && <p className="text-sm text-danger md:col-span-2">{error}</p>}
          {newPin && (
            <p className="rounded-lg border border-warning/40 bg-warning/10 px-4 py-3 text-sm md:col-span-2">
              New PIN (shown once):{' '}
              <strong className="tabular-nums">{newPin}</strong>
            </p>
          )}
        </form>
      )}

      <div className="overflow-x-auto rounded-lg border border-border">
        <Table>
          <caption className="sr-only">Practice staff members</caption>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Status</TableHead>
              {!readOnly && (
                <TableHead className="text-right">Actions</TableHead>
              )}
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={colSpan} className="text-muted-foreground" role="status">
                  Loading staff…
                </TableCell>
              </TableRow>
            ) : staff.length === 0 ? (
              <TableRow>
                <TableCell colSpan={colSpan} className="text-muted-foreground">
                  No staff yet.
                </TableCell>
              </TableRow>
            ) : (
              staff.map((member) => (
                <TableRow key={member.id}>
                  <TableCell className="font-medium">{member.fullName}</TableCell>
                  <TableCell>{member.role}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {member.email ?? '—'}
                  </TableCell>
                  <TableCell>
                    <Badge variant={member.isActive ? 'default' : 'secondary'}>
                      {member.isActive ? 'Active' : 'Inactive'}
                    </Badge>
                  </TableCell>
                  {!readOnly && (
                    <TableCell className="space-x-2 text-right">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="h-11"
                        onClick={() => openEdit(member)}
                      >
                        Edit
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="h-11"
                        onClick={() => handleResetPin(member.id)}
                        disabled={!member.isActive}
                      >
                        Reset PIN
                      </Button>
                      <Button
                        type="button"
                        variant="destructive"
                        size="sm"
                        className="h-11"
                        onClick={() => handleDeactivate(member.id)}
                        disabled={!member.isActive}
                      >
                        Deactivate
                      </Button>
                    </TableCell>
                  )}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog
        open={!!editingMember}
        onOpenChange={(open) => !open && setEditingMember(null)}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit staff member</DialogTitle>
          </DialogHeader>

          <div className="space-y-5">
            <div className="space-y-1.5">
              <Label htmlFor="edit-full-name">Full name</Label>
              <Input
                id="edit-full-name"
                value={editFullName}
                onChange={(e) => setEditFullName(e.target.value)}
              />
            </div>

            <div className="space-y-1.5">
              <Label>Role</Label>
              <Select value={editRole} onValueChange={(v) => v && setEditRole(v)}>
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

            <label className="flex items-center gap-2 text-sm">
              <Checkbox
                checked={editIsActive}
                onCheckedChange={(checked) => setEditIsActive(checked === true)}
              />
              Active
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
              onClick={() => setEditingMember(null)}
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
