import { useState } from 'react'
import { Button, ExternalLink, FeedbackTypeSelector, ToggleSwitch } from '@altersend/components'
import type { FeedbackType } from '@altersend/components'
import {
  AlertCircleIcon,
  ArrowLeftIcon,
  ChevronRightIcon,
  DiscordIcon,
  GithubIcon,
  GlobeIcon,
  SettingsIcon
} from '@altersend/components/icons'
import {
  discordUrl,
  githubUrl,
  privacyPolicyUrl,
  termsOfServiceUrl,
  websiteUrl
} from '@altersend/domain'
import {
  MULTI_LANG_ENABLED,
  PICKABLE_LANGUAGES,
  useTranslation,
  changeLocale,
  type LocalePreference
} from '@altersend/locales'
import logo from '../../../../../../assets/logo.png'
import { bridgeApi } from '../../api/bridgeApi'
import { Select } from '../../components/Select'
import { closeSentry, initSentry } from '../../sentry'
import {
  isCrashReportingEnabled,
  setCrashReportingEnabled
} from '../../lifecycle/crashReportingStorage'
import { setSavedLocale } from '../../lifecycle/localeStorage'

const PLACEHOLDERS: Record<FeedbackType, string> = {
  'Bug report': 'Describe what went wrong…',
  'Feature request': 'What would you like to see?',
  General: 'Share your thoughts…'
}

const MENU_ITEMS = [
  { icon: AlertCircleIcon, label: 'Feedback', key: 'feedback', chevron: true },
  { icon: DiscordIcon, label: 'Discord', key: 'discord' },
  { icon: GithubIcon, label: 'GitHub', key: 'github' },
  { icon: GlobeIcon, label: 'Website', key: 'website' }
] as const

export function FooterBar({ version }: { version: string }) {
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [panel, setPanel] = useState<'settings' | 'report'>('settings')
  const [reportType, setReportType] = useState<FeedbackType>('Bug report')
  const [reportMessage, setReportMessage] = useState('')
  const [reportState, setReportState] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle')
  const [crashReporting, setCrashReporting] = useState(isCrashReportingEnabled)
  const { i18n } = useTranslation()
  const locale = i18n.language

  const handleCrashReportingToggle = (next: boolean) => {
    setCrashReporting(next)
    setCrashReportingEnabled(next)
    if (next) initSentry()
    else closeSentry()
    void bridgeApi.setSentryEnabled(next)
  }

  const closePanel = () => {
    setSettingsOpen(false)
    setPanel('settings')
    setReportType('Bug report')
    setReportMessage('')
    setReportState('idle')
  }

  const handleMenuAction = (key: (typeof MENU_ITEMS)[number]['key']) => {
    if (key === 'feedback') {
      setPanel('report')
      return
    }
    if (key === 'discord') void bridgeApi.openExternalUrl(discordUrl)
    if (key === 'github') void bridgeApi.openExternalUrl(githubUrl)
    if (key === 'website') void bridgeApi.openExternalUrl(websiteUrl)
  }

  const sendReport = async () => {
    const url = import.meta.env.VITE_DISCORD_WEBHOOK_URL
    if (!url || url.includes('PLACEHOLDER')) return
    setReportState('sending')
    try {
      await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          embeds: [
            {
              title: reportType,
              description: reportMessage.trim(),
              color: 0x5865f2,
              fields: [
                { name: 'Version', value: `v${version}`, inline: true },
                { name: 'Platform', value: 'Desktop', inline: true }
              ],
              timestamp: new Date().toISOString()
            }
          ]
        })
      })
      setReportState('sent')
    } catch {
      setReportState('error')
    }
  }

  return (
    <footer className='shrink-0 border-t border-border-primary/60 bg-surface-primary'>
      <div className='mx-auto flex w-full select-none items-center justify-between px-5 py-2 text-[12px] text-text-muted'>
        <div className='flex min-w-0 items-center gap-1.5'>
          <img
            src={logo}
            alt=''
            aria-hidden
            className='h-[26px] w-[26px] shrink-0 object-contain opacity-90'
          />
          <span className='truncate text-text-secondary'>AlterSend</span>
          <span className='ml-1 shrink-0 tabular-nums opacity-70'>v{version}</span>
        </div>

        <div className='relative'>
          <button
            aria-label='Settings'
            title='Settings'
            type='button'
            className='flex p-1.5 appearance-none items-center justify-center rounded-full border border-border-strong bg-surface-primary text-text-muted transition-colors hover:border-text-muted hover:text-text-primary'
            onClick={() => setSettingsOpen((v) => !v)}
          >
            <SettingsIcon size={14} />
          </button>

          {settingsOpen && (
            <>
              <div className='fixed inset-0' onClick={closePanel} />
              <div className='absolute bottom-[calc(100%+10px)] right-0 z-50 w-[350px] overflow-hidden rounded-xl border border-border-primary bg-surface-primary shadow-xl'>
                {panel === 'settings' ? (
                  <>
                    <div className='px-5 pb-4 pt-5'>
                      <p className='mb-4 mt-0 text-[11px] font-semibold uppercase tracking-widest text-text-muted'>
                        Settings
                      </p>
                      <ToggleSwitch
                        checked={crashReporting}
                        onChange={handleCrashReportingToggle}
                        label='Crash reports'
                        description='Share anonymous crash data to help improve AlterSend'
                      />
                      {MULTI_LANG_ENABLED && (
                        <div className='mt-3'>
                          <label className='mb-2 block text-[13px] font-medium text-text-secondary'>
                            Language
                          </label>
                          <Select
                            aria-label='Language'
                            value={locale}
                            onChange={async (value) => {
                              try {
                                await changeLocale(value as LocalePreference)
                                setSavedLocale(value as LocalePreference)
                              } catch (err) {
                                console.warn('Failed to change language', err)
                              }
                            }}
                            options={PICKABLE_LANGUAGES.map((l) => ({
                              value: l.code,
                              label: l.label
                            }))}
                          />
                        </div>
                      )}
                    </div>
                    <div className='border-t border-border-primary py-1'>
                      {MENU_ITEMS.map(({ icon: Icon, label, key, ...rest }) => (
                        <button
                          key={key}
                          type='button'
                          onClick={() => handleMenuAction(key)}
                          className='flex w-full appearance-none items-center gap-3 border-0 bg-transparent px-5 py-2.5 text-[14px] text-text-secondary transition-colors hover:bg-surface-secondary hover:text-text-primary'
                        >
                          <Icon size={15} />
                          <span className='flex-1 text-left'>{label}</span>
                          {'chevron' in rest && rest.chevron && <ChevronRightIcon size={13} />}
                        </button>
                      ))}
                    </div>
                    <div className='border-t border-border-primary px-5 py-4'>
                      <p className='m-0 font-medium text-[12px] text-text-muted'>
                        <ExternalLink
                          onPress={() => void bridgeApi.openExternalUrl(termsOfServiceUrl)}
                        >
                          Terms of Use
                        </ExternalLink>
                        {' and '}
                        <ExternalLink
                          onPress={() => void bridgeApi.openExternalUrl(privacyPolicyUrl)}
                        >
                          Privacy Statement
                        </ExternalLink>
                        {'.'}
                      </p>
                    </div>
                  </>
                ) : (
                  <div className='p-3'>
                    <div className='mb-3'>
                      <Button
                        variant='ghost'
                        size='sm'
                        icon={<ArrowLeftIcon size={13} />}
                        onClick={() => {
                          setPanel('settings')
                          setReportState('idle')
                          setReportMessage('')
                          setReportType('Bug report')
                        }}
                      >
                        Feedback
                      </Button>
                    </div>

                    {reportState === 'sent' ? (
                      <p className='py-8 text-center text-[14px] text-text-secondary'>
                        Thanks for your feedback!
                      </p>
                    ) : (
                      <>
                        <div className='mb-3'>
                          <FeedbackTypeSelector
                            value={reportType}
                            onChange={setReportType}
                            disabled={reportState === 'sending'}
                          />
                        </div>
                        <textarea
                          className='w-full resize-none rounded-lg border border-border-primary bg-surface-secondary px-3 py-3 font-sans text-[13px] text-text-primary placeholder:text-text-muted focus:border-border-strong focus:outline-none disabled:opacity-50'
                          rows={4}
                          placeholder={PLACEHOLDERS[reportType]}
                          value={reportMessage}
                          disabled={reportState === 'sending'}
                          onChange={(e) => {
                            setReportMessage(e.target.value)
                            if (reportState === 'error') setReportState('idle')
                          }}
                        />
                        {reportState === 'error' && (
                          <p className='mt-1.5 text-[11px] text-danger'>
                            Failed to send. Check your connection.
                          </p>
                        )}
                        <div className='mt-3'>
                          <Button
                            variant='primary'
                            size='sm'
                            width='full'
                            disabled={!reportMessage.trim() || reportState === 'sending'}
                            onClick={() => void sendReport()}
                          >
                            {reportState === 'sending' ? 'Sending…' : 'Send feedback'}
                          </Button>
                        </div>
                      </>
                    )}
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </footer>
  )
}
