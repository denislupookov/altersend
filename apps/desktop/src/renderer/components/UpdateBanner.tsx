import { ArrowUp, X } from 'lucide-react'
import { useState } from 'react'
import { bridgeApi } from '../api/bridgeApi'

export function UpdateBanner({ ready }: { ready: boolean }) {
  const [dismissed, setDismissed] = useState(false)
  const [restartFailed, setRestartFailed] = useState(false)

  if (!ready || dismissed) return null

  const restart = async () => {
    setRestartFailed(false)
    try {
      await bridgeApi.appRestart()
    } catch (err) {
      console.error('Failed to restart for update', err)
      setRestartFailed(true)
    }
  }

  return (
    <div className='pointer-events-none fixed inset-x-0 top-4 z-50 flex justify-center px-4'>
      <div className='pointer-events-auto flex items-center gap-2.5 rounded-full border border-border-primary bg-surface-secondary px-5 py-2.5 shadow-lg min-w-[260px]'>
        <div className='flex h-[22px] w-[22px] shrink-0 items-center justify-center rounded-full bg-info/15'>
          <ArrowUp size={12} className='text-info' aria-hidden />
        </div>
        <span className='flex-1 text-[13px] font-semibold text-text-primary'>
          {restartFailed ? 'Restart failed — please quit and reopen' : 'Update ready'}
        </span>
        <div className='flex items-center gap-2'>
          <button
            onClick={() => void restart()}
            className='appearance-none border-0 bg-transparent p-0 text-[13px] font-semibold text-info cursor-pointer'
          >
            Restart
          </button>
          <button
            aria-label='Dismiss'
            onClick={() => setDismissed(true)}
            className='flex appearance-none border-0 bg-transparent p-0 cursor-pointer text-text-secondary'
          >
            <X size={14} aria-hidden />
          </button>
        </div>
      </div>
    </div>
  )
}
