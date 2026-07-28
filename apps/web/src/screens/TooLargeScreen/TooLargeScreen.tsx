import { useTheme } from '@altersend/components'
import { AlertCircleIcon } from '@altersend/components/icons'
import { buildJoinUrl, formatFileSize, WEB_LINK_MAX_BYTES } from '@altersend/domain'
import { useTranslation } from '@altersend/locales'
import { ScreenIntro, StatusCard } from '../../components'

export interface TooLargeScreenProps {
  code: string
  totalBytes: number
  onReset: () => void
}

export function TooLargeScreen({ code, totalBytes, onReset }: TooLargeScreenProps) {
  const { t } = useTranslation(['web', 'common'])
  const { theme } = useTheme()

  const openInApp = () => {
    window.location.href = buildJoinUrl(code)
  }

  return (
    <>
      <ScreenIntro title={t('web:tooLarge.title')} description={t('web:tooLarge.description')} />

      <StatusCard
        tone='warning'
        icon={<AlertCircleIcon size={24} color={theme.colors.colorWarning} />}
        body={t('web:tooLarge.body', {
          size: formatFileSize(totalBytes),
          limit: formatFileSize(WEB_LINK_MAX_BYTES)
        })}
        primary={{ label: t('web:tooLarge.openInApp'), onClick: openInApp }}
        secondary={{ label: t('web:download.enterAnother'), onClick: onReset }}
      />
    </>
  )
}
