const WINDOW_DOTS = [0, 1, 2]

interface MacWindowProps {
  src: string
}

export function MacWindow({ src }: MacWindowProps) {
  return (
    <div
      className='relative w-[82%] overflow-hidden rounded-[10px] shadow-[0_22px_48px_-12px_color-mix(in_oklab,var(--as-color-scrim)_55%,transparent)] ring-1 ring-border-primary'
      style={{ aspectRatio: '1024 / 640' }}
    >
      <img src={src} alt='' className='block h-full w-full' />
      <div className='absolute left-3.5 top-2.5 flex gap-1.5'>
        {WINDOW_DOTS.map((dot) => (
          <span key={dot} className='h-[9px] w-[9px] rounded-full bg-border-strong' />
        ))}
      </div>
    </div>
  )
}
