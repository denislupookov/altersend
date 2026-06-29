import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { ActionRow, Button, LinkCard, LinkRow, useTheme } from '@altersend/components'
import {
  ArrowLeftIcon,
  ClipboardIcon,
  CloseIcon,
  MoreVerticalIcon,
  PlusIcon,
  QrCodeIcon,
  TrashIcon,
  deviceIcon
} from '@altersend/components/icons'
import { forgetPeer, usePairingSession } from '@altersend/domain'
import { useTranslation } from '@altersend/locales'
import syncDevicesSvg from '../../../../../../assets/sync_devices.svg'
import { useToast } from '../Toast'
import { Popover } from '../Popover'
import { PairingQrModal } from './PairingQrModal'
import { PairingJoinModal } from './PairingJoinModal'

interface DevicesPanelProps {
  onBack: () => void
  onClose: () => void
}

export function DevicesPanel({ onBack, onClose }: DevicesPanelProps) {
  const { t } = useTranslation(['settings', 'common'])
  const { theme } = useTheme()
  const c = theme.colors
  const toast = useToast()

  const [qrOpen, setQrOpen] = useState(false)
  const [joinOpen, setJoinOpen] = useState(false)
  const [addOpen, setAddOpen] = useState(false)
  const addPanelRef = useRef<HTMLDivElement>(null)

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

  useEffect(() => {
    if (!addOpen) return
    const handler = (e: MouseEvent) => {
      if (addPanelRef.current && !addPanelRef.current.contains(e.target as Node)) {
        setAddOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [addOpen])

  return (
    <>
      <div className='flex shrink-0 items-center justify-between border-b border-border-primary px-3 py-3'>
        <Button variant='ghost' size='sm' icon={<ArrowLeftIcon size={13} />} onClick={onBack}>
          {t('settings:pairing.pairedDevices')}
        </Button>
        <Button
          variant='ghost'
          size='sm'
          iconOnly
          aria-label={t('common:actions.close')}
          icon={<CloseIcon size={14} />}
          onClick={onClose}
        />
      </div>

      <div className='flex-1 overflow-y-auto'>
        {peers.length === 0 ? (
          <div className='flex h-full flex-col items-center justify-center px-6 py-10 text-center'>
            <img src={syncDevicesSvg} alt='' aria-hidden className='mb-6 w-[230px] opacity-90' />
            <p className='m-0 text-[17px] font-bold text-text-primary'>
              {t('settings:pairing.noPairedDevices')}
            </p>
            <p className='m-0 mt-2 max-w-[260px] text-[13px] leading-relaxed text-text-muted'>
              {t('settings:pairing.noPairedDevicesHint')}
            </p>
          </div>
        ) : (
          <div className='px-5 py-4'>
            <LinkCard>
              {peers.map((peer, index) => {
                const Icon = deviceIcon(peer.deviceType)
                return (
                  <LinkRow
                    key={peer.remoteDevicePubkey}
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
                            icon={<MoreVerticalIcon size={14} />}
                          />
                        }
                      >
                        {(close) => (
                          <ActionRow
                            compact
                            tone='danger'
                            icon={<TrashIcon />}
                            title={t('settings:pairing.removeDevice')}
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
                    isLast={index === peers.length - 1}
                  />
                )
              })}
            </LinkCard>
          </div>
        )}
      </div>

      <div ref={addPanelRef} className='relative shrink-0 border-t border-border-primary px-5 py-4'>
        {addOpen && (
          <div className='absolute bottom-full left-5 right-5 -mb-2 overflow-hidden rounded-[20px] border border-border-primary bg-surface-primary shadow-lg'>
            <ActionRow
              compact
              icon={<QrCodeIcon />}
              title={t('settings:pairing.showQrCode')}
              subtitle={t('settings:pairing.showQrCodeHint')}
              onClick={() => {
                setAddOpen(false)
                setQrOpen(true)
              }}
            />
            <div className='mx-4 h-px bg-border-primary' />
            <ActionRow
              compact
              icon={<ClipboardIcon />}
              title={t('settings:pairing.enterCode')}
              subtitle={t('settings:pairing.enterCodeHint')}
              onClick={() => {
                setAddOpen(false)
                setJoinOpen(true)
              }}
            />
          </div>
        )}
        <Button
          variant='primary'
          size='sm'
          width='full'
          icon={<PlusIcon size={14} />}
          onClick={() => setAddOpen((v) => !v)}
        >
          {t('settings:pairing.pairNewDevice')}
        </Button>
      </div>

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
    </>
  )
}
