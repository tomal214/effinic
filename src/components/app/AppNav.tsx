'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import Logo from '@/components/app/Logo'
import type { MemberRole } from '@/lib/auth/member'

type NavItem = {
  href: string
  label: string
}

function getNavItems(role: MemberRole): NavItem[] {
  if (role === 'nurse' || role === 'receptionist') {
    return [
      { href: '/app/tasks', label: 'Tasks' },
      { href: '/app/incidents', label: 'Incidents' },
    ]
  }

  if (role === 'dentist' || role === 'hygienist') {
    return [
      { href: '/app', label: 'Dashboard' },
      { href: '/app/incidents', label: 'Incidents' },
    ]
  }

  const managerItems: NavItem[] = [
    { href: '/app', label: 'Dashboard' },
    { href: '/app/staff', label: 'Staff' },
    { href: '/app/surgeries', label: 'Surgeries' },
    { href: '/app/templates', label: 'Templates' },
    { href: '/app/tasks', label: 'Tasks' },
    { href: '/app/tasks/history', label: 'History' },
    { href: '/app/incidents', label: 'Incidents' },
    { href: '/app/rota', label: 'Rota' },
    { href: '/app/reports', label: 'Reports' },
  ]

  return managerItems
}

export default function AppNav({
  role,
  readOnly,
  headerExtra,
}: {
  role: MemberRole
  readOnly?: boolean
  headerExtra?: React.ReactNode
}) {
  const pathname = usePathname()
  const items = getNavItems(role)

  return (
    <header className="border-b border-border bg-background">
      <div className="mx-auto flex max-w-5xl flex-col gap-3 px-5 py-4 md:px-8">
        <div className="flex items-center justify-between gap-4">
          <Link href={role === 'nurse' || role === 'receptionist' ? '/app/tasks' : '/app'}>
            <Logo size="sm" />
          </Link>
          <div className="flex items-center gap-3">
            {readOnly && (
              <span className="rounded-full bg-muted px-3 py-1 text-xs font-medium text-muted-foreground">
                View only
              </span>
            )}
            {headerExtra}
          </div>
        </div>
        <nav className="flex gap-1 overflow-x-auto pb-1">
          {items.map((item) => {
            const active =
              item.href === '/app'
                ? pathname === '/app'
                : pathname.startsWith(item.href)

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'shrink-0 rounded-full px-4 py-2 text-sm font-medium transition-colors',
                  active
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                )}
              >
                {item.label}
              </Link>
            )
          })}
        </nav>
      </div>
    </header>
  )
}
