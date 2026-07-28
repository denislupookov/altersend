import { Button, useTheme } from '@altersend/components'
import { AlertCircleIcon } from '@altersend/components/icons'
import { formatFileSize, WEB_LINK_MAX_BYTES } from '@altersend/domain'
import { useTranslation } from '@altersend/locales'
import { Card, ScreenIntro } from '../../components'
import { openDownload } from '../../downloadApp'
import { useDownloadCta } from '../../useDownloadCta'

export interface TooLargeScreenProps {
  totalBytes: number
  onReset: () => void
}

export function TooLargeScreen({ totalBytes, onReset }: TooLargeScreenProps) {
  const { t } = useTranslation(['web', 'common'])
  const { theme } = useTheme()
  const { label, Icon } = useDownloadCta()

  return (
    <>
      <ScreenIntro title={t('web:tooLarge.title')} description={t('web:tooLarge.description')} />

      <Card>
        <div className='flex flex-col items-center text-center'>
          <span className='flex h-14 w-14 items-center justify-center rounded-full bg-warning-subtle'>
            <AlertCircleIcon size={24} color={theme.colors.colorWarning} />
          </span>

          <p className='m-0 mt-4 max-w-[420px] text-sm leading-relaxed text-text-muted'>
            {t('web:tooLarge.body', {
              size: formatFileSize(totalBytes),
              limit: formatFileSize(WEB_LINK_MAX_BYTES)
            })}
          </p>

          <div className='mt-5 flex w-full flex-col gap-2.5 sm:flex-row'>
            <div className='sm:flex-[2]'>
              <Button
                variant='primary'
                size='lg'
                width='full'
                icon={<Icon size={16} />}
                onClick={openDownload}
              >
                {label}
              </Button>
            </div>
            <div className='sm:flex-1'>
              <Button variant='secondary' size='lg' width='full' onClick={onReset}>
                {t('web:disconnected.anotherCode')}
              </Button>
            </div>
          </div>
        </div>
      </Card>
    </>
  )
}
