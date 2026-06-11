import { useTranslation } from '@altersend/locales'
import logo from '../../../../../../assets/logo.png'
import loadingSvg from '../../../../../../assets/loading.svg'

interface LoadingPageProps {
  progress?: number
}

export default function LoadingPage({ progress = 0 }: LoadingPageProps) {
  const { t } = useTranslation(['common'])
  const clamped = Math.max(0, Math.min(100, progress))
  const taglineLines = t('common:app.loadingTagline').split('\n')

  return (
    <main className='flex h-screen w-full flex-col overflow-hidden bg-background text-text-primary'>
      <div className='h-10 w-full shrink-0' style={{ WebkitAppRegion: 'drag' }} />

      <div className='mt-3 flex shrink-0 items-center px-6'>
        <div className='flex items-center gap-2.5'>
          <img src={logo} alt='AlterSend' className='h-7 w-7 object-contain' />
          <span className='text-[20px] font-bold tracking-[-0.02em] text-text-primary'>
            AlterSend
          </span>
        </div>
      </div>

      <div className='flex min-h-0 flex-1 flex-col items-center justify-center px-8 py-6'>
        <img src={loadingSvg} alt='' className='block h-auto max-h-[200px] max-w-[280px] w-auto' />
        <h1 className='mb-0 mt-9 max-w-[460px] text-center text-[30px] font-bold leading-[1.1] tracking-[-0.03em] text-text-primary'>
          {t('common:app.welcome')}
        </h1>
        <p className='mt-3 max-w-[420px] text-center text-[13px] leading-[1.6] text-text-secondary'>
          {taglineLines.map((line, index) => (
            <span key={`${index}-${line}`}>
              {line}
              {index < taglineLines.length - 1 ? <br /> : null}
            </span>
          ))}
        </p>
      </div>

      <div className='flex shrink-0 flex-col items-center px-8 pb-[76px]'>
        <div className='h-[10px] w-full max-w-[360px] overflow-hidden rounded-full bg-border-primary'>
          <div
            className='h-full rounded-full bg-accent transition-[width] duration-100 ease-out'
            style={{ width: `${clamped}%` }}
          />
        </div>
      </div>
    </main>
  )
}
