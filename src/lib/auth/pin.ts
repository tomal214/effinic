import bcrypt from 'bcryptjs'
import { PIN_LENGTH } from '@/lib/session/constants'

export function generatePin(): string {
  const min = 10 ** (PIN_LENGTH - 1)
  const max = 10 ** PIN_LENGTH - 1
  return String(Math.floor(min + Math.random() * (max - min + 1)))
}

export async function hashPin(pin: string): Promise<string> {
  return bcrypt.hash(pin, 10)
}

export async function verifyPin(pin: string, hash: string): Promise<boolean> {
  return bcrypt.compare(pin, hash)
}
