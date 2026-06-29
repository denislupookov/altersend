import { buildJoinUrl } from '@altersend/domain'
import { useTranslation } from '@altersend/locales'
import { Modal } from '../Modal'
import { QRCode } from '../QRCode'

interface QRModalProps {
  topic: string
  open: boolean
  onClose: () => void
}

export function QRModal({ topic, open, onClose }: QRModalProps) {
  const { t } = useTranslation(['send', 'common'])

  if (!topic) return null

  return (
    <Modal
      open={open}
      title={t('send:connection.scanToConnect')}
      subtitle={t('send:connection.qrModalDescription')}
      width={400}
      onClose={onClose}
    >
      <div className='flex justify-center px-4 pb-4 pt-3'>
        <div className='overflow-hidden rounded-[12px]'>
          <QRCode
            imageLabel={t('send:connection.qrCodeLabel')}
            loadingLabel={t('send:connection.generating')}
            size={240}
            value={buildJoinUrl(topic)}
          />
        </div>
      </div>
    </Modal>
  )
}
