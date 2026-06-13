import { useEffect, useState } from 'react'
import { formatRelativeTime, loadPeers, useTransferStore } from '@altersend/domain'
import { Button } from '@altersend/components'
import { CloseIcon, deviceIcon } from '@altersend/components/icons'

interface AddDeviceModalProps {
  open: boolean
  onClose: () => void
  onPairNew?: () => void
}

export function AddDeviceModal({ open, onClose, onPairNew }: AddDeviceModalProps) {
  const peers = useTransferStore((s) => s.peers)
  const [invitingKey, setInvitingKey] = useState<string | null>(null)

  useEffect(() => {
    if (!open) {
      setInvitingKey(null)
      return
    }
    void loadPeers()
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

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
            <div className='flex flex-col gap-2'>
              {peers.map((peer) => {
                const Icon = deviceIcon(peer.deviceType)
                const isInviting = invitingKey === peer.remoteDevicePubkey
                return (
                  <button
                    key={peer.remoteDevicePubkey}
                    className={`flex cursor-pointer items-center gap-3.5 rounded-[12px] border px-3.5 py-3 text-left transition-colors ${
                      isInviting
                        ? 'border-info bg-info/8'
                        : 'border-transparent bg-surface-secondary hover:bg-surface-hover'
                    }`}
                    onClick={() => setInvitingKey(peer.remoteDevicePubkey)}
                    type='button'
                  >
                    <span className='flex h-[40px] w-[40px] shrink-0 items-center justify-center rounded-[10px] bg-surface-tertiary text-text-secondary'>
                      <Icon size={20} />
                    </span>
                    <span className='flex min-w-0 flex-col'>
                      <span className='truncate text-[14px] font-bold text-text-primary'>
                        {peer.displayName}
                      </span>
                      {isInviting ? (
                        <span className='flex items-center gap-2 text-[12px] text-info'>
                          <span className='h-3 w-3 animate-spin rounded-full border-2 border-info border-t-transparent' />
                          Inviting…
                        </span>
                      ) : (
                        <span className='text-[12px] text-text-muted'>
                          Last sent {formatRelativeTime(peer.lastSeenAt)}
                        </span>
                      )}
                    </span>
                  </button>
                )
              })}
            </div>
          )}
        </div>

        <div className='flex flex-col gap-2 px-6 pb-5 pt-3'>
          <Button onClick={onPairNew} size='sm' variant='secondary' width='full'>
            Pair New Device
          </Button>
          <Button onClick={onClose} size='sm' variant='ghost' width='full'>
            Done
          </Button>
        </div>
      </div>
    </div>
  )
}
