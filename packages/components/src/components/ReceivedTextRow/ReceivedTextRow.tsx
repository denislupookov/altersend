import { useLayoutEffect, useRef, useState, type CSSProperties } from 'react'
import { linkifyText } from '@altersend/domain'
import { CheckIcon, CopyIcon, MessageSquareIcon } from '../../icons'
import { useTheme } from '../../theme'
import { Button } from '../Button'
import { LinkRow } from '../LinkRow'

const TEXT_CLAMP_LINES = 5

export interface ReceivedTextRowProps {
  content: string
  isFirst?: boolean
  copied: boolean
  subtitleLabel: string
  copyLabel: string
  copiedLabel: string
  showMoreLabel: string
  showLessLabel: string
  onCopy: () => void
  onOpenLink: (url: string) => void
}

export function ReceivedTextRow({
  content,
  isFirst = false,
  copied,
  subtitleLabel,
  copyLabel,
  copiedLabel,
  showMoreLabel,
  showLessLabel,
  onCopy,
  onOpenLink
}: ReceivedTextRowProps) {
  const { theme } = useTheme()
  const [expanded, setExpanded] = useState(false)
  const [overflowing, setOverflowing] = useState(false)
  const textRef = useRef<HTMLParagraphElement>(null)

  useLayoutEffect(() => {
    const el = textRef.current
    if (el && !expanded) setOverflowing(el.scrollHeight > el.clientHeight + 1)
  }, [content, expanded])

  const clampStyle: CSSProperties | undefined = expanded
    ? undefined
    : {
        display: '-webkit-box',
        WebkitLineClamp: TEXT_CLAMP_LINES,
        WebkitBoxOrient: 'vertical',
        overflow: 'hidden'
      }

  return (
    <LinkRow
      bare
      compact
      alignTop
      isFirst={isFirst}
      icon={<MessageSquareIcon size={16} color={theme.colors.colorInfo} />}
      iconBackground={theme.colors.colorInfoSubtle}
      label={content}
      labelNode={
        <div>
          <p
            ref={textRef}
            className='m-0 whitespace-pre-wrap break-words text-[14px] font-medium leading-6 text-text-primary'
            style={clampStyle}
          >
            {linkifyText(content).map((seg, i) =>
              seg.url ? (
                <a
                  key={i}
                  href={seg.url}
                  className='cursor-pointer text-info underline'
                  onClick={(e) => {
                    e.preventDefault()
                    onOpenLink(seg.url as string)
                  }}
                >
                  {seg.text}
                </a>
              ) : (
                <span key={i}>{seg.text}</span>
              )
            )}
          </p>
          {overflowing || expanded ? (
            <button
              type='button'
              className='mt-1 cursor-pointer border-none bg-transparent p-0 text-[13px] font-medium text-info'
              onClick={() => setExpanded((v) => !v)}
            >
              {expanded ? showLessLabel : showMoreLabel}
            </button>
          ) : null}
        </div>
      }
      subtitle={subtitleLabel}
      subtitleTone='faint'
      trailing={
        <Button
          variant={copied ? 'success' : 'ghost'}
          size='sm'
          iconOnly
          aria-label={copied ? copiedLabel : copyLabel}
          onClick={onCopy}
          icon={copied ? <CheckIcon size={14} /> : <CopyIcon size={14} />}
        />
      }
    />
  )
}
