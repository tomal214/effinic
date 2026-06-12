export function isAuthorizedCronRequest(
  authorizationHeader: string | null | undefined,
  secret: string | undefined
) {
  if (!secret) return false
  return authorizationHeader === `Bearer ${secret}`
}
