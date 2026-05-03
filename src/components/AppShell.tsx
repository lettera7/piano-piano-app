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
    <div className="relative min-h-dvh flex flex-col">
      {/* Top bar */}
      <header className="sticky top-0 z-40 safe-top">
        <div className="bottom-nav-blur border-b border-warmgray-100/60 px-4 py-3 flex items-center justify-between">
          <div>
            <h1 className="heading-display text-sage-600 font-semibold text-xl leading-none">
              Piano Piano
            </h1>
            <p className="text-xs text-warmgray-400 mt-0.5">Il tuo piano, giorno per giorno</p>
          </div>
          <div className="flex items-center gap-2">
            <ProfileSwitcher compact />
            <Link
              href="/settings"
              className={cn(
                "w-9 h-9 flex items-center justify-center rounded-2xl transition-colors",
                pathname === '/settings'
                  ? "bg-sage-100 text-sage-600"
                  : "text-warmgray-400 hover:text-warmgray-600 hover:bg-warmgray-100"
              )}
            >
              <Settings className="w-5 h-5" />
            </Link>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1 pb-24 overflow-y-auto scroll-content" style={{ paddingBottom: 'calc(80px + env(safe-area-inset-bottom, 16px))' }}>
        {children}
      </main>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 inset-x-0 z-50 bottom-nav-blur border-t border-warmgray-100/60"
           style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}>
        <div className="flex items-stretch h-[68px]">
          {navItems.map(({ href, icon: Icon, label }) => {
            const isActive = href === '/' ? pathname === '/' : pathname.startsWith(href)
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  "flex-1 flex flex-col items-center justify-center gap-1 transition-all duration-200",
                  isActive ? "text-sage-600" : "text-warmgray-400"
                )}
              >
                <div className={cn(
                  "w-10 h-7 flex items-center justify-center rounded-full transition-all duration-200",
                  isActive && "bg-sage-100"
                )}>
                  <Icon className={cn("w-5 h-5 transition-all duration-200", isActive && "scale-110")} />
                </div>
                <span className={cn(
                  "text-[10px] font-medium transition-all duration-200",
                  isActive ? "text-sage-600" : "text-warmgray-400"
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
