import { Button, ErrorBanner } from '@altersend/components'
import { DownloadIcon, PlayIcon } from '@altersend/components/icons'
import { useTranslation } from '@altersend/locales'
import { bridgeApi } from '../../api/bridgeApi'
import { useToast } from '../../components/Toast'
import { openSettingsPanel } from '../../components/Settings/settingsControl'
import { isAskEveryTime } from '../../lifecycle/downloadLocationStorage'
import { ReceiveFileList } from './ReceiveFileList'
import {
  clearSession,
  getPrimaryDownloadLabel,
  NATIVE_RELAY_MAX_LABEL,
  useReceiveActions,
  useReceiveDownloads,
  useReceiveRelayLimit
} from '@altersend/domain'

function toSafeFileName(name: string): string {
  const base = name.split(/[/\\]/).pop() ?? ''
  return base.replace(/\0/g, '').trim() || 'file'
}

export function ReceiveConnectedView() {
  const { t } = useTranslation(['receive', 'common', 'errors', 'settings'])
  const toast = useToast()
  const downloads = useReceiveDownloads()
  const actions = useReceiveActions(downloads)
  const relayLimited = useReceiveRelayLimit()

  const downloadWithDialog = async () => {
    const isSingleLooseFile =
      downloads.pendingOffers.length === 1 &&
      downloads.rows.length === 1 &&
      downloads.rows[0].kind === 'file'

    if (isSingleLooseFile) {
      const selected = await bridgeApi.pickSaveFile(toSafeFileName(downloads.pendingOffers[0].name))
      if (!selected?.path) return

      await actions.replaceWith(downloads.pendingOffers[0], selected.path)
      return
    }

    const selectedDirectory = await bridgeApi.pickDirectory()
    if (!selectedDirectory) return

    await actions.downloadInto(selectedDirectory)
  }

  const downloadAll = async () => {
    if (downloads.pendingOffers.length === 0 || downloads.isDownloading) return

    try {
      if (isAskEveryTime()) {
        await downloadWithDialog()
        return
      }

      const folder = await bridgeApi.getDownloadFolder()
      if (!folder) {
        await downloadWithDialog()
        return
      }

      await actions.downloadInto(folder)
    } catch (error) {
      console.error('ReceiveConnectedView: download failed', error)
      toast.show({ title: t('errors:transfer.downloadFailed'), variant: 'error' })
    }
  }

  const getPro = () => openSettingsPanel('account')

  return (
    <>
      {relayLimited ? (
        <div className='mb-[22px]'>
          <ErrorBanner
            message={t('receive:page.relayLimit.description', { limit: NATIVE_RELAY_MAX_LABEL })}
            action={
              <Button size='sm' variant='primary' onClick={getPro}>
                {t('settings:account.getPro')}
              </Button>
            }
          />
        </div>
      ) : null}
      <ReceiveFileList
        footer={
          <>
            <Button onClick={clearSession} size='sm' variant='secondary'>
              {t('common:actions.endSession')}
            </Button>
            {downloads.primaryAction && !relayLimited ? (
              <Button
                disabled={downloads.primaryAction === 'downloading'}
                icon={
                  downloads.primaryAction === 'resume-all' ? (
                    <PlayIcon size={14} />
                  ) : (
                    <DownloadIcon size={14} />
                  )
                }
                loading={downloads.primaryAction === 'downloading'}
                onClick={() =>
                  (downloads.primaryAction === 'resume-all'
                    ? actions.resumeAll()
                    : downloadAll()
                  ).catch(console.error)
                }
                size='sm'
                variant={downloads.primaryAction === 'downloading' ? 'secondary' : 'primary'}
              >
                {getPrimaryDownloadLabel(t, downloads.primaryAction, {
                  percent: downloads.totals.percent,
                  totalBytes: downloads.totals.totalBytes
                })}
              </Button>
            ) : null}
          </>
        }
      />
    </>
  )
}
