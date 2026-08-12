import { useEffect } from 'react'
import { Button } from '@altersend/components'
import { useTranslation } from '@altersend/locales'
import { useRouter } from 'expo-router'
import { clearSession } from '@altersend/domain'
import { mobileApi } from '@/src/api/mobileApi'
import { successTap } from '@/src/haptics'
import { Layout } from '@/src/components'
import { ReceiveCompleteView } from '@/src/transfer/receive'
import { exitToReceiveTab } from '@/src/transfer/receive/utils/exitToReceiveTab'
export default function ReceiveCompleteScreen() {
  const { t } = useTranslation(['receive', 'common'])
  const router = useRouter()

  useEffect(() => {
    successTap()
    void mobileApi.worker.closePeers().catch((err) => {
      console.warn('ReceiveCompleteScreen: closePeers failed', err)
    })
  }, [])

  const handleDone = () => {
    clearSession()
    exitToReceiveTab(router)
  }

  return (
    <Layout
      title={t('receive:page.completed.downloadsComplete')}
      description=''
      footer={
        <Button onClick={handleDone} size='lg' variant='primary' width='full'>
          {t('common:actions.done')}
        </Button>
      }
    >
      <ReceiveCompleteView />
    </Layout>
  )
}
