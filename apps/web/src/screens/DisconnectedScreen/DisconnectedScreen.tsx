import { useTheme } from '@altersend/components'
import { CheckIcon, RotateCwIcon, UnlinkIcon } from '@altersend/components/icons'
import { useTranslation } from '@altersend/locales'
import { ScreenIntro, StatusCard } from '../../components'
import type { TransferFile } from '../../types'

export interface DisconnectedScreenProps {
  files: TransferFile[]
  onReconnect: () => void
  onReset: () => void
}

export function DisconnectedScreen({ files, onReconnect, onReset }: DisconnectedScreenProps) {
  const { t } = useTranslation(['web', 'common'])
  const { theme } = useTheme()
  const saved = files.filter((f) => f.status === 'completed')
  const completed = saved.length
  const total = files.length
  const allDone = total > 0 && completed === total
  const lastSaved = saved[saved.length - 1]?.offer.name

  const savedChip =
    completed > 0 ? (
      <div className='mt-5 flex w-full items-center gap-2.5 rounded-xl bg-surface-secondary px-4 py-3 text-left'>
        <CheckIcon size={16} color={theme.colors.colorSuccess} />
        <span className='min-w-0 flex-1 truncate text-sm text-text-primary'>
          {t('web:disconnected.alreadySaved', { completed, total })}
        </span>
        {lastSaved && (
          <span className='min-w-0 shrink truncate text-sm text-text-muted'>{lastSaved}</span>
        )}
      </div>
    ) : undefined

  return (
    <>
      <ScreenIntro
        title={allDone ? t('web:disconnected.completeTitle') : t('web:disconnected.title')}
        description={
          allDone ? t('web:disconnected.completeDescription') : t('web:disconnected.description')
        }
      />

      {allDone ? (
        <StatusCard
          tone='success'
          icon={<CheckIcon size={24} color={theme.colors.colorSuccess} />}
          title={t('web:disconnected.allReceived')}
          body={t('web:disconnected.summary_complete', { total })}
          extra={savedChip}
          primary={{ label: t('common:actions.done'), onClick: onReset }}
        />
      ) : (
        <StatusCard
          tone='warning'
          icon={<UnlinkIcon size={24} color={theme.colors.colorWarning} />}
          title={t('web:disconnected.waitingTitle')}
          body={t('web:disconnected.waitingBody')}
          extra={savedChip}
          primary={{
            label: t('web:disconnected.tryNow'),
            icon: <RotateCwIcon size={16} />,
            onClick: onReconnect
          }}
          secondary={{ label: t('web:download.enterAnother'), onClick: onReset }}
        />
      )}
    </>
  )
}
