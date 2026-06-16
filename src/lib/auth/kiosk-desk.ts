export type KioskDesk = 'clinical' | 'reception'

const CLINICAL_ROLES = new Set(['nurse'])
const RECEPTION_ROLES = new Set(['receptionist'])

export function filterStaffByDesk<T extends { role: string }>(
  staff: T[],
  desk?: KioskDesk
) {
  if (!desk) return staff
  const allowed = desk === 'reception' ? RECEPTION_ROLES : CLINICAL_ROLES
  return staff.filter((s) => allowed.has(s.role))
}
