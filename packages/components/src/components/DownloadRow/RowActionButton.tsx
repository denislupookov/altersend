import type { ReactNode } from 'react'
import { Button } from '../Button'
import { ArrowUpRightIcon, PauseIcon, PlayIcon } from '../../icons'

export type RowActionKind = 'resume' | 'pause' | 'open'

const ICONS: Record<RowActionKind, ReactNode> = {
  resume: <PlayIcon size={14} />,
  pause: <PauseIcon size={14} />,
  open: <ArrowUpRightIcon size={14} />
}

export interface RowActionButtonProps {
  kind: RowActionKind
  label: string
  onPress: () => void
}

export function RowActionButton({ kind, label, onPress }: RowActionButtonProps) {
  return (
    <Button
      aria-label={label}
      icon={ICONS[kind]}
      iconOnly
      onClick={onPress}
      size='sm'
      tooltip={label}
      tooltipSide='left'
      variant='secondary'
    />
  )
}
