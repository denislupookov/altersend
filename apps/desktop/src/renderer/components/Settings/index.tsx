import { useEffect, useState } from 'react'
import { SettingsIcon } from '@altersend/components/icons'
import { loadPeers } from '@altersend/domain'
import { useTranslation } from '@altersend/locales'
import logo from '../../../../../../assets/logo.png'
import { SettingsPanel } from './SettingsPanel'
import { DevicesPanel } from './DevicesPanel'
import { FeedbackPanel } from './FeedbackPanel'
import { subscribeOpenSettings, type SettingsPanelView } from './settingsControl'

export { openSettingsPanel } from './settingsControl'

export function Settings({ version }: { version: string }) {
  const { t } = useTranslation(['common'])
  const [open, setOpen] = useState(false)
  const [panel, setPanel] = useState<SettingsPanelView>('settings')

  useEffect(() => {
    if (open) {
      loadPeers()
    }
  }, [open])

  useEffect(
    () =>
      subscribeOpenSettings((next) => {
        setPanel(next)
        setOpen(true)
      }),
    []
  )

  const close = () => {
    setOpen(false)
    setPanel('settings')
  }

  return (
    <footer className='shrink-0 border-t border-border-primary'>
      <div className='mx-auto flex w-full select-none items-center justify-between px-5 py-2 text-[12px] text-text-muted'>
        <div className='flex min-w-0 items-center gap-1.5'>
          <img
            src={logo}
            alt=''
            aria-hidden
            className='h-[20px] w-[20px] shrink-0 object-contain opacity-90'
          />
          <span className='truncate text-text-secondary'>AlterSend</span>
          <span className='ml-1 shrink-0 tabular-nums opacity-70'>v{version}</span>
        </div>
        <button
          aria-label={t('common:labels.settings')}
          title={t('common:labels.settings')}
          type='button'
          className='flex appearance-none items-center justify-center rounded-full border border-border-strong bg-transparent p-1.5 text-text-muted transition-colors hover:border-text-muted hover:text-text-primary cursor-pointer'
          onClick={() => setOpen((v) => !v)}
        >
          <SettingsIcon size={14} />
        </button>
      </div>

      <div
        className={`fixed inset-0 z-40 transition-opacity duration-200 ${open ? 'pointer-events-auto opacity-100' : 'pointer-events-none opacity-0'}`}
        onClick={close}
      />

      <div
        className={`fixed inset-y-0 right-0 z-50 flex w-[360px] flex-col overflow-hidden border-l border-border-primary bg-background-subtle shadow-2xl transition-transform duration-200 ease-out ${open ? 'translate-x-0' : 'translate-x-full'}`}
      >
        {panel === 'settings' ? (
          <SettingsPanel onNavigate={setPanel} onClose={close} />
        ) : panel === 'devices' ? (
          <DevicesPanel onBack={() => setPanel('settings')} onClose={close} />
        ) : (
          <FeedbackPanel version={version} onBack={() => setPanel('settings')} onClose={close} />
        )}
      </div>
    </footer>
  )
}
