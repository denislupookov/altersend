import { useState } from 'react'
import { createPortal } from 'react-dom'
import { Button, LinkRow, ListItem, useTheme } from '@altersend/components'
import {
  ClipboardIcon,
  MoreHorizontalIcon,
  PlusIcon,
  QrCodeIcon,
  TrashIcon,
  deviceIcon
} from '@altersend/components/icons'
import { forgetPeer, usePairingSession } from '@altersend/domain'
import { useTranslation } from '@altersend/locales'
import syncDevicesSvg from '../../../../../../../assets/sync_devices.svg'
import { useToast } from '../../Toast'
import { Popover } from '../../Popover'
import { PairingQrModal } from '../PairingQrModal'
import { PairingJoinModal } from '../PairingJoinModal'
import { SectionShell } from './SectionShell'

export function DevicesSection() {
  const { t } = useTranslation(['settings', 'common'])
  const { theme } = useTheme()
  const c = theme.colors
  const toast = useToast()

  const [qrOpen, setQrOpen] = useState(false)
  const [joinOpen, setJoinOpen] = useState(false)

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
        <div className='flex flex-col gap-2.5'>
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
                      <ListItem
                        tone='danger'
                        icon={<TrashIcon size={16} />}
                        label={t('settings:pairing.removeDevice')}
                        onClick={() => {
                          close()
                          forgetPeer(peer.remoteDevicePubkey)
                            .then((removed) =>
                              toast.show(
                                removed
                                  ? { title: t('settings:pairing.deviceRemoved') }
                                  : {
                                      title: t('settings:pairing.removeFailed'),
                                      variant: 'error'
                                    }
                              )
                            )
                            .catch(() =>
                              toast.show({
                                title: t('settings:pairing.removeFailed'),
                                variant: 'error'
                              })
                            )
                        }}
                      />
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
    </SectionShell>
  )
}
