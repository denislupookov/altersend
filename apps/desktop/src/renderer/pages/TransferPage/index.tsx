import { Tabs, TabsContent, TabsList, TabsTrigger } from '@altersend/components'
import { useTranslation } from '@altersend/locales'
import { Settings } from '../../components'
import { ReceivePage, SendPage } from '..'

type TransferTab = 'send' | 'receive'

export default function TransferPage({
  version,
  activeTab,
  onTabChange
}: {
  version: string
  activeTab: TransferTab
  onTabChange: (tab: TransferTab) => void
}) {
  const { t } = useTranslation(['common'])

  return (
    <main className='flex h-screen w-full flex-col bg-background text-text-primary'>
      <div className='h-8 w-full shrink-0' style={{ WebkitAppRegion: 'drag' }} />

      <section className='flex min-h-0 flex-1 flex-col px-6 pb-6 pt-8 max-[640px]:px-4'>
        <Tabs onValueChange={(v) => onTabChange(v as TransferTab)} value={activeTab}>
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

      <Settings version={version} />
    </main>
  )
}
