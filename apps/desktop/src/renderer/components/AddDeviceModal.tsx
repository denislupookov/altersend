import { useEffect, useRef, useState } from 'react'
import { inviteDevice, inviteStatusSubtitle, InviteStatus, loadPeers, useTransferStore } from '@altersend/domain'
import { Button } from '@altersend/components'
import { CloseIcon, deviceIcon } from '@altersend/components/icons'

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
    else setInviteStatus({})
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
        className='flex w-full max-w-[400px] flex-col overflow-hidden rounded-[20px] border border-border-primary bg-background shadow-[0_32px_64px_color-mix(in_oklab,var(--as-color-scrim)_60%,transparent)]'
        onClick={(e) => e.stopPropagation()}
        style={{ animation: 'as-scale-in 240ms cubic-bezier(0.16, 1, 0.3, 1)' }}
      >
        <div className='flex items-center justify-between px-5 pb-3 pt-5'>
          <span className='text-[16px] font-bold text-text-primary'>Add a device</span>
          <button
            aria-label='Close'
            className='inline-flex h-8 w-8 cursor-pointer items-center justify-center rounded-full border-none bg-transparent p-0 text-text-muted transition-colors hover:bg-surface-primary hover:text-text-primary'
            onClick={onClose}
            style={{ appearance: 'none' }}
            type='button'
          >
            <CloseIcon size={14} />
          </button>
        </div>

        <div className='max-h-[320px] overflow-y-auto px-5 py-1'>
          {peers.length === 0 ? (
            <p className='m-0 py-3 text-[13px] leading-relaxed text-text-muted'>
              No paired devices yet. Pair a device to send without a code.
            </p>
          ) : (
            <div className='overflow-hidden rounded-[16px] border border-border-primary bg-background-subtle'>
              {peers.map((peer, index) => {
                const st = topic ? inviteStatus[peer.remoteDevicePubkey] : undefined
                const active = st === 'inviting' || st === 'sent'
                const subtitle = inviteStatusSubtitle(st)
                const Icon = deviceIcon(peer.deviceType)
                const subtitleColor = st === 'offline'
                  ? 'text-danger'
                  : active
                    ? 'text-success'
                    : 'text-text-muted'
                return (
                  <div key={peer.remoteDevicePubkey}>
                    <button
                      className={`flex w-full cursor-pointer items-center gap-3 border-none px-4 py-[13px] text-left transition-colors ${active ? 'bg-surface-primary' : 'bg-transparent hover:bg-surface-primary'}`}
                      disabled={active || !topic}
                      onClick={() => void invite(peer.remoteDevicePubkey)}
                      style={{ appearance: 'none' }}
                      type='button'
                    >
                      <div className='flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-surface-primary'>
                        <Icon size={16} />
                      </div>
                      <div className='min-w-0 flex-1'>
                        <p className='m-0 truncate text-[14px] font-medium leading-[18px] text-text-primary'>
                          {peer.displayName}
                        </p>
                        {subtitle ? (
                          <p className={`m-0 truncate text-[12px] leading-[16px] ${subtitleColor}`}>
                            {subtitle}
                          </p>
                        ) : null}
                      </div>
                    </button>
                    {index < peers.length - 1 ? (
                      <div className='ml-[60px] h-px bg-border-primary' />
                    ) : null}
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {onPairNew ? (
          <div className='px-5 pb-5 pt-3'>
            <Button onClick={onPairNew} size='sm' variant='secondary' width='full'>
              Pair New Device
            </Button>
          </div>
        ) : null}
      </div>
    </div>
  )
}
