import { Button, Modal } from '@altersend/components'
import { CloseIcon } from '@altersend/components/icons'
import { highlightsForPlatform, type ReleaseNote } from '@altersend/domain'
import { useTranslation } from '@altersend/locales'
import updateSvg from '../../../../../../assets/update.svg'

interface WhatsNewModalProps {
  release: ReleaseNote | null
  version: string
  open: boolean
  onClose: () => void
}

export function WhatsNewModal({ release, version, open, onClose }: WhatsNewModalProps) {
  const { t } = useTranslation(['common'])

  if (!release) return null

  const highlights = highlightsForPlatform(release, 'desktop')

  return (
    <Modal closeLabel={t('common:actions.close')} open={open} size='lg' onClose={onClose}>
      <div className='relative flex justify-center border-b border-border-strong bg-background-deep px-6 pt-5'>
        <img src={updateSvg} alt='' aria-hidden className='w-[190px]' />
        <div className='absolute right-3 top-3'>
          <Button
            iconOnly
            aria-label={t('common:actions.close')}
            icon={<CloseIcon size={14} />}
            size='sm'
            variant='surface'
            onClick={onClose}
          />
        </div>
      </div>

      <div className='px-6 pt-5'>
        <h2 className='m-0 text-[24px] font-bold leading-tight text-text-primary'>
          {t('common:whatsNew.heading', { version })}
        </h2>
        <p className='m-0 mt-1 text-[13px] text-text-muted'>
          {t('common:whatsNew.subtitle', { count: highlights.length })}
        </p>
      </div>

      <div className='mt-4 flex flex-col gap-3.5 px-6 pb-1'>
        {highlights.map((highlight) => (
          <div key={highlight.key} className='flex items-start gap-3'>
            <span className='mt-2 h-px w-3 shrink-0 bg-text-faint' />
            <div className='min-w-0'>
              <p className='m-0 text-[14px] font-semibold leading-tight text-text-primary'>
                {t(highlight.titleKey)}
              </p>
              <p className='m-0 mt-1 text-[13px] leading-tight text-text-muted'>
                {t(highlight.descriptionKey)}
              </p>
            </div>
          </div>
        ))}
      </div>

      <div className='mt-4 flex justify-end border-t border-border-primary px-6 py-3.5'>
        <Button variant='light' size='md' onClick={onClose}>
          {t('common:actions.continue')}
        </Button>
      </div>
    </Modal>
  )
}
