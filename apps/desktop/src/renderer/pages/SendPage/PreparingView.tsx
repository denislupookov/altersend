import { LinkRow } from '@altersend/components'
import { useTranslation } from '@altersend/locales'
import {
  getOverallProgress,
  getProgressState,
  getStatusLabel,
  getStatusTone,
  useTransferStore
} from '@altersend/domain'

export function PreparingView() {
  const { t } = useTranslation(['send'])
  const uploadItems = useTransferStore((s) => s.uploadItems)
  const { completed, total, percent } = getOverallProgress(uploadItems)
  const allCompleted = completed === total && total > 0

  return (
    <div className='flex flex-col gap-4'>
      <div className='rounded-[10px] border border-border-primary bg-background-subtle px-4 py-4'>
        <div className='flex items-center justify-between gap-4'>
          <p className='m-0 text-[14px] font-medium text-text-primary'>
            {allCompleted ? t('send:status.uploadComplete') : t('send:status.uploadingFiles')}
          </p>
          <span className='tabular-nums text-[14px] font-semibold text-text-primary'>
            {percent}%
          </span>
        </div>
        <div className='mt-2.5 h-1.5 w-full overflow-hidden rounded-full bg-border-primary'>
          <div
            className={`h-full rounded-full transition-all duration-500 ease-out ${allCompleted ? 'bg-success' : 'bg-accent'}`}
            style={{ width: `${percent}%` }}
          />
        </div>
        <p className='m-0 mt-2 text-[12px] text-text-secondary'>
          {t('send:preparing.uploadedCount', { completed, count: total })}
        </p>
      </div>

      <div className='flex max-h-[280px] flex-col gap-1.5 overflow-y-auto'>
        {uploadItems.map((item) => {
          const progress = getProgressState(item)
          return (
            <LinkRow
              key={item.path}
              file
              standalone
              compact
              label={item.name}
              size={item.size}
              status={{
                label: getStatusLabel(t, item),
                tone: getStatusTone(item)
              }}
              progress={
                progress === 'waiting' || progress === 'uploading' || progress === 'completed'
                  ? progress
                  : undefined
              }
            />
          )
        })}
      </div>
    </div>
  )
}
