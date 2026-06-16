export type EvidenceKind = 'photo' | 'checklist'

export function parseEvidenceRequired(raw: string | null | undefined): EvidenceKind[] {
  if (!raw) return []
  return raw
    .split(',')
    .map((s) => s.trim().toLowerCase())
    .filter((s): s is EvidenceKind => s === 'photo' || s === 'checklist')
}

export function evidenceSatisfied(
  required: EvidenceKind[],
  state: { checklistComplete: boolean; photoCount: number }
) {
  if (required.includes('checklist') && !state.checklistComplete) return false
  if (required.includes('photo') && state.photoCount < 1) return false
  return true
}

export function evidenceLabel(required: EvidenceKind[]) {
  if (!required.length) return null
  const parts: string[] = []
  if (required.includes('photo')) parts.push('Photo')
  if (required.includes('checklist')) parts.push('Checklist')
  return parts.join(', ')
}

export function formatEvidenceRequired(photo?: boolean, checklist?: boolean): string | null {
  const parts: string[] = []
  if (photo) parts.push('photo')
  if (checklist) parts.push('checklist')
  return parts.length ? parts.join(', ') : null
}
