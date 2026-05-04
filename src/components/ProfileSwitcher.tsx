'use client'

import { useAppStore } from '@/lib/store'
import { cn } from '@/lib/utils'
import type { ProfileId } from '@/types'

const EMOJIS: Record<ProfileId, string> = {
  marina: '🌸',
  luca:   '🌿',
}

interface ProfileSwitcherProps {
  compact?: boolean
}

export default function ProfileSwitcher({ compact }: ProfileSwitcherProps) {
  const { settings, setActiveProfile, profileSettings } = useAppStore()

  const profiles = (['marina', 'luca'] as ProfileId[]).map(id => ({
    id,
    name: profileSettings[id]?.name || id,
    emoji: EMOJIS[id],
  }))

  const active = profiles.find(p => p.id === settings.activeProfile)!

  if (compact) {
    return (
      <div className="relative group">
        <button className="flex items-center gap-1.5 bg-sage-50 border border-sage-200 rounded-2xl px-3 py-1.5 transition-all hover:bg-sage-100">
          <span className="text-base">{active.emoji}</span>
          <span className="text-sm font-medium text-sage-700">{active.name}</span>
        </button>
        <div className="absolute right-0 top-full mt-1 bg-white rounded-2xl shadow-card-hover border border-warmgray-100 overflow-hidden opacity-0 group-hover:opacity-100 pointer-events-none group-hover:pointer-events-auto transition-all z-50 min-w-[120px]">
          {profiles.map(p => (
            <button
              key={p.id}
              onClick={() => setActiveProfile(p.id)}
              className={cn(
                "w-full flex items-center gap-2 px-4 py-3 text-sm transition-colors text-left",
                p.id === settings.activeProfile
                  ? "bg-sage-50 text-sage-700 font-medium"
                  : "text-warmgray-600 hover:bg-cream"
              )}
            >
              <span className="text-base">{p.emoji}</span>
              <span>{p.name}</span>
              {p.id === settings.activeProfile && (
                <span className="ml-auto w-1.5 h-1.5 rounded-full bg-sage-500" />
              )}
            </button>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="flex items-center gap-2 p-1 bg-warmgray-100 rounded-2xl">
      {profiles.map(p => (
        <button
          key={p.id}
          onClick={() => setActiveProfile(p.id)}
          className={cn(
            "flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200",
            p.id === settings.activeProfile
              ? "bg-white text-sage-700 shadow-sm"
              : "text-warmgray-500 hover:text-warmgray-700"
          )}
        >
          <span>{p.emoji}</span>
          <span>{p.name}</span>
        </button>
      ))}
    </div>
  )
}
