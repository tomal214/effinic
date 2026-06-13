import type { LucideIcon } from 'lucide-react'
import {
  AlertTriangle,
  BarChart3,
  Building2,
  CalendarDays,
  ClipboardList,
  FileText,
  History,
  LayoutDashboard,
  Users,
} from 'lucide-react'
import type { MemberRole } from '@/lib/auth/member'

export type AppNavItem = {
  href: string
  label: string
  icon: LucideIcon
  match?: 'exact' | 'prefix'
  mobileTab?: boolean
}

export type AppNavConfig = {
  primary: AppNavItem[]
  secondary: AppNavItem[]
}

function isNavActive(pathname: string, item: AppNavItem) {
  if (item.href === '/app') {
    return pathname === '/app'
  }

  if (item.match === 'exact') {
    return pathname === item.href
  }

  return pathname === item.href || pathname.startsWith(`${item.href}/`)
}

export function getActiveNavLabel(
  pathname: string,
  items: AppNavItem[]
): string | null {
  const match = items.find((item) => isNavActive(pathname, item))
  return match?.label ?? null
}

export function isAnyNavActive(pathname: string, items: AppNavItem[]) {
  return items.some((item) => isNavActive(pathname, item))
}

export { isNavActive }

export function getNavConfig(role: MemberRole): AppNavConfig {
  if (role === 'nurse' || role === 'receptionist') {
    return {
      primary: [
        {
          href: '/app/tasks',
          label: 'Tasks',
          icon: ClipboardList,
          match: 'exact',
          mobileTab: true,
        },
        {
          href: '/app/incidents',
          label: 'Incidents',
          icon: AlertTriangle,
          mobileTab: true,
        },
      ],
      secondary: [],
    }
  }

  if (role === 'dentist' || role === 'hygienist') {
    return {
      primary: [
        {
          href: '/app',
          label: 'Dashboard',
          icon: LayoutDashboard,
          mobileTab: true,
        },
        {
          href: '/app/incidents',
          label: 'Incidents',
          icon: AlertTriangle,
          mobileTab: true,
        },
      ],
      secondary: [],
    }
  }

  return {
    primary: [
      {
        href: '/app',
        label: 'Dashboard',
        icon: LayoutDashboard,
        mobileTab: true,
      },
      {
        href: '/app/tasks',
        label: 'Tasks',
        icon: ClipboardList,
        match: 'exact',
        mobileTab: true,
      },
      {
        href: '/app/incidents',
        label: 'Incidents',
        icon: AlertTriangle,
        mobileTab: true,
      },
    ],
    secondary: [
      { href: '/app/staff', label: 'Staff', icon: Users },
      { href: '/app/surgeries', label: 'Surgeries', icon: Building2 },
      { href: '/app/templates', label: 'Templates', icon: FileText },
      { href: '/app/tasks/history', label: 'History', icon: History },
      { href: '/app/rota', label: 'Rota', icon: CalendarDays },
      { href: '/app/reports', label: 'Reports', icon: BarChart3 },
    ],
  }
}

export function getAllNavItems(config: AppNavConfig) {
  return [...config.primary, ...config.secondary]
}

export function getHomeHref(role: MemberRole) {
  if (role === 'nurse' || role === 'receptionist') {
    return '/app/tasks'
  }

  return '/app'
}
