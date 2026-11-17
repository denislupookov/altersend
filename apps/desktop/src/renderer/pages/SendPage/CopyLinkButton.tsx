import { useTranslation } from '@altersend/locales'
import { Button, ProTag, useTheme } from '@altersend/components'
import { CheckIcon, LinkIcon } from '@altersend/components/icons'
import { formatFileSize, WEB_LINK_MAX_LABEL } from '@altersend/domain'
import { Popover } from '../../components/Popover'
import { openSettingsPanel } from '../../components/Settings/settingsControl'

interface CopyLinkButtonProps {
  topic: string
  copied: boolean
  locked?: boolean
  totalSize: number
  onCopy: () => void
}

export function CopyLinkButton({
  topic,
  copied,
  locked = false,
  totalSize,
  onCopy
}: CopyLinkButtonProps) {
  const { t } = useTranslation(['send', 'common', 'settings'])
  const { theme } = useTheme()
  const label = copied ? t('common:actions.copied') : t('send:connection.shareLink')
  const linkIcon = copied ? (
    <CheckIcon size={18} color={theme.colors.colorSuccess} />
  ) : (
    <LinkIcon size={18} />
  )
  const button = (
    <Button
      variant='secondary'
      iconOnly
      width='full'
      aria-label={t('send:connection.copyLink')}
      tooltip={locked ? undefined : label}
      tooltipSide='left'
      disabled={!topic}
      icon={linkIcon}
      onClick={locked ? undefined : onCopy}
    />
  )

  if (!locked) {
    return <div className='flex h-12 w-12 shrink-0'>{button}</div>
  }

  return (
    <div className='h-12 w-12 shrink-0'>
      <Popover
        trigger={
          <div className='relative flex h-12 w-12'>
            {button}
            <span className='pointer-events-none absolute -top-2 right-1'>
              <ProTag label={t('send:peer.pro')} corner />
            </span>
          </div>
        }
      >
        {(close) => (
          <div className='w-[300px] p-3'>
            <p className='m-0 text-[14px] font-semibold text-text-primary'>
              {t('send:connection.linkLimitTitle', { limit: WEB_LINK_MAX_LABEL })}
            </p>
            <p className='m-0 mt-1.5 text-[13px] leading-[1.45] text-text-secondary'>
              {t('send:connection.linkLimitBody', { size: formatFileSize(totalSize) })}
            </p>
            <div className='mt-3 flex justify-end'>
              <Button
                onClick={() => {
                  close()
                  openSettingsPanel('account')
                }}
                size='sm'
                variant='primary'
              >
                {t('settings:account.getPro')}
              </Button>
            </div>
          </div>
        )}
      </Popover>
    </div>
  )
}
