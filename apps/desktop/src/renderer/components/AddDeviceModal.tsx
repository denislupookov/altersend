import { useEffect, useRef, useState } from 'react'
import { inviteDevice, inviteStatusSubtitle, InviteStatus, loadPeers, useTransferStore } from '@altersend/domain'
import { Button, DeviceRow } from '@altersend/components'
import { CloseIcon } from '@altersend/components/icons'

interface AddDeviceModalProps {
  open: boolean
  onClose: () => void
  onPairNew?: () => void
  topic?: string
}

export function AddDeviceModal({ open, onClose, onPairNew, topic }: AddDeviceModalProps) {
  const peers = useTransferStore((s) => s.peers)
  const selectedFiles = useTransferStore((s) => s.selectedFiles)
  const [inviteStatus, setInviteStatus] = useState<Record<string, InviteStatus>>({})
  const onCloseRef = useRef(onClose)
  useEffect(() => { onCloseRef.current = onClose })

  useEffect(() => {
    if (open) void loadPeers()
    else {
      setInviteStatus({})
    }
  }, [open])

  const invite = async (pubkey: string) => {
    if (!topic || inviteStatus[pubkey] === 'inviting') return
    setInviteStatus((s) => ({ ...s, [pubkey]: 'inviting' }))
    try {
      const fileInfo = selectedFiles.length > 0
        ? { fileCount: selectedFiles.length, totalSize: selectedFiles.reduce((s, f) => s + (f.size ?? 0), 0) }
        : undefined
      const delivered = await inviteDevice(pubkey, topic, fileInfo)
      setInviteStatus((s) => ({ ...s, [pubkey]: delivered ? 'sent' : 'offline' }))
    } catch {
      setInviteStatus((s) => ({ ...s, [pubkey]: 'offline' }))
    }
  }

  useEffect(() => {
    if (!open) return
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onCloseRef.current()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open])

  if (!open) return null

  return (
    <div
      aria-modal='true'
      className='fixed inset-0 z-50 flex items-center justify-center p-6'
      onClick={onClose}
      role='dialog'
      style={{
        animation: 'as-fade-in 180ms ease-out',
        backgroundColor: 'color-mix(in oklab, var(--as-color-scrim) 60%, transparent)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)'
      }}
    >
      <div
        className='flex w-full max-w-[400px] flex-col overflow-hidden rounded-[20px] border border-border-primary bg-background-subtle shadow-[0_32px_64px_color-mix(in_oklab,var(--as-color-scrim)_60%,transparent)]'
        onClick={(event) => event.stopPropagation()}
        style={{ animation: 'as-scale-in 240ms cubic-bezier(0.16, 1, 0.3, 1)' }}
      >
        <div className='relative flex items-center justify-between px-6 pb-2 pt-5'>
          <span className='text-[18px] font-bold text-text-primary'>Add a device</span>
          <button
            aria-label='Close'
            className='inline-flex h-7 w-7 cursor-pointer items-center justify-center rounded-full border-none bg-transparent p-0 text-text-muted transition-colors hover:bg-surface-secondary hover:text-text-primary'
            onClick={onClose}
            style={{ appearance: 'none' }}
            type='button'
          >
            <CloseIcon size={14} />
          </button>
        </div>

        <div className='max-h-[320px] overflow-y-auto px-6 py-2'>
          {peers.length === 0 ? (
            <p className='m-0 py-4 text-[13px] leading-relaxed text-text-muted'>
              No paired devices yet. Pair a device to send without a code.
            </p>
          ) : (
            <div className='overflow-hidden rounded-[12px] border border-border-primary bg-background-subtle'>
              {peers.map((peer) => {
                const st = topic ? inviteStatus[peer.remoteDevicePubkey] : undefined
                const isActive = st === 'inviting' || st === 'sent'
                const subtitle = inviteStatusSubtitle(st, peer.lastSeenAt)
                return (
                  <div key={peer.remoteDevicePubkey}>
                    <div className='px-2.5'>
                      <DeviceRow
                        deviceType={peer.deviceType}
                        name={peer.displayName}
                        subtitle={subtitle}
                        subtitleVariant={isActive ? 'active' : 'default'}
                        isActive={isActive}
                        trailing={topic ? (
                          <Button
                            disabled={st === 'inviting' || st === 'sent'}
                            onClick={() => void invite(peer.remoteDevicePubkey)}
                            size='sm'
                            variant='secondary'
                          >
                            {st === 'sent' ? 'Sent' : 'Invite'}
                          </Button>
                        ) : undefined}
                      />
                    </div>
                    {peer !== peers[peers.length - 1] ? (
                      <div className='ml-2.5 h-px bg-border-primary' />
                    ) : null}
                  </div>
                )
              })}
            </div>
          )}
        </div>

        <div className='flex flex-col gap-2 px-6 pb-5 pt-3'>
          {onPairNew ? (
            <Button onClick={onPairNew} size='sm' variant='secondary' width='full'>
              Pair New Device
            </Button>
          ) : null}
          <Button onClick={onClose} size='sm' variant='ghost' width='full'>
            Done
          </Button>
        </div>
      </div>
    </div>
  )
}
