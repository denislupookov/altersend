import { useState } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@altersend/components'
import { clearSession, useTransferStore } from '@altersend/domain'
import { useTranslation } from '@altersend/locales'
import { FooterBar } from './FooterBar'
import { ReceivePage, SendPage } from '..'

type TransferTab = 'send' | 'receive'

export default function TransferPage({ version }: { version: string }) {
  const { t } = useTranslation(['common'])
  const role = useTransferStore((s) => s.role)
  const [userTab, setUserTab] = useState<TransferTab>('send')

  const handleTabChange = (value: string) => {
    const next = value as TransferTab
    if (next === userTab) return
    if (role !== null) {
      const message =
        role === 'sender'
          ? t('common:confirm.leaveShareSession')
          : t('common:confirm.leaveReceiveSession')
      if (!window.confirm(message)) return
      void clearSession()
    }
    setUserTab(next)
  }

  return (
    <main className='flex h-screen w-full flex-col bg-background text-text-primary'>
      <div className='h-8 w-full shrink-0' style={{ WebkitAppRegion: 'drag' }} />

      <section className='flex min-h-0 flex-1 flex-col px-6 pb-6 pt-8 max-[640px]:px-4'>
        <Tabs onValueChange={handleTabChange} value={userTab}>
          <div className='mx-auto flex h-full w-full max-w-[860px] flex-1 flex-col'>
            <div className='flex items-center gap-4'>
              <TabsList aria-label={t('common:labels.transferMode')}>
                <TabsTrigger value='send'>{t('common:labels.send')}</TabsTrigger>
                <TabsTrigger value='receive'>{t('common:labels.receive')}</TabsTrigger>
              </TabsList>
            </div>

            <section className='flex min-h-0 flex-1 flex-col overflow-hidden pt-4'>
              <div className='mx-auto flex min-h-0 w-full flex-1 flex-col gap-4'>
                <section className='flex min-h-0 flex-1 flex-col gap-4'>
                  <TabsContent value='send'>
                    <SendPage />
                  </TabsContent>

                  <TabsContent value='receive'>
                    <ReceivePage />
                  </TabsContent>
                </section>
              </div>
            </section>
          </div>
        </Tabs>
      </section>

      <FooterBar version={version} />
    </main>
  )
}
