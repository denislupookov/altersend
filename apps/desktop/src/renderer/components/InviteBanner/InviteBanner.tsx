import { useEffect, useState } from 'react'
import { declineInvite, formatFileSize, useTransferStore } from '@altersend/domain'
import { Button } from '@altersend/components'
import { CheckIcon, CloseIcon, deviceIcon } from '@altersend/components/icons'

export function InviteBanner({ onAccept }: { onAccept: (topic: string) => void }) {
  const invite = useTransferStore((s) => s.remember.incomingInvite)
  const [accepted, setAccepted] = useState(false)

  useEffect(() => {
    if (invite) setAccepted(false)
  }, [invite])

  if (!invite || accepted) return null

  const Icon = deviceIcon(invite.deviceType)

  const fileLabel =
    invite.fileCount != null
      ? `${invite.fileCount} ${invite.fileCount === 1 ? 'file' : 'files'}`
      : 'files'
  const sizeLabel =
    invite.totalSize != null && invite.totalSize > 0 ? ` · ${formatFileSize(invite.totalSize)}` : ''

  const accept = () => {
    setAccepted(true)
    onAccept(invite.topic)
  }

  const decline = () => {
    declineInvite(invite)
  }

  return (
    <div
      className='fixed inset-0 z-50 flex justify-center pt-4'
      style={{
        backgroundColor: 'color-mix(in oklab, var(--as-color-scrim) 25%, transparent)',
        backdropFilter: 'blur(2px)',
        WebkitBackdropFilter: 'blur(2px)',
        animation: 'as-fade-in 180ms ease-out'
      }}
    >
      <div
        className='pointer-events-auto flex h-fit w-[280px] flex-col items-center gap-4 rounded-[24px] border border-border-primary bg-background px-5 py-6 shadow-[0_8px_32px_color-mix(in_oklab,var(--as-color-scrim)_40%,transparent)]'
        style={{ animation: 'as-scale-in 200ms cubic-bezier(0.16, 1, 0.3, 1)' }}
      >
        <div className='flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-surface-secondary'>
          <Icon size={22} />
        </div>

        <div className='text-center'>
          <p className='m-0 text-[14px] font-semibold leading-snug text-text-primary'>
            {invite.displayName}
          </p>
          <p className='m-0 mt-0.5 text-[12px] leading-snug text-text-secondary'>
            wants to send you {fileLabel}
            {sizeLabel}
          </p>
        </div>

        <div className='flex w-full gap-2'>
          <Button
            icon={<CloseIcon size={12} />}
            onClick={decline}
            pill
            size='sm'
            variant='danger'
            width='full'
          >
            Decline
          </Button>
          <Button
            icon={<CheckIcon size={12} />}
            onClick={accept}
            pill
            size='sm'
            variant='success'
            width='full'
          >
            Accept
          </Button>
        </div>
      </div>
    </div>
  )
}
