import { useTranslation } from '@altersend/locales'
import { Button, useTheme } from '@altersend/components'
import { CheckIcon, LinkIcon } from '@altersend/components/icons'
import { WEB_LINK_MAX_LABEL } from '@altersend/domain'
import { openSettingsPanel } from '../../components/Settings/settingsControl'

interface CopyLinkButtonProps {
  topic: string
  copied: boolean
  locked?: boolean
  onCopy: () => void
}

export function CopyLinkButton({ topic, copied, locked = false, onCopy }: CopyLinkButtonProps) {
  const { t } = useTranslation(['send', 'common'])
  const { theme } = useTheme()
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
          locked ? t('send:connection.linkHint', { limit: WEB_LINK_MAX_LABEL }) : undefined
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
        onClick={locked ? () => openSettingsPanel('account') : onCopy}
      />
    </div>
  )
}
