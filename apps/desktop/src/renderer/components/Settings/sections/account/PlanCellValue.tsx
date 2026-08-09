import { useTheme } from '@altersend/components'
import { CheckIcon } from '@altersend/components/icons'
import type { PlanCell } from '@altersend/domain'

interface Props {
  cell: PlanCell
  className: string
  size: number
  tone: 'muted' | 'primary'
}

export function PlanCellValue({ cell, className, size, tone }: Props) {
  const { theme } = useTheme()
  const c = theme.colors

  if (cell.type === 'check') {
    return (
      <span className='flex justify-center'>
        <CheckIcon size={size} color={tone === 'muted' ? c.colorTextMuted : c.colorTextPrimary} />
      </span>
    )
  }

  return <span className={className}>{cell.value}</span>
}
