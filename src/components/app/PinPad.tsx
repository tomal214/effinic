'use client'

import { useState } from 'react'
import { Delete } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { PIN_LENGTH } from '@/lib/session/constants'
import { cn } from '@/lib/utils'

export default function PinPad({
  onComplete,
  disabled,
  error,
}: {
  onComplete: (pin: string) => void
  disabled?: boolean
  error?: string | null
}) {
  const [pin, setPin] = useState('')

  const addDigit = (digit: string) => {
    if (disabled || pin.length >= PIN_LENGTH) return
    const next = pin + digit
    setPin(next)
    if (next.length === PIN_LENGTH) {
      onComplete(next)
    }
  }

  const removeDigit = () => {
    if (disabled) return
    setPin((value) => value.slice(0, -1))
  }

  const clear = () => {
    if (disabled) return
    setPin('')
  }

  const digits = ['1', '2', '3', '4', '5', '6', '7', '8', '9', 'clear', '0', 'back']

  return (
    <div className="flex w-full max-w-xs flex-col items-center gap-6">
      <div className="flex gap-3" aria-label="PIN entry progress">
        {Array.from({ length: PIN_LENGTH }).map((_, i) => (
          <span
            key={i}
            className={cn(
              'size-3 rounded-full border-2 border-primary transition-colors',
              i < pin.length && 'bg-primary'
            )}
          />
        ))}
      </div>

      {error && (
        <p className="text-center text-sm text-destructive" role="alert">
          {error}
        </p>
      )}

      <div className="grid w-full grid-cols-3 gap-3">
        {digits.map((key) => {
          if (key === 'clear') {
            return (
              <Button
                key={key}
                type="button"
                variant="ghost"
                className="h-14 text-base"
                disabled={disabled}
                onClick={clear}
              >
                Clear
              </Button>
            )
          }
          if (key === 'back') {
            return (
              <Button
                key={key}
                type="button"
                variant="ghost"
                className="h-14"
                disabled={disabled}
                onClick={removeDigit}
                aria-label="Delete digit"
              >
                <Delete className="size-5" />
              </Button>
            )
          }
          return (
            <Button
              key={key}
              type="button"
              variant="outline"
              className="h-14 text-xl font-medium"
              disabled={disabled}
              onClick={() => addDigit(key)}
            >
              {key}
            </Button>
          )
        })}
      </div>
    </div>
  )
}
