import { useTheme } from '@altersend/components'
import { AlertCircleIcon } from '@altersend/components/icons'
import { buildJoinUrl } from '@altersend/domain'
import { useTranslation } from '@altersend/locales'
import { ScreenIntro, StatusCard } from '../../components'

export interface TooLargeScreenProps {
  code: string
  onReset: () => void
}

export function TooLargeScreen({ code, onReset }: TooLargeScreenProps) {
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
        body={t('web:tooLarge.body')}
        primary={{ label: t('web:tooLarge.openInApp'), onClick: openInApp }}
        secondary={{ label: t('web:download.enterAnother'), onClick: onReset }}
      />
    </>
  )
}
