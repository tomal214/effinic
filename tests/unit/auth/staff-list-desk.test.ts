import { describe, expect, it } from 'vitest'
import { filterStaffByDesk } from '@/lib/auth/kiosk-desk'

const staff = [
  { id: '1', fullName: 'Alice', role: 'nurse' },
  { id: '2', fullName: 'Bob', role: 'receptionist' },
  { id: '3', fullName: 'Carol', role: 'manager' },
]

describe('filterStaffByDesk', () => {
  it('returns all staff when desk is omitted', () => {
    expect(filterStaffByDesk(staff)).toHaveLength(3)
  })

  it('filters to nurses only for clinical desk', () => {
    const result = filterStaffByDesk(staff, 'clinical')
    expect(result).toHaveLength(1)
    expect(result[0].role).toBe('nurse')
  })

  it('filters to receptionists only for reception desk', () => {
    const result = filterStaffByDesk(staff, 'reception')
    expect(result).toHaveLength(1)
    expect(result[0].role).toBe('receptionist')
  })
})
