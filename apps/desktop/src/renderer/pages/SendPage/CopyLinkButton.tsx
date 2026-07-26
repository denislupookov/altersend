import { useTranslation } from '@altersend/locales'
import { Button, useTheme } from '@altersend/components'
import { CheckIcon, LinkIcon } from '@altersend/components/icons'

interface CopyLinkButtonProps {
  topic: string
  copied: boolean
  onCopy: () => void
}

export function CopyLinkButton({ topic, copied, onCopy }: CopyLinkButtonProps) {
  const { t } = useTranslation(['send', 'common'])
  const { theme } = useTheme()
  const label = copied ? t('common:actions.copied') : t('send:connection.copyLink')

  return (
    <div className='flex h-12 w-12 shrink-0'>
      <Button
        variant='secondary'
        iconOnly
        width='full'
        aria-label={t('send:connection.copyLink')}
        tooltip={label}
        tooltipSide='left'
        disabled={!topic}
        icon={
          copied ? (
            <CheckIcon size={18} color={theme.colors.colorSuccess} />
          ) : (
            <LinkIcon size={18} />
          )
        }
        onClick={onCopy}
      />
    </div>
  )
}
