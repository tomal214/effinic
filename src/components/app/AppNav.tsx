'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutGrid } from 'lucide-react'
import { cn } from '@/lib/utils'
import Logo from '@/components/app/Logo'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import type { MemberRole } from '@/lib/auth/member'
import {
  getAllNavItems,
  getHomeHref,
  getNavConfig,
  getActiveNavLabel,
  isAnyNavActive,
  isNavActive,
  type AppNavItem,
} from '@/lib/app/nav-items'

function NavLink({
  item,
  pathname,
  variant,
  onNavigate,
}: {
  item: AppNavItem
  pathname: string
  variant: 'sidebar' | 'sheet'
  onNavigate?: () => void
}) {
  const active = isNavActive(pathname, item)
  const Icon = item.icon

  return (
    <Link
      href={item.href}
      onClick={onNavigate}
      aria-current={active ? 'page' : undefined}
      className={cn(
        'flex min-h-11 items-center gap-3 rounded-lg px-3 text-sm font-medium transition-colors duration-150',
        variant === 'sidebar' && 'py-2.5',
        variant === 'sheet' && 'py-3',
        active
          ? 'bg-primary/10 text-primary'
          : 'text-muted-foreground hover:bg-muted hover:text-foreground'
      )}
    >
      <Icon className="size-5 shrink-0" aria-hidden />
      <span>{item.label}</span>
    </Link>
  )
}

function MobileTab({
  item,
  pathname,
}: {
  item: AppNavItem
  pathname: string
}) {
  const active = isNavActive(pathname, item)
  const Icon = item.icon

  return (
    <Link
      href={item.href}
      aria-current={active ? 'page' : undefined}
      className={cn(
        'flex min-h-11 min-w-0 flex-1 flex-col items-center justify-center gap-0.5 px-1 pt-2 text-[11px] font-medium transition-colors duration-150',
        active ? 'text-primary' : 'text-muted-foreground'
      )}
    >
      <Icon className="size-5 shrink-0" aria-hidden />
      <span className="truncate">{item.label}</span>
    </Link>
  )
}

function MobileMoreTab({
  active,
  onOpen,
}: {
  active: boolean
  onOpen: () => void
}) {
  return (
    <button
      type="button"
      aria-current={active ? 'page' : undefined}
      aria-haspopup="dialog"
      onClick={onOpen}
      className={cn(
        'flex min-h-11 min-w-0 flex-1 flex-col items-center justify-center gap-0.5 px-1 pt-2 text-[11px] font-medium transition-colors duration-150',
        active ? 'text-primary' : 'text-muted-foreground'
      )}
    >
      <LayoutGrid className="size-5 shrink-0" aria-hidden />
      <span>More</span>
    </button>
  )
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
  const config = getNavConfig(role)
  const allItems = getAllNavItems(config)
  const homeHref = getHomeHref(role)
  const pageTitle = getActiveNavLabel(pathname, allItems)
  const mobileTabs = config.primary.filter((item) => item.mobileTab)
  const hasMore = config.secondary.length > 0
  const moreActive = isAnyNavActive(pathname, config.secondary)

  return (
    <>
      <aside className="hidden w-56 shrink-0 border-r border-border bg-panel md:flex md:flex-col">
        <div className="border-b border-border px-5 py-4">
          <Link href={homeHref}>
            <Logo size="sm" />
          </Link>
        </div>
        <nav className="flex flex-1 flex-col gap-1 overflow-y-auto p-3">
          <p className="px-3 pb-1 text-xs font-medium uppercase tracking-wide text-faint">
            Menu
          </p>
          {config.primary.map((item) => (
            <NavLink
              key={item.href}
              item={item}
              pathname={pathname}
              variant="sidebar"
            />
          ))}
          {hasMore && (
            <>
              <p className="mt-4 px-3 pb-1 text-xs font-medium uppercase tracking-wide text-faint">
                Manage
              </p>
              {config.secondary.map((item) => (
                <NavLink
                  key={item.href}
                  item={item}
                  pathname={pathname}
                  variant="sidebar"
                />
              ))}
            </>
          )}
        </nav>
        {readOnly && (
          <div className="border-t border-border px-5 py-4">
            <span className="rounded-full bg-muted px-3 py-1 text-xs font-medium text-muted-foreground">
              View only
            </span>
          </div>
        )}
      </aside>

      <header className="sticky top-0 z-40 border-b border-border bg-background/95 backdrop-blur-sm md:hidden">
        <div className="flex items-center justify-between gap-3 px-5 py-3">
          <div className="min-w-0">
            <Link href={homeHref}>
              <Logo size="sm" />
            </Link>
            {pageTitle && (
              <p className="mt-0.5 truncate text-sm font-medium text-foreground">
                {pageTitle}
              </p>
            )}
          </div>
          <div className="flex shrink-0 items-center gap-2">
            {readOnly && (
              <span className="rounded-full bg-muted px-2.5 py-1 text-[11px] font-medium text-muted-foreground">
                View only
              </span>
            )}
            {headerExtra}
          </div>
        </div>
      </header>

      <nav
        aria-label="Main navigation"
        className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-surface pb-[env(safe-area-inset-bottom,0px)] md:hidden"
      >
        <div className="mx-auto flex max-w-lg items-stretch justify-around">
          {mobileTabs.map((item) => (
            <MobileTab key={item.href} item={item} pathname={pathname} />
          ))}
          {hasMore && (
            <MobileMoreSheet
              active={moreActive}
              items={config.secondary}
              pathname={pathname}
            />
          )}
        </div>
      </nav>
    </>
  )
}

function MobileMoreSheet({
  active,
  items,
  pathname,
}: {
  active: boolean
  items: AppNavItem[]
  pathname: string
}) {
  const [open, setOpen] = useState(false)

  return (
    <>
      <MobileMoreTab active={active} onOpen={() => setOpen(true)} />
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent
          side="bottom"
          showCloseButton
          className="rounded-t-2xl pb-[max(1rem,env(safe-area-inset-bottom))]"
        >
          <SheetHeader className="text-left">
            <SheetTitle>More</SheetTitle>
          </SheetHeader>
          <nav className="flex flex-col gap-1 px-1">
            {items.map((item) => (
              <NavLink
                key={item.href}
                item={item}
                pathname={pathname}
                variant="sheet"
                onNavigate={() => setOpen(false)}
              />
            ))}
          </nav>
        </SheetContent>
      </Sheet>
    </>
  )
}
