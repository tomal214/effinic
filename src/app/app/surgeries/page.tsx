'use client'

import { useCallback, useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'

type Surgery = {
  id: string
  name: string
  is_active: boolean
  sort_order: number
}

export default function SurgeriesPage() {
  const [surgeries, setSurgeries] = useState<Surgery[]>([])
  const [name, setName] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const loadSurgeries = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/surgeries')
      if (res.ok) {
        const { data } = await res.json()
        setSurgeries(data.surgeries ?? [])
      }
    } catch (err) {
      console.error('Failed to load surgeries:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadSurgeries()
  }, [loadSurgeries])

  async function handleCreate(event: React.FormEvent) {
    event.preventDefault()
    setSaving(true)
    setError('')

    try {
      const res = await fetch('/api/surgeries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name }),
      })
      const body = await res.json()

      if (!res.ok) {
        setError(body.error ?? 'Failed to create surgery')
        return
      }

      setName('')
      await loadSurgeries()
    } catch (err) {
      console.error('Create surgery failed:', err)
      setError('Something went wrong')
    } finally {
      setSaving(false)
    }
  }

  async function handleToggleActive(surgery: Surgery) {
    const res = await fetch(`/api/surgeries/${surgery.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isActive: !surgery.is_active }),
    })

    if (res.ok) await loadSurgeries()
  }

  async function handleDelete(surgeryId: string) {
    const res = await fetch(`/api/surgeries/${surgeryId}`, {
      method: 'DELETE',
    })

    if (res.ok) await loadSurgeries()
  }

  return (
    <div className="flex flex-1 flex-col gap-8 px-5 py-6 md:px-8">
      <div>
        <h1 className="text-2xl font-semibold">Surgeries</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Configure treatment rooms and surgery areas.
        </p>
      </div>

      <form
        onSubmit={handleCreate}
        className="flex flex-col gap-4 rounded-lg border border-border p-5 sm:flex-row sm:items-end"
      >
        <div className="flex-1 space-y-1.5">
          <Label htmlFor="surgery-name">Surgery name</Label>
          <Input
            id="surgery-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
        </div>
        <Button type="submit" disabled={saving} className="rounded-full">
          {saving ? 'Adding…' : 'Add surgery'}
        </Button>
        {error && <p className="text-sm text-danger sm:basis-full">{error}</p>}
      </form>

      <div className="overflow-x-auto rounded-lg border border-border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Order</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={4} className="text-muted-foreground">
                  Loading…
                </TableCell>
              </TableRow>
            ) : surgeries.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="text-muted-foreground">
                  No surgeries yet.
                </TableCell>
              </TableRow>
            ) : (
              surgeries.map((surgery) => (
                <TableRow key={surgery.id}>
                  <TableCell className="font-medium">{surgery.name}</TableCell>
                  <TableCell>{surgery.sort_order}</TableCell>
                  <TableCell>
                    <Badge variant={surgery.is_active ? 'default' : 'secondary'}>
                      {surgery.is_active ? 'Active' : 'Inactive'}
                    </Badge>
                  </TableCell>
                  <TableCell className="space-x-2 text-right">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => handleToggleActive(surgery)}
                    >
                      {surgery.is_active ? 'Deactivate' : 'Activate'}
                    </Button>
                    <Button
                      type="button"
                      variant="destructive"
                      size="sm"
                      onClick={() => handleDelete(surgery.id)}
                    >
                      Delete
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
