import { useTranslation } from '@altersend/locales'
import logo from '../../../../../../assets/logo.png'

export default function BridgeUnavailablePage() {
  const { t } = useTranslation(['errors', 'common'])

  return (
    <main className='flex h-screen w-full flex-col bg-background text-text-primary'>
      <div className='h-8 w-full shrink-0' style={{ WebkitAppRegion: 'drag' }} />

      <section className='flex min-h-0 flex-1 flex-col px-6 pb-6 pt-2 max-[640px]:px-4'>
        <div className='mx-auto flex h-full w-full max-w-[920px] flex-1 flex-col justify-center'>
          <div className='rounded-[10px] border border-border-primary bg-surface-primary px-4 py-4'>
            <h1 className='m-0 text-[14px] font-medium'>{t('errors:bridgeUnavailable.title')}</h1>
            <p className='mt-1 text-[13px] leading-5 text-text-secondary'>
              {t('errors:bridgeUnavailable.description')}
            </p>
          </div>
        </div>
      </section>

      <div
        role='status'
        aria-label={t('common:labels.statusBar')}
        className='shrink-0 border-t border-border-primary bg-background-subtle'
      >
        <div className='mx-auto flex h-8 w-full select-none items-center justify-between gap-3 px-3 text-[11px] text-text-muted'>
          <div className='flex min-w-0 items-center gap-2'>
            <img
              src={logo}
              alt='AlterSend'
              className='h-3.5 w-3.5 shrink-0 object-contain opacity-85'
            />
            <span className='truncate font-medium text-text-secondary'>AlterSend</span>
          </div>
          <div className='flex min-w-0 items-center justify-center gap-2 text-text-secondary'>
            <div className='h-1.5 w-1.5 shrink-0 rounded-full bg-danger' />
            <span className='truncate'>{t('errors:bridgeUnavailable.status')}</span>
          </div>
          <span className='shrink-0'>{t('common:labels.desktop')}</span>
        </div>
      </div>
    </main>
  )
}
