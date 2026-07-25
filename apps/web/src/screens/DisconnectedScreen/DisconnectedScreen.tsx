import { Button, useTheme } from '@altersend/components'
import { CheckIcon, RotateCwIcon, UnlinkIcon } from '@altersend/components/icons'
import { useTranslation } from '@altersend/locales'
import { Card, ScreenIntro } from '../../components'
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

  return (
    <>
      <ScreenIntro
        title={allDone ? t('web:disconnected.completeTitle') : t('web:disconnected.title')}
        description={
          allDone ? t('web:disconnected.completeDescription') : t('web:disconnected.description')
        }
      />

      <Card>
        <div className='flex flex-col items-center text-center'>
          <span
            className={`flex h-14 w-14 items-center justify-center rounded-full ${allDone ? 'bg-success-subtle' : 'bg-warning-subtle'}`}
          >
            {allDone ? (
              <CheckIcon size={24} color={theme.colors.colorSuccess} />
            ) : (
              <UnlinkIcon size={24} color={theme.colors.colorWarning} />
            )}
          </span>

          <p className='m-0 mt-4 text-[17px] font-semibold text-text-primary'>
            {allDone ? t('web:disconnected.allReceived') : t('web:disconnected.waitingTitle')}
          </p>
          <p className='m-0 mt-2 max-w-[420px] text-sm leading-relaxed text-text-muted'>
            {allDone
              ? t('web:disconnected.summary_complete', { total })
              : t('web:disconnected.waitingBody')}
          </p>

          {completed > 0 && (
            <div className='mt-5 flex w-full items-center gap-2.5 rounded-xl bg-surface-secondary px-4 py-3 text-left'>
              <CheckIcon size={16} color={theme.colors.colorSuccess} />
              <span className='min-w-0 flex-1 truncate text-sm text-text-primary'>
                {t('web:disconnected.alreadySaved', { completed, total })}
              </span>
              {lastSaved && (
                <span className='min-w-0 shrink truncate text-sm text-text-muted'>{lastSaved}</span>
              )}
            </div>
          )}

          <div className='mt-5 flex w-full flex-col gap-2.5 sm:flex-row'>
            {allDone ? (
              <Button variant='primary' size='lg' width='full' onClick={onReset}>
                {t('common:actions.done')}
              </Button>
            ) : (
              <>
                <div className='sm:flex-[2]'>
                  <Button
                    variant='primary'
                    size='lg'
                    width='full'
                    icon={<RotateCwIcon size={16} />}
                    onClick={onReconnect}
                  >
                    {t('web:disconnected.tryNow')}
                  </Button>
                </div>
                <div className='sm:flex-1'>
                  <Button variant='secondary' size='lg' width='full' onClick={onReset}>
                    {t('web:disconnected.anotherCode')}
                  </Button>
                </div>
              </>
            )}
          </div>
        </div>
      </Card>
    </>
  )
}
