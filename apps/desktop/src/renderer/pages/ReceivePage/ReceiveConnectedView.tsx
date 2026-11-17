import { Button } from '@altersend/components'
import { DownloadIcon, PlayIcon } from '@altersend/components/icons'
import { useTranslation } from '@altersend/locales'
import { bridgeApi } from '../../api/bridgeApi'
import { useToast } from '../../components/Toast'
import { openSettingsPanel } from '../../components/Settings/settingsControl'
import { isAskEveryTime } from '../../lifecycle/downloadLocationStorage'
import { ReceiveFileList } from './ReceiveFileList'
import { RelayLimitNote } from './RelayLimitNote'
import {
  clearSession,
  getPrimaryDownloadLabel,
  relayPrimaryAction,
  useReceiveActions,
  useReceiveDownloads,
  useReceiveRelayAllowance,
  useRelayUnlocked,
  type ReceiveFileOffer
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
  const allowance = useReceiveRelayAllowance(downloads)

  useRelayUnlocked(allowance.limited, () =>
    toast.show({ title: t('receive:relayLimit.unlocked'), durationMs: 3000 })
  )

  const downloadWithDialog = async (offers: ReceiveFileOffer[]) => {
    const isSingleLooseFile =
      offers.length === 1 &&
      downloads.rows.some((row) => row.kind === 'file' && row.offer.id === offers[0].id)

    if (isSingleLooseFile) {
      const selected = await bridgeApi.pickSaveFile(toSafeFileName(offers[0].name))
      if (!selected?.path) return

      await actions.replaceWith(offers[0], selected.path)
      return
    }

    const selectedDirectory = await bridgeApi.pickDirectory()
    if (!selectedDirectory) return

    await actions.downloadInto(selectedDirectory, offers)
  }

  const download = async (offers: ReceiveFileOffer[]) => {
    if (offers.length === 0 || downloads.isDownloading) return

    try {
      if (isAskEveryTime()) {
        await downloadWithDialog(offers)
        return
      }

      const folder = await bridgeApi.getDownloadFolder()
      if (!folder) {
        await downloadWithDialog(offers)
        return
      }

      await actions.downloadInto(folder, offers)
    } catch (error) {
      console.error('ReceiveConnectedView: download failed', error)
      toast.show({ title: t('errors:transfer.downloadFailed'), variant: 'error' })
    }
  }

  const getPro = () => openSettingsPanel('account')

  const renderPrimary = () => {
    const action = downloads.primaryAction
    if (!action) return null

    const relayAction = relayPrimaryAction(t, action, allowance)
    return (
      <Button
        disabled={action === 'downloading' || relayAction?.disabled}
        icon={action === 'resume-all' ? <PlayIcon size={14} /> : <DownloadIcon size={14} />}
        loading={action === 'downloading'}
        onClick={() =>
          (action === 'resume-all'
            ? actions.resumeAll()
            : download(allowance.freePendingOffers)
          ).catch(console.error)
        }
        size='sm'
        variant={action === 'downloading' ? 'secondary' : 'primary'}
      >
        {relayAction?.label ??
          getPrimaryDownloadLabel(t, action, {
            percent: downloads.totals.percent,
            totalBytes: downloads.totals.totalBytes
          })}
      </Button>
    )
  }

  return (
    <ReceiveFileList
      rows={allowance.rows}
      lockedKeys={allowance.lockedKeys}
      rowsFooter={allowance.limited ? <RelayLimitNote onGetPro={getPro} /> : undefined}
      footer={
        <>
          <Button onClick={clearSession} size='sm' variant='secondary'>
            {t('common:actions.endSession')}
          </Button>
          {renderPrimary()}
        </>
      }
    />
  )
}
