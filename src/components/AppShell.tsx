'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Sun, CalendarDays, ShoppingCart, BookOpen, Settings } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useAppStore } from '@/lib/store'
import ProfileSwitcher from './ProfileSwitcher'

const navItems = [
  { href: '/',         icon: Sun,          label: 'Oggi'    },
  { href: '/plan',     icon: CalendarDays, label: 'Piano'   },
  { href: '/shopping', icon: ShoppingCart, label: 'Spesa'   },
  { href: '/diary',    icon: BookOpen,     label: 'Diario'  },
]

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()

  return (
    <div className="relative min-h-dvh flex flex-col bg-cream">

      {/* ── Top bar ─────────────────────────────────────────────────────── */}
      <header className="sticky top-0 z-40 safe-top">
        <div className="bottom-nav-blur border-b border-warmgray-200/40 px-5 py-3 flex items-center justify-between">
          <div>
            <h1 className="heading-display text-sage font-bold text-xl leading-none tracking-tight">
              Piano Piano
            </h1>
            <p className="text-[11px] text-warmgray-400 mt-0.5 font-medium tracking-wide">
              Il tuo piano, giorno per giorno
            </p>
          </div>
          <div className="flex items-center gap-2">
            <ProfileSwitcher compact />
            <Link
              href="/settings"
              className={cn(
                'w-9 h-9 flex items-center justify-center rounded-2xl transition-all duration-200',
                pathname === '/settings'
                  ? 'bg-sage-100 text-sage-600'
                  : 'text-warmgray-400 hover:text-warmgray-600 hover:bg-warmgray-100'
              )}
            >
              <Settings className="w-4.5 h-4.5" />
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
        className="fixed bottom-0 inset-x-0 z-50 bottom-nav-blur shadow-bottom-nav"
        style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
      >
        <div className="flex items-stretch h-[68px] px-1">
          {navItems.map(({ href, icon: Icon, label }) => {
            const isActive = href === '/' ? pathname === '/' : pathname.startsWith(href)
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  'flex-1 flex flex-col items-center justify-center gap-0.5 transition-all duration-200 relative',
                  isActive ? 'text-sage' : 'text-warmgray-400'
                )}
              >
                {/* Active indicator line */}
                {isActive && (
                  <span className="absolute top-0 left-1/2 -translate-x-1/2 w-6 h-0.5 bg-sage rounded-full" />
                )}

                <div className={cn(
                  'w-11 h-7 flex items-center justify-center rounded-2xl transition-all duration-200',
                  isActive ? 'bg-sage-100' : ''
                )}>
                  <Icon className={cn(
                    'transition-all duration-200',
                    isActive ? 'w-5 h-5' : 'w-5 h-5 opacity-60'
                  )} />
                </div>
                <span className={cn(
                  'text-[10px] font-semibold transition-all duration-200 tracking-wide',
                  isActive ? 'text-sage-600' : 'text-warmgray-400'
                )}>
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
