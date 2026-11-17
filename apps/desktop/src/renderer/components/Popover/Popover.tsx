import { useEffect, useRef, useState } from 'react'
import { zLayer } from '../../zLayer'

interface PopoverProps {
  trigger: React.ReactNode
  children: (close: () => void) => React.ReactNode
  align?: 'left' | 'right'
  side?: 'bottom' | 'top'
  variant?: 'menu' | 'plain'
}

export function Popover({
  trigger,
  children,
  align = 'right',
  side = 'bottom',
  variant = 'menu'
}: PopoverProps) {
  const [open, setOpen] = useState(false)
  const [anchorRect, setAnchorRect] = useState<DOMRect | null>(null)
  const triggerRef = useRef<HTMLDivElement>(null)
  const popoverRef = useRef<HTMLDivElement>(null)
  const close = () => setOpen(false)

  const handleToggle = () => {
    if (!triggerRef.current) return
    setAnchorRect(triggerRef.current.getBoundingClientRect())
    setOpen((v) => !v)
  }

  useEffect(() => {
    if (!open) return
    const handler = (e: MouseEvent) => {
      if (
        popoverRef.current &&
        !popoverRef.current.contains(e.target as Node) &&
        triggerRef.current &&
        !triggerRef.current.contains(e.target as Node)
      )
        setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  const menuClass =
    variant === 'menu'
      ? 'min-w-[180px] overflow-hidden rounded-2xl border border-border-primary bg-background-subtle p-1 shadow-[0_8px_24px_color-mix(in_oklab,var(--as-color-scrim)_35%,transparent)]'
      : 'rounded-2xl shadow-lg'

  const verticalFor = (rect: DOMRect): React.CSSProperties =>
    side === 'top' ? { bottom: window.innerHeight - rect.top + 6 } : { top: rect.bottom + 2 }

  const posStyle: React.CSSProperties = anchorRect
    ? variant === 'plain'
      ? { ...verticalFor(anchorRect), left: anchorRect.left, width: anchorRect.width }
      : align === 'right'
        ? { ...verticalFor(anchorRect), right: window.innerWidth - anchorRect.right }
        : { ...verticalFor(anchorRect), left: anchorRect.left }
    : {}

  const originY = side === 'top' ? 'bottom' : 'top'
  const originX = variant === 'plain' || align === 'left' ? 'left' : 'right'
  const transformOrigin = `${originY} ${originX}`

  return (
    <div ref={triggerRef}>
      <div className='cursor-pointer' onClick={handleToggle}>
        {trigger}
      </div>
      {open && anchorRect && (
        <div
          ref={popoverRef}
          className={`fixed ${menuClass}`}
          style={{
            ...posStyle,
            zIndex: zLayer.popover,
            transformOrigin,
            animation: 'as-scale-in 130ms ease-out'
          }}
        >
          {children(close)}
        </div>
      )}
    </div>
  )
}
