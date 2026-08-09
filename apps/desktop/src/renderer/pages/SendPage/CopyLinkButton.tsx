import { useTranslation } from '@altersend/locales'
import { Button, useTheme } from '@altersend/components'
import { CheckIcon, LinkIcon } from '@altersend/components/icons'
import { useSubscriptionStore, WEB_LINK_MAX_LABEL } from '@altersend/domain'

interface CopyLinkButtonProps {
  topic: string
  copied: boolean
  onCopy: () => void
}

export function CopyLinkButton({ topic, copied, onCopy }: CopyLinkButtonProps) {
  const { t } = useTranslation(['send', 'common'])
  const { theme } = useTheme()
  const pro = useSubscriptionStore((state) => state.active)
  const label = copied ? t('common:actions.copied') : t('send:connection.shareLink')

  return (
    <div className='flex h-12 w-12 shrink-0'>
      <Button
        variant='secondary'
        iconOnly
        width='full'
        aria-label={t('send:connection.copyLink')}
        tooltip={label}
        tooltipDescription={
          copied || pro ? undefined : t('send:connection.linkHint', { limit: WEB_LINK_MAX_LABEL })
        }
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
