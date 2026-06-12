export function parseAuthHash(hash: string) {
  if (!hash || hash === '#') {
    return { type: null, hasAccessToken: false }
  }

  const params = new URLSearchParams(hash.replace(/^#/, ''))
  return {
    type: params.get('type'),
    hasAccessToken: Boolean(params.get('access_token')),
  }
}

export function needsPasswordSetup(
  hash: string,
  options?: { inviteQuery?: boolean }
) {
  if (options?.inviteQuery) return true

  const { type, hasAccessToken } = parseAuthHash(hash)
  if (type === 'magiclink') return false
  if (type === 'invite' || type === 'signup' || type === 'recovery') return true
  if (hasAccessToken) return true
  return false
}
