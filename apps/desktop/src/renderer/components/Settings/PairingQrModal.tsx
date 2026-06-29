import { useEffect, useState } from 'react'
import { buildPairUrl } from '@altersend/domain'
import { useTranslation } from '@altersend/locales'
import { Modal } from '../Modal'
import { QRCode } from '../QRCode'
import { TopicCopyButton } from '../../pages/SendPage/TopicCopyButton'

interface PairingQrModalProps {
  open: boolean
  topic: string
  onClose: () => void
}

export function PairingQrModal({ open, topic, onClose }: PairingQrModalProps) {
  const { t } = useTranslation(['settings'])
  const [copied, setCopied] = useState(false)
  const pairUrl = topic ? buildPairUrl(topic) : ''

  useEffect(() => {
    if (!open) {
      setCopied(false)
    }
  }, [open])

  const handleCopy = async () => {
    if (!topic) return
    await navigator.clipboard.writeText(topic)
    setCopied(true)

    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <Modal open={open} title={t('settings:pairing.showQrCode')} width={636} onClose={onClose}>
      <div className='flex justify-center px-4 pb-2 pt-1'>
        <QRCode
          value={pairUrl}
          size={240}
          loadingLabel={t('settings:pairing.generating')}
          imageLabel='Pairing QR code'
        />
      </div>

      <div className='px-4 pb-2 pt-1'>
        <span className='text-[13px] font-medium text-text-muted'>
          {t('settings:pairing.orShareCode')}
        </span>
      </div>

      <div className='flex px-4 pb-4 pt-1'>
        <TopicCopyButton
          topic={topic}
          copied={copied}
          onCopy={() => {
            handleCopy().catch(() => {})
          }}
          placeholder={t('settings:pairing.generating')}
        />
      </div>
    </Modal>
  )
}
