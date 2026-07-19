import { Button } from '../Button'
import { PauseIcon, PlayIcon } from '../../icons'

export interface RowActionButtonProps {
  kind: 'resume' | 'pause'
  label: string
  onPress: () => void
}

export function RowActionButton({ kind, label, onPress }: RowActionButtonProps) {
  const icon = kind === 'resume' ? <PlayIcon size={14} /> : <PauseIcon size={14} />
  return (
    <Button
      aria-label={label}
      icon={icon}
      iconOnly
      onClick={onPress}
      size='sm'
      tooltip={label}
      tooltipSide='left'
      variant='secondary'
    />
  )
}
