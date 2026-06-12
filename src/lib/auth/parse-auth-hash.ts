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

export function parseHashSession(hash: string) {
  if (!hash || hash === '#') return null

  const params = new URLSearchParams(hash.replace(/^#/, ''))
  const access_token = params.get('access_token')
  const refresh_token = params.get('refresh_token')

  if (!access_token || !refresh_token) return null
  return { access_token, refresh_token }
}

export function clearUrlHash() {
  if (!window.location.hash) return
  window.history.replaceState(
    null,
    '',
    window.location.pathname + window.location.search
  )
}

export async function unregisterServiceWorkers() {
  if (!('serviceWorker' in navigator)) return
  const registrations = await navigator.serviceWorker.getRegistrations()
  await Promise.all(registrations.map((registration) => registration.unregister()))
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
