export function isPlatformAdmin(email: string | undefined): boolean {
  const allow =
    process.env.PLATFORM_ADMIN_EMAILS?.split(',').map((e) => e.trim()) ?? []
  return !!email && allow.includes(email)
}
