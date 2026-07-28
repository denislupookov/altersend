import type { ReactNode } from 'react'
import { Button } from '@altersend/components'
import { Card } from '../Card'

const TONE_BG = {
  warning: 'bg-warning-subtle',
  success: 'bg-success-subtle'
} as const

export interface StatusCardAction {
  label: string
  icon?: ReactNode
  onClick: () => void
}

export function StatusCard({
  icon,
  tone,
  title,
  body,
  extra,
  primary,
  secondary
}: {
  icon: ReactNode
  tone: keyof typeof TONE_BG
  title?: string
  body: string
  extra?: ReactNode
  primary: StatusCardAction
  secondary?: StatusCardAction
}) {
  return (
    <Card>
      <div className='flex flex-col items-center text-center'>
        <span
          className={`flex h-14 w-14 items-center justify-center rounded-full ${TONE_BG[tone]}`}
        >
          {icon}
        </span>

        {title ? (
          <p className='m-0 mt-4 text-[17px] font-semibold text-text-primary'>{title}</p>
        ) : null}

        <p
          className={`m-0 ${title ? 'mt-2' : 'mt-4'} max-w-[420px] text-sm leading-relaxed text-text-muted`}
        >
          {body}
        </p>

        {extra}

        <div className='mt-5 flex w-full flex-col gap-2.5 sm:flex-row'>
          <div className={secondary ? 'sm:flex-[2]' : 'w-full'}>
            <Button
              variant='primary'
              size='lg'
              width='full'
              icon={primary.icon}
              onClick={primary.onClick}
            >
              {primary.label}
            </Button>
          </div>
          {secondary ? (
            <div className='sm:flex-1'>
              <Button
                variant='secondary'
                size='lg'
                width='full'
                icon={secondary.icon}
                onClick={secondary.onClick}
              >
                {secondary.label}
              </Button>
            </div>
          ) : null}
        </div>
      </div>
    </Card>
  )
}
