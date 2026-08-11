import { useState } from 'react'
import { createPortal } from 'react-dom'
import { Button, LinkRow, ListItem, useTheme } from '@altersend/components'
import {
  ClipboardIcon,
  MoreHorizontalIcon,
  PencilIcon,
  PlusIcon,
  QrCodeIcon,
  TrashIcon,
  deviceIcon
} from '@altersend/components/icons'
import {
  forgetPeer,
  renamePeer,
  usePairingSession,
  type DeviceRenameTarget
} from '@altersend/domain'
import { useTranslation } from '@altersend/locales'
import syncDevicesSvg from '../../../../../../../assets/sync_devices.svg'
import { useToast } from '../../Toast'
import { ConfirmDialog } from '../../ConfirmDialog'
import { Popover } from '../../Popover'
import { PairingQrModal } from '../PairingQrModal'
import { PairingJoinModal } from '../PairingJoinModal'
import { DeviceRenameModal } from '../DeviceRenameModal'
import { SectionShell } from './SectionShell'

export function DevicesSection() {
  const { t } = useTranslation(['settings', 'common'])
  const { theme } = useTheme()
  const c = theme.colors
  const toast = useToast()

  const [qrOpen, setQrOpen] = useState(false)
  const [joinOpen, setJoinOpen] = useState(false)
  const [renameTarget, setRenameTarget] = useState<DeviceRenameTarget | null>(null)
  const [removeTarget, setRemoveTarget] = useState<DeviceRenameTarget | null>(null)

  const { peers, pairingTopic, isJoining, isJoinWaiting, join } = usePairingSession({
    hostOpen: qrOpen,
    joinOpen,
    onPaired: () => {
      setQrOpen(false)
      setJoinOpen(false)
      toast.show({ title: t('settings:pairing.devicePaired') })
    },
    onFailed: () => toast.show({ title: t('settings:pairing.pairFailed'), variant: 'error' })
  })

  const removeDevice = () => {
    if (!removeTarget) return
    const peerKey = removeTarget.peerKey
    setRemoveTarget(null)
    forgetPeer(peerKey)
      .then((removed) =>
        toast.show(
          removed
            ? { title: t('settings:pairing.deviceRemoved') }
            : { title: t('settings:pairing.removeFailed'), variant: 'error' }
        )
      )
      .catch(() => toast.show({ title: t('settings:pairing.removeFailed'), variant: 'error' }))
  }

  return (
    <SectionShell
      title={t('settings:pairing.pairedDevices')}
      action={
        <Popover
          trigger={
            <Button variant='primary' size='sm' icon={<PlusIcon size={14} />}>
              {t('settings:pairing.pairNewDevice')}
            </Button>
          }
        >
          {(close) => (
            <>
              <ListItem
                variant='plain'
                icon={<QrCodeIcon size={16} />}
                label={t('settings:pairing.showQrCode')}
                onClick={() => {
                  close()
                  setQrOpen(true)
                }}
              />
              <ListItem
                variant='plain'
                icon={<ClipboardIcon size={16} />}
                label={t('settings:pairing.enterCode')}
                onClick={() => {
                  close()
                  setJoinOpen(true)
                }}
              />
            </>
          )}
        </Popover>
      }
    >
      {peers.length === 0 ? (
        <div className='flex h-full flex-col items-center justify-center px-6 py-8 text-center'>
          <img src={syncDevicesSvg} alt='' aria-hidden className='mb-6 w-[220px] opacity-90' />
          <p className='m-0 text-[18px] font-bold text-text-primary'>
            {t('settings:pairing.noPairedDevices')}
          </p>
          <p className='m-0 mt-2 max-w-[320px] text-[14px] leading-relaxed text-text-muted'>
            {t('settings:pairing.noPairedDevicesHint')}
          </p>
        </div>
      ) : (
        <div className='flex flex-col gap-1.5'>
          {peers.map((peer) => {
            const Icon = deviceIcon(peer.deviceType)
            return (
              <LinkRow
                key={peer.remoteDevicePubkey}
                standalone
                compact
                icon={<Icon size={14} color={c.colorTextPrimary} />}
                label={peer.displayName}
                trailing={
                  <Popover
                    trigger={
                      <Button
                        variant='ghost'
                        size='sm'
                        iconOnly
                        aria-label={t('settings:pairing.deviceActions')}
                        icon={<MoreHorizontalIcon size={14} />}
                      />
                    }
                  >
                    {(close) => (
                      <>
                        <ListItem
                          variant='plain'
                          icon={<PencilIcon size={16} />}
                          label={t('settings:pairing.renameDevice')}
                          onClick={() => {
                            close()
                            setRenameTarget({
                              peerKey: peer.remoteDevicePubkey,
                              name: peer.displayName
                            })
                          }}
                        />
                        <ListItem
                          tone='danger'
                          icon={<TrashIcon size={16} />}
                          label={t('settings:pairing.removeDevice')}
                          onClick={() => {
                            close()
                            setRemoveTarget({
                              peerKey: peer.remoteDevicePubkey,
                              name: peer.displayName
                            })
                          }}
                        />
                      </>
                    )}
                  </Popover>
                }
              />
            )
          })}
        </div>
      )}

      {createPortal(
        <PairingQrModal open={qrOpen} topic={pairingTopic} onClose={() => setQrOpen(false)} />,
        document.body
      )}
      {createPortal(
        <PairingJoinModal
          open={joinOpen}
          isLoading={isJoining || isJoinWaiting}
          onClose={() => setJoinOpen(false)}
          onJoin={join}
        />,
        document.body
      )}
      {createPortal(
        <DeviceRenameModal
          open={renameTarget !== null}
          initialName={renameTarget?.name ?? ''}
          onClose={() => setRenameTarget(null)}
          onRename={async (name) => {
            if (!renameTarget) return false
            const renamed = await renamePeer(renameTarget.peerKey, name)
            toast.show(
              renamed
                ? { title: t('settings:pairing.deviceRenamed') }
                : { title: t('settings:pairing.renameFailed'), variant: 'error' }
            )
            return renamed
          }}
        />,
        document.body
      )}
      {createPortal(
        <ConfirmDialog
          open={removeTarget !== null}
          title={t('settings:pairing.removeConfirmTitle', { name: removeTarget?.name ?? '' })}
          message={t('settings:pairing.removeConfirmMessage')}
          confirmLabel={t('settings:pairing.removeDevice')}
          cancelLabel={t('common:actions.cancel')}
          destructive
          onConfirm={removeDevice}
          onCancel={() => setRemoveTarget(null)}
        />,
        document.body
      )}
    </SectionShell>
  )
}
