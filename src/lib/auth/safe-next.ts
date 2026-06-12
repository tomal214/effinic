export function safeNext(next: string | null | undefined) {
  if (next?.startsWith('/') && !next.startsWith('//')) return next
  return '/app'
}
