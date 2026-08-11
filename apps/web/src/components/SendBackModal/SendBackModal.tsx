import { Badge, Button, Modal, useTheme } from '@altersend/components'
import { CheckIcon } from '@altersend/components/icons'
import { useTranslation } from '@altersend/locales'
import { openDownload } from '../../downloadApp'
import { useDownloadCta } from '../../useDownloadCta'
import { BrandMark } from '../BrandMark'

export interface SendBackModalProps {
  open: boolean
  onClose: () => void
}

export function SendBackModal({ open, onClose }: SendBackModalProps) {
  const { t } = useTranslation(['web', 'common'])
  const { theme } = useTheme()
  const { label, Icon } = useDownloadCta()

  return (
    <Modal open={open} onClose={onClose} size='sm' closeLabel={t('common:actions.close')}>
      <div className='flex flex-col items-center px-6 pb-7 pt-6 text-center'>
        <Badge pill tone='success' icon={<CheckIcon size={14} color={theme.colors.colorSuccess} />}>
          {t('web:download.allDownloaded')}
        </Badge>

        <div className='mt-5'>
          <BrandMark size='lg' />
        </div>

        <p className='m-0 mt-4 text-[18px] font-semibold text-text-primary'>
          {t('web:sendBack.title')}
        </p>
        <p className='m-0 mt-2 text-[14px] leading-relaxed text-text-muted'>
          {t('web:sendBack.description')}
        </p>

        <div className='mt-5 flex w-full flex-col gap-2'>
          <Button
            variant='primary'
            size='lg'
            width='full'
            icon={<Icon size={16} />}
            onClick={openDownload}
          >
            {label}
          </Button>

          <Button variant='ghost' size='sm' width='full' onClick={onClose}>
            {t('web:sendBack.maybeLater')}
          </Button>
        </div>
      </div>
    </Modal>
  )
}
