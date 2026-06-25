import { useTranslation } from '@altersend/locales'
import { CheckIcon, CopyIcon, LockIcon } from '@altersend/components/icons'

interface TopicCopyButtonProps {
  topic: string
  copied: boolean
  onCopy: () => void
  placeholder: string
}

export function TopicCopyButton({ topic, copied, onCopy, placeholder }: TopicCopyButtonProps) {
  const { t } = useTranslation(['send', 'common'])

  return (
    <button
      aria-label={t('send:connection.copyLabel')}
      className='flex min-w-0 flex-1 items-center gap-3 rounded-[14px] border border-border-primary bg-background-subtle px-3.5 py-4 text-left transition-colors hover:bg-surface-primary disabled:cursor-not-allowed disabled:opacity-60'
      disabled={!topic}
      onClick={onCopy}
      type='button'
    >
      <span className='shrink-0 text-text-muted'>
        <LockIcon size={14} />
      </span>
      <span className='min-w-0 flex-1 truncate font-mono text-[13px] text-text-secondary'>
        {topic || placeholder}
      </span>
      <span className={`shrink-0 ${copied ? 'text-success' : 'text-text-muted'}`}>
        {copied ? <CheckIcon size={16} /> : <CopyIcon size={16} />}
      </span>
    </button>
  )
}
