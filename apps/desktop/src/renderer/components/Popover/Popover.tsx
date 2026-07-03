import { useEffect, useRef, useState } from 'react'

interface PopoverProps {
  trigger: React.ReactNode
  children: (close: () => void) => React.ReactNode
  align?: 'left' | 'right'
  variant?: 'menu' | 'plain'
}

export function Popover({ trigger, children, align = 'right', variant = 'menu' }: PopoverProps) {
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
      ? 'min-w-[180px] overflow-hidden rounded-[10px] border border-border-primary bg-background-subtle p-1 shadow-[0_8px_24px_color-mix(in_oklab,var(--as-color-scrim)_35%,transparent)]'
      : 'shadow-lg'

  const posStyle: React.CSSProperties = anchorRect
    ? variant === 'plain'
      ? { top: anchorRect.bottom + 2, left: anchorRect.left, width: anchorRect.width }
      : align === 'right'
        ? { top: anchorRect.bottom + 2, right: window.innerWidth - anchorRect.right }
        : { top: anchorRect.bottom + 2, left: anchorRect.left }
    : {}

  const transformOrigin = variant === 'plain' || align === 'left' ? 'top left' : 'top right'

  return (
    <div ref={triggerRef}>
      <div className='cursor-pointer' onClick={handleToggle}>
        {trigger}
      </div>
      {open && anchorRect && (
        <div
          ref={popoverRef}
          className={`fixed z-[200] ${menuClass}`}
          style={{ ...posStyle, transformOrigin, animation: 'as-scale-in 130ms ease-out' }}
        >
          {children(close)}
        </div>
      )}
    </div>
  )
}
