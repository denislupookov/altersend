import type { ReactNode } from 'react'
import wallpaper from '../../../../../../assets/onboarding/desktop-wallpaper.jpg'

interface VisualCardProps {
  height?: string
  wallpaperBackdrop?: boolean
  children: ReactNode
}

export function VisualCard({
  height = 'min-h-[140px] max-h-[340px] flex-1',
  wallpaperBackdrop = true,
  children
}: VisualCardProps) {
  const backdrop = wallpaperBackdrop ? { backgroundImage: `url(${wallpaper})` } : undefined

  return (
    <div
      className={`relative w-full overflow-hidden rounded-2xl border border-border-primary bg-background-subtle bg-cover bg-center ${height}`}
      style={backdrop}
    >
      {children}
    </div>
  )
}
