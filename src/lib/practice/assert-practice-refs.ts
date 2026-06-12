export type PracticeRefAdmin = {
  from: (table: string) => {
    select: (columns: string) => {
      eq: (column: string, value: string) => {
        eq: (column: string, value: string) => {
          eq: (column: string, value: boolean) => {
            maybeSingle: () => Promise<{ data: { id: string } | null }>
          }
        }
      }
    }
  }
}

export async function assertUserInPractice(
  admin: PracticeRefAdmin,
  practiceId: string,
  userId: string
) {
  const { data } = await admin
    .from('practice_members')
    .select('id')
    .eq('practice_id', practiceId)
    .eq('user_id', userId)
    .eq('is_active', true)
    .maybeSingle()

  if (!data) return { ok: false as const, code: 'invalid_user' as const }
  return { ok: true as const }
}

export async function assertSurgeryInPractice(
  admin: PracticeRefAdmin,
  practiceId: string,
  surgeryId: string
) {
  const { data } = await admin
    .from('surgeries')
    .select('id')
    .eq('practice_id', practiceId)
    .eq('id', surgeryId)
    .eq('is_active', true)
    .maybeSingle()

  if (!data) return { ok: false as const, code: 'invalid_surgery' as const }
  return { ok: true as const }
}
