import { useTranslation } from '@altersend/locales'
import { LockIcon } from '@altersend/components/icons'

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
      className='flex min-w-0 flex-1 items-center gap-3 rounded-[8px] border border-border-primary bg-surface-primary px-3.5 py-2.5 text-left transition-colors hover:bg-surface-secondary disabled:cursor-not-allowed disabled:opacity-60'
      disabled={!topic}
      onClick={onCopy}
      type='button'
    >
      <span className='shrink-0 text-text-muted'>
        <LockIcon size={13} />
      </span>
      <span className='min-w-0 flex-1 truncate font-mono text-[12px] text-text-secondary'>
        {topic || placeholder}
      </span>
      <span
        className={`shrink-0 text-[12px] font-medium ${copied ? 'text-success' : 'text-text-muted'}`}
      >
        {copied ? t('common:actions.copied') : t('common:actions.copy')}
      </span>
    </button>
  )
}
