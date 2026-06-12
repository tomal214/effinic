'use client'

import { use, useCallback, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Logo from '@/components/app/Logo'
import PinPad from '@/components/app/PinPad'
import StaffPicker, { type StaffMember } from '@/components/app/StaffPicker'
import { Button } from '@/components/ui/button'
import FetchErrorPanel from '@/components/app/FetchErrorPanel'
import { runDeferredEffect } from '@/lib/react/defer-effect'

type Step = 'staff' | 'pin' | 'surgery'

type Surgery = {
  id: string
  name: string
  sort_order: number
}

export default function NurseLoginPage({
  params,
}: {
  params: Promise<{ slug: string; token: string }>
}) {
  const { slug, token } = use(params)
  const router = useRouter()
  const [step, setStep] = useState<Step>('staff')
  const [staff, setStaff] = useState<StaffMember[]>([])
  const [selected, setSelected] = useState<StaffMember | null>(null)
  const [loadingStaff, setLoadingStaff] = useState(true)
  const [staffFetchError, setStaffFetchError] = useState('')
  const [verifying, setVerifying] = useState(false)
  const [pinError, setPinError] = useState<string | null>(null)
  const [surgeries, setSurgeries] = useState<Surgery[]>([])
  const [defaultSurgeryId, setDefaultSurgeryId] = useState<string | null>(null)
  const [selectedSurgeryId, setSelectedSurgeryId] = useState<string | null>(null)
  const [loadingSurgeries, setLoadingSurgeries] = useState(false)
  const [switching, setSwitching] = useState(false)

  const loadStaff = useCallback(async () => {
    setLoadingStaff(true)
    setStaffFetchError('')
    try {
      const res = await fetch('/api/auth/nurse/staff-list', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slug, token }),
      })
      if (!res.ok) {
        setStaff([])
        setStaffFetchError('Could not load staff. Check your connection and try again.')
        return
      }
      const json = await res.json()
      setStaff(json.data ?? [])
    } catch {
      setStaff([])
      setStaffFetchError('Could not load staff. Check your connection and try again.')
    } finally {
      setLoadingStaff(false)
    }
  }, [slug, token])

  useEffect(() => {
    runDeferredEffect(() => loadStaff())
  }, [loadStaff])

  const loadSurgeries = useCallback(async () => {
    setLoadingSurgeries(true)
    try {
      const res = await fetch('/api/surgeries')
      if (!res.ok) return
      const json = await res.json()
      setSurgeries(json.data?.surgeries ?? [])
      const defaultId = json.data?.defaultSurgeryId ?? null
      setDefaultSurgeryId(defaultId)
      setSelectedSurgeryId(defaultId)
    } finally {
      setLoadingSurgeries(false)
    }
  }, [])

  const handleStaffContinue = () => {
    if (!selected) return
    setPinError(null)
    setStep('pin')
  }

  const handlePinComplete = async (pin: string) => {
    if (!selected) return
    setVerifying(true)
    setPinError(null)
    try {
      const res = await fetch('/api/auth/nurse/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          slug,
          token,
          memberId: selected.id,
          pin,
        }),
      })
      const json = await res.json()
      if (!res.ok) {
        setPinError(json.error ?? 'Incorrect PIN')
        return
      }
      setStep('surgery')
      await loadSurgeries()
    } catch {
      setPinError('Something went wrong')
    } finally {
      setVerifying(false)
    }
  }

  const handleSurgeryConfirm = async () => {
    if (!selectedSurgeryId) return
    setSwitching(true)
    try {
      const res = await fetch('/api/auth/surgery/switch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ surgeryId: selectedSurgeryId }),
      })
      if (res.ok) {
        router.push('/app/tasks')
      }
    } finally {
      setSwitching(false)
    }
  }

  const stepTitle = {
    staff: 'Who are you?',
    pin: `Hi ${selected?.fullName?.split(' ')[0] ?? ''}`.trim(),
    surgery: 'Select your surgery',
  }

  return (
    <div className="flex min-h-full flex-col bg-background px-5 py-8">
      <div className="mx-auto flex w-full max-w-md flex-1 flex-col">
        <Logo className="mb-10" size="lg" />

        <h1 className="mb-2 text-xl font-semibold text-foreground">
          {stepTitle[step]}
        </h1>
        <p className="mb-8 text-sm text-muted-foreground">
          {step === 'staff' && 'Tap your name to sign in.'}
          {step === 'pin' && 'Enter your 4-digit PIN.'}
          {step === 'surgery' && 'Choose where you are working today.'}
        </p>

        {step === 'staff' && (
          <>
            {staffFetchError ? (
              <FetchErrorPanel message={staffFetchError} onRetry={loadStaff} />
            ) : null}
            <StaffPicker
              staff={staff}
              selectedId={selected?.id}
              onSelect={setSelected}
              loading={loadingStaff}
            />
            <div className="mt-auto pt-8">
              <Button
                className="h-12 w-full text-base"
                disabled={!selected}
                onClick={handleStaffContinue}
              >
                Continue
              </Button>
            </div>
          </>
        )}

        {step === 'pin' && (
          <div className="flex flex-1 flex-col items-center">
            <PinPad
              onComplete={handlePinComplete}
              disabled={verifying}
              error={pinError}
            />
            <Button
              variant="ghost"
              className="mt-8"
              onClick={() => {
                setStep('staff')
                setPinError(null)
              }}
            >
              Back
            </Button>
          </div>
        )}

        {step === 'surgery' && (
          <>
            {loadingSurgeries ? (
              <div className="flex flex-col gap-3">
                {[1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className="h-14 animate-pulse rounded-xl bg-muted"
                  />
                ))}
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                {surgeries.map((surgery) => (
                  <Button
                    key={surgery.id}
                    type="button"
                    variant={
                      selectedSurgeryId === surgery.id ? 'default' : 'outline'
                    }
                    className="h-14 justify-start px-5 text-base"
                    onClick={() => setSelectedSurgeryId(surgery.id)}
                  >
                    {surgery.name}
                    {defaultSurgeryId === surgery.id && (
                      <span className="ml-auto text-xs opacity-70">
                        Rota
                      </span>
                    )}
                  </Button>
                ))}
              </div>
            )}
            <div className="mt-auto flex flex-col gap-3 pt-8">
              <Button
                className="h-12 w-full text-base"
                disabled={!selectedSurgeryId || switching}
                onClick={handleSurgeryConfirm}
              >
                {switching ? 'Starting…' : 'Start shift'}
              </Button>
              <Button variant="ghost" onClick={() => setStep('pin')}>
                Back
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
