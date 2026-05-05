'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Sun, CalendarDays, ShoppingCart, BookOpen, Settings } from 'lucide-react'
import { cn } from '@/lib/utils'
import ProfileSwitcher from './ProfileSwitcher'

const navItems = [
  { href: '/',         icon: Sun,          label: 'Oggi'   },
  { href: '/plan',     icon: CalendarDays, label: 'Piano'  },
  { href: '/shopping', icon: ShoppingCart, label: 'Spesa'  },
  { href: '/diary',    icon: BookOpen,     label: 'Diario' },
]

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()

  return (
    <div className="relative min-h-dvh flex flex-col" style={{ background: 'var(--color-cream)' }}>

      {/* ── Top bar ─────────────────────────────────────────────────────── */}
      <header className="sticky top-0 z-40 safe-top">
        <div className="bottom-nav-blur px-5 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            {/* Orange geometric accent */}
            <div className="flex items-end gap-[3px]">
              <span className="block w-[3px] h-4 rounded-full" style={{ background: 'var(--color-orange)' }} />
              <span className="block w-[3px] h-6 rounded-full" style={{ background: 'var(--color-orange)' }} />
              <span className="block w-[3px] h-3 rounded-full" style={{ background: 'var(--color-orange)' }} />
            </div>
            <div>
              <h1 className="heading-display text-[22px]" style={{ color: 'var(--color-ink)' }}>
                Piano Piano
              </h1>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <ProfileSwitcher compact />
            <Link
              href="/settings"
              className={cn(
                'w-9 h-9 flex items-center justify-center rounded-2xl transition-all duration-200',
                pathname === '/settings'
                  ? 'text-[--color-orange]'
                  : 'text-[--color-ink-light] hover:text-[--color-ink]'
              )}
              style={pathname === '/settings' ? { color: 'var(--color-orange)' } : { color: 'var(--color-ink-light)' }}
            >
              <Settings className="w-[18px] h-[18px]" />
            </Link>
          </div>
        </div>
      </header>

      {/* ── Main content ────────────────────────────────────────────────── */}
      <main
        className="flex-1 overflow-y-auto"
        style={{ paddingBottom: 'calc(80px + env(safe-area-inset-bottom, 16px))' }}
      >
        {children}
      </main>

      {/* ── Bottom Navigation ────────────────────────────────────────────── */}
      <nav
        className="fixed bottom-0 inset-x-0 z-50 bottom-nav-blur"
        style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
      >
        <div className="flex items-stretch h-[68px] px-2">
          {navItems.map(({ href, icon: Icon, label }) => {
            const isActive = href === '/' ? pathname === '/' : pathname.startsWith(href)
            return (
              <Link
                key={href}
                href={href}
                className="flex-1 flex flex-col items-center justify-center gap-1 relative transition-all duration-200"
              >
                {/* Active indicator */}
                {isActive && (
                  <span
                    className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-0.5 rounded-full"
                    style={{ background: 'var(--color-orange)' }}
                  />
                )}

                <div
                  className={cn(
                    'w-10 h-7 flex items-center justify-center rounded-xl transition-all duration-200',
                    isActive ? 'scale-105' : ''
                  )}
                  style={isActive ? { background: 'var(--color-orange-pale)' } : {}}
                >
                  <Icon
                    className="w-[18px] h-[18px] transition-all duration-200"
                    style={{ color: isActive ? 'var(--color-orange)' : 'var(--color-ink-light)' }}
                  />
                </div>
                <span
                  className="text-[10px] font-bold tracking-wide transition-all duration-200"
                  style={{
                    color: isActive ? 'var(--color-orange)' : 'var(--color-ink-faint)',
                    fontFamily: 'var(--font-body)',
                    letterSpacing: '0.06em',
                  }}
                >
                  {label}
                </span>
              </Link>
            )
          })}
        </div>
      </nav>
    </div>
  )
}
