import { dismissInvite, useTransferStore } from '@altersend/domain'
import { Button } from '@altersend/components'
import { deviceIcon } from '@altersend/components/icons'

export function InviteBanner({ onAccept }: { onAccept: (topic: string) => void }) {
  const invite = useTransferStore((s) => s.remember.incomingInvite)

  if (!invite) return null

  const Icon = deviceIcon(invite.deviceType)

  return (
    <div className='pointer-events-none fixed inset-x-0 top-4 z-50 flex justify-center px-4'>
      <div className='pointer-events-auto flex items-center gap-3 rounded-full border border-border-primary bg-surface-secondary px-5 py-2.5 shadow-lg'>
        <div className='flex h-[22px] w-[22px] shrink-0 items-center justify-center rounded-full bg-info/15 text-info'>
          <Icon size={12} />
        </div>
        <span className='text-[13px] font-semibold text-text-primary'>
          {invite.displayName} wants to send to you
        </span>
        <Button onClick={() => dismissInvite()} size='sm' variant='ghost'>
          Dismiss
        </Button>
        <Button onClick={() => onAccept(invite.topic)} size='sm' variant='secondary'>
          Open
        </Button>
      </div>
    </div>
  )
}
