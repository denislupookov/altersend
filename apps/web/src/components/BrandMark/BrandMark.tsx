import mark from '../../assets/altersend-mark.png'

type MarkSize = 'md' | 'lg'

const TILE: Record<MarkSize, string> = {
  md: 'h-9 w-9 rounded-md sm:h-10 sm:w-10',
  lg: 'h-16 w-16 rounded-xl'
}

const GLYPH: Record<MarkSize, string> = {
  md: 'h-5 w-5 sm:h-6 sm:w-6',
  lg: 'h-10 w-10'
}

export function BrandMark({ size = 'md' }: { size?: MarkSize }) {
  return (
    <span
      className={`flex shrink-0 items-center justify-center bg-white ${TILE[size]}`}
      aria-hidden='true'
    >
      <img src={mark} alt='' className={`object-contain ${GLYPH[size]}`} />
    </span>
  )
}
