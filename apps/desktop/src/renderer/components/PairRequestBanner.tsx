import { useEffect, useState } from 'react'
import { rememberVote, useTransferStore } from '@altersend/domain'
import { Button } from '@altersend/components'
import { SmartphoneIcon } from '@altersend/components/icons'

export function PairRequestBanner() {
  const request = useTransferStore((s) => s.remember.incomingRequest)
  const [responded, setResponded] = useState(false)

  useEffect(() => {
    if (request) setResponded(false)
  }, [request])

  if (!request || responded) return null

  const respond = (vote: 'remember' | 'no') => {
    setResponded(true)
    void rememberVote(request.transferId, vote, false)
  }

  return (
    <div className='pointer-events-none fixed inset-x-0 top-4 z-50 flex justify-center px-4'>
      <div className='pointer-events-auto flex items-center gap-3 rounded-full border border-border-primary bg-surface-secondary px-5 py-2.5 shadow-lg'>
        <div className='flex h-[22px] w-[22px] shrink-0 items-center justify-center rounded-full bg-info/15 text-info'>
          <SmartphoneIcon size={12} />
        </div>
        <span className='text-[13px] font-semibold text-text-primary'>
          {request.displayName} wants to pair
        </span>
        <div className='flex items-center gap-2'>
          <Button onClick={() => respond('no')} size='sm' variant='ghost'>
            Decline
          </Button>
          <Button onClick={() => respond('remember')} size='sm' variant='primary'>
            Pair
          </Button>
        </div>
      </div>
    </div>
  )
}
