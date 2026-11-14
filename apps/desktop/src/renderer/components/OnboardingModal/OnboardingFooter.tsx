import { Button, SegmentedProgress } from '@altersend/components'

export interface FooterAction {
  label: string
  onClick: () => void
  loading?: boolean
  disabled?: boolean
}

interface OnboardingFooterProps {
  index: number
  pageCount: number
  primary: FooterAction
  secondary?: FooterAction
}

export function OnboardingFooter({ index, pageCount, primary, secondary }: OnboardingFooterProps) {
  return (
    <div className='flex shrink-0 items-center justify-between px-8 pb-7 pt-4'>
      <div className='w-[120px]'>
        <SegmentedProgress count={pageCount} activeIndex={index} />
      </div>
      <div className='flex items-center gap-2'>
        {secondary ? (
          <Button
            size='md'
            variant='ghost'
            disabled={secondary.disabled}
            onClick={secondary.onClick}
          >
            {secondary.label}
          </Button>
        ) : null}
        <Button
          size='md'
          variant='light'
          loading={primary.loading}
          disabled={primary.disabled}
          onClick={primary.onClick}
        >
          {primary.label}
        </Button>
      </div>
    </div>
  )
}
