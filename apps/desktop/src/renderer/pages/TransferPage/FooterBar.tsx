import { useEffect, useState } from 'react'
import {
  Button,
  ExternalLink,
  FeedbackTypeSelector,
  ToggleSwitch,
  getFontFamilyCssVariables
} from '@altersend/components'
import type { FeedbackType } from '@altersend/components'
import {
  LOCALE_OPTIONS,
  changeI18nLanguage,
  getLocaleFontFamily,
  normalizeLocalePreference,
  resolveLocalePreference,
  Trans,
  useTranslation,
  type LocaleOption,
  type LocalePreference
} from '@altersend/locales'
import {
  AlertCircleIcon,
  ArrowLeftIcon,
  ArrowUpRightIcon,
  ChevronRightIcon,
  CloseIcon,
  DiscordIcon,
  GithubIcon,
  GlobeIcon,
  SettingsIcon,
  SmartphoneIcon,
  deviceIcon
} from '@altersend/components/icons'
import {
  discordUrl,
  githubUrl,
  loadPeers,
  privacyPolicyUrl,
  termsOfServiceUrl,
  useTransferStore,
  websiteUrl
} from '@altersend/domain'
import logo from '../../../../../../assets/logo.png'
import { bridgeApi } from '../../api/bridgeApi'
import { Select } from '../../components/Select'
import { closeSentry, initSentry } from '../../sentry'
import {
  isCrashReportingEnabled,
  setCrashReportingEnabled
} from '../../lifecycle/crashReportingStorage'
import {
  getSavedLocalePreference,
  setSavedLocalePreference
} from '../../lifecycle/localePreferenceStorage'
import { getDesktopSystemLocales } from '../../lifecycle/systemLocale'

const DISCORD_EMBED_COLOR = 0x5865f2

function getLocaleOptionFontFamily(option: LocaleOption): string | undefined {
  if (!option.resolvedCode) return undefined
  return getFontFamilyCssVariables(getLocaleFontFamily(option.resolvedCode)).fontFamily
}

export function FooterBar({ version }: { version: string }) {
  const { t } = useTranslation(['settings', 'common', 'feedback'])
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [panel, setPanel] = useState<'settings' | 'report' | 'devices'>('settings')
  const peers = useTransferStore((s) => s.peers)

  useEffect(() => {
    if (settingsOpen) void loadPeers()
  }, [settingsOpen])
  const [reportType, setReportType] = useState<FeedbackType>('bug')
  const [reportMessage, setReportMessage] = useState('')
  const [reportState, setReportState] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle')
  const [crashReporting, setCrashReporting] = useState(isCrashReportingEnabled)
  const [localePreference, setLocalePreference] =
    useState<LocalePreference>(getSavedLocalePreference)

  const handleCrashReportingToggle = (next: boolean) => {
    setCrashReporting(next)
    setCrashReportingEnabled(next)
    if (next) initSentry()
    else closeSentry()
    void bridgeApi.setSentryEnabled(next)
  }

  const handleLocaleChange = (value: string) => {
    const preference = normalizeLocalePreference(value)
    setLocalePreference(preference)
    setSavedLocalePreference(preference)
    void changeI18nLanguage(resolveLocalePreference(preference, getDesktopSystemLocales()))
  }

  const closePanel = () => {
    setSettingsOpen(false)
    setPanel('settings')
    setReportType('bug')
    setReportMessage('')
    setReportState('idle')
  }

  const handleMenuAction = (key: 'feedback' | 'discord' | 'github' | 'website') => {
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
              title: t(`feedback:types.${reportType}`),
              description: reportMessage.trim(),
              color: DISCORD_EMBED_COLOR,
              fields: [
                { name: t('common:labels.version'), value: `v${version}`, inline: true },
                {
                  name: t('common:labels.platform'),
                  value: t('common:labels.desktop'),
                  inline: true
                }
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
            className='h-[20px] w-[20px] shrink-0 object-contain opacity-90'
          />
          <span className='truncate text-text-secondary'>AlterSend</span>
          <span className='ml-1 shrink-0 tabular-nums opacity-70'>v{version}</span>
        </div>

        <button
          aria-label={t('common:labels.settings')}
          title={t('common:labels.settings')}
          type='button'
          className='flex p-1.5 appearance-none items-center justify-center rounded-full border border-border-strong bg-surface-primary text-text-muted transition-colors hover:border-text-muted hover:text-text-primary'
          onClick={() => setSettingsOpen((v) => !v)}
        >
          <SettingsIcon size={14} />
        </button>
      </div>

      {/* Backdrop */}
      <div
        className={`fixed inset-0 z-40 transition-opacity duration-200 ${settingsOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}
        onClick={closePanel}
      />

      {/* Right sidebar */}
      <div
        className={`fixed inset-y-0 right-0 z-50 flex w-[360px] flex-col overflow-hidden border-l border-border-primary bg-surface-primary shadow-2xl transition-transform duration-200 ease-out ${settingsOpen ? 'translate-x-0' : 'translate-x-full'}`}
      >
        {panel === 'settings' ? (
          <>
            <div className='flex shrink-0 items-center justify-between border-b border-border-primary px-5 py-4'>
              <p className='m-0 text-[18px] font-semibold text-text-primary'>
                {t('settings:title')}
              </p>
              <button
                type='button'
                aria-label={t('common:actions.close')}
                onClick={closePanel}
                className='inline-flex h-7 w-7 cursor-pointer items-center justify-center rounded-full border-none bg-transparent p-0 text-text-primary transition-colors hover:bg-surface-secondary'
                style={{ appearance: 'none' }}
              >
                <CloseIcon size={14} />
              </button>
            </div>

            <div className='flex-1 overflow-y-auto'>
              <div className='px-5 pb-4 pt-5'>
                <ToggleSwitch
                  checked={crashReporting}
                  onChange={handleCrashReportingToggle}
                  label={t('settings:crashReports.label')}
                  description={t('settings:crashReports.description')}
                />
                <div className='mt-4'>
                  <label className='mb-2 block text-[13px] font-medium text-text-secondary'>
                    {t('common:labels.language')}
                  </label>
                  <Select
                    aria-label={t('common:labels.language')}
                    value={localePreference}
                    onChange={handleLocaleChange}
                    options={LOCALE_OPTIONS.map((option) => ({
                      value: option.preference,
                      label: option.nativeName
                        ? `${option.nativeName} · ${option.label}`
                        : t('common:labels.systemDefault'),
                      fontFamily: getLocaleOptionFontFamily(option)
                    }))}
                  />
                </div>
              </div>

              <div className='border-t border-border-primary py-1'>
                <button
                  type='button'
                  onClick={() => setPanel('devices')}
                  className='flex w-full appearance-none items-center gap-3 border-0 bg-transparent px-5 py-3 text-[14px] text-text-secondary transition-colors hover:bg-surface-secondary hover:text-text-primary'
                >
                  <SmartphoneIcon size={15} />
                  <span className='flex-1 text-left'>Paired devices</span>
                  <span className='text-[12px] text-text-muted'>
                    {peers.length === 0 ? 'No devices yet' : `${peers.length} paired`}
                  </span>
                  <ChevronRightIcon size={13} />
                </button>
                <button
                  type='button'
                  onClick={() => handleMenuAction('feedback')}
                  className='flex w-full appearance-none items-center gap-3 border-0 bg-transparent px-5 py-3 text-[14px] text-text-secondary transition-colors hover:bg-surface-secondary hover:text-text-primary'
                >
                  <AlertCircleIcon size={15} />
                  <span className='flex-1 text-left'>{t('settings:rows.feedback')}</span>
                  <ChevronRightIcon size={13} />
                </button>
              </div>

              <div className='border-t border-border-primary py-1'>
                {([
                  { icon: DiscordIcon, key: 'discord', label: t('settings:rows.discord') },
                  { icon: GithubIcon, key: 'github', label: 'GitHub' },
                  { icon: GlobeIcon, key: 'website', label: t('settings:rows.website') }
                ] as const).map(({ icon: Icon, key, label }) => (
                  <button
                    key={key}
                    type='button'
                    onClick={() => handleMenuAction(key)}
                    className='flex w-full appearance-none items-center gap-3 border-0 bg-transparent px-5 py-3 text-[14px] text-text-secondary transition-colors hover:bg-surface-secondary hover:text-text-primary'
                  >
                    <Icon size={15} />
                    <span className='flex-1 text-left'>{label}</span>
                    <ArrowUpRightIcon size={13} />
                  </button>
                ))}
              </div>
            </div>

            <div className='shrink-0 border-t border-border-primary px-5 py-4'>
              <p className='m-0 text-[12px] font-medium text-text-muted'>
                <Trans
                  ns='settings'
                  i18nKey='legal.sentence'
                  components={{
                    terms: (
                      <ExternalLink
                        onPress={() => void bridgeApi.openExternalUrl(termsOfServiceUrl)}
                      >
                        {null}
                      </ExternalLink>
                    ),
                    privacy: (
                      <ExternalLink
                        onPress={() => void bridgeApi.openExternalUrl(privacyPolicyUrl)}
                      >
                        {null}
                      </ExternalLink>
                    )
                  }}
                />
              </p>
            </div>
          </>
        ) : panel === 'devices' ? (
          <>
            <div className='flex shrink-0 items-center justify-between border-b border-border-primary px-3 py-3'>
              <Button
                variant='ghost'
                size='sm'
                icon={<ArrowLeftIcon size={13} />}
                onClick={() => setPanel('settings')}
              >
                Paired devices
              </Button>
              <button
                type='button'
                aria-label={t('common:actions.close')}
                onClick={closePanel}
                className='inline-flex h-7 w-7 cursor-pointer items-center justify-center rounded-full border-none bg-transparent p-0 text-text-primary transition-colors hover:bg-surface-secondary'
                style={{ appearance: 'none' }}
              >
                <CloseIcon size={14} />
              </button>
            </div>

            <div className='flex-1 overflow-y-auto'>
              {peers.length === 0 ? (
                <p className='m-0 px-5 py-4 text-[13px] leading-relaxed text-text-muted'>
                  No paired devices yet. Pair a device to send without a code.
                </p>
              ) : (
                <div className='px-5 py-4'>
                  <div className='overflow-hidden rounded-[16px] border border-border-primary bg-background-subtle'>
                    {peers.map((peer, index) => {
                      const Icon = deviceIcon(peer.deviceType)
                      return (
                        <div key={peer.remoteDevicePubkey}>
                          <div className='flex items-center gap-3 px-4 py-[13px]'>
                            <div className='flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-surface-primary'>
                              <Icon size={16} />
                            </div>
                            <p className='m-0 min-w-0 flex-1 truncate text-[14px] font-medium leading-[18px] text-text-primary'>
                              {peer.displayName}
                            </p>
                          </div>
                          {index < peers.length - 1 ? (
                            <div className='ml-[60px] h-px bg-border-primary' />
                          ) : null}
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}
            </div>
          </>
        ) : (
          <>
            <div className='flex shrink-0 items-center justify-between border-b border-border-primary px-3 py-3'>
              <Button
                variant='ghost'
                size='sm'
                icon={<ArrowLeftIcon size={13} />}
                onClick={() => {
                  setPanel('settings')
                  setReportState('idle')
                  setReportMessage('')
                  setReportType('bug')
                }}
              >
                {t('feedback:title')}
              </Button>
              <button
                type='button'
                aria-label={t('common:actions.close')}
                onClick={closePanel}
                className='inline-flex h-7 w-7 cursor-pointer items-center justify-center rounded-full border-none bg-transparent p-0 text-text-primary transition-colors hover:bg-surface-secondary'
                style={{ appearance: 'none' }}
              >
                <CloseIcon size={14} />
              </button>
            </div>

            <div className='flex-1 overflow-y-auto p-4'>
              {reportState === 'sent' ? (
                <p className='py-8 text-center text-[14px] text-text-secondary'>
                  {t('feedback:states.sent')}
                </p>
              ) : (
                <>
                  <div className='mb-3'>
                    <FeedbackTypeSelector
                      value={reportType}
                      onChange={setReportType}
                      labels={{
                        bug: t('feedback:types.bug'),
                        feature: t('feedback:types.feature'),
                        general: t('feedback:types.general')
                      }}
                      disabled={reportState === 'sending'}
                    />
                  </div>
                  <textarea
                    className='w-full resize-none rounded-lg border border-border-primary bg-surface-secondary px-3 py-3 font-sans text-[13px] text-text-primary placeholder:text-text-muted focus:border-border-strong focus:outline-none disabled:opacity-50'
                    rows={5}
                    placeholder={
                      reportType === 'bug'
                        ? t('feedback:placeholders.desktopBug')
                        : reportType === 'feature'
                          ? t('feedback:placeholders.desktopFeature')
                          : t('feedback:placeholders.general')
                    }
                    value={reportMessage}
                    disabled={reportState === 'sending'}
                    onChange={(e) => {
                      setReportMessage(e.target.value)
                      if (reportState === 'error') setReportState('idle')
                    }}
                  />
                  {reportState === 'error' && (
                    <p className='mt-1.5 text-[11px] text-danger'>
                      {t('feedback:states.failed')}
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
                      {reportState === 'sending'
                        ? t('feedback:actions.sending')
                        : t('feedback:actions.send')}
                    </Button>
                  </div>
                </>
              )}
            </div>
          </>
        )}
      </div>
    </footer>
  )
}
