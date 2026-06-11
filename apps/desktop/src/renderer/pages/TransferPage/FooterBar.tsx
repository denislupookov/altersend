import { useState } from 'react'
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
  isMultiLangEnabled,
  normalizeLocalePreference,
  resolveActiveLocalePreference,
  Trans,
  useTranslation,
  type LocaleOption,
  type LocalePreference
} from '@altersend/locales'
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

const MENU_ITEMS = [
  { icon: AlertCircleIcon, key: 'feedback', chevron: true },
  { icon: DiscordIcon, key: 'discord' },
  { icon: GithubIcon, key: 'github' },
  { icon: GlobeIcon, key: 'website' }
] as const
const DISCORD_EMBED_COLOR = 0x5865f2

function getLocaleOptionFontFamily(option: LocaleOption): string | undefined {
  if (!option.resolvedCode) return undefined
  return getFontFamilyCssVariables(getLocaleFontFamily(option.resolvedCode)).fontFamily
}

export function FooterBar({ version }: { version: string }) {
  const { t } = useTranslation(['settings', 'common', 'feedback'])
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [panel, setPanel] = useState<'settings' | 'report'>('settings')
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
    void changeI18nLanguage(resolveActiveLocalePreference(preference, getDesktopSystemLocales()))
  }

  const closePanel = () => {
    setSettingsOpen(false)
    setPanel('settings')
    setReportType('bug')
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
            className='h-[26px] w-[26px] shrink-0 object-contain opacity-90'
          />
          <span className='truncate text-text-secondary'>AlterSend</span>
          <span className='ml-1 shrink-0 tabular-nums opacity-70'>v{version}</span>
        </div>

        <div className='relative'>
          <button
            aria-label={t('common:labels.settings')}
            title={t('common:labels.settings')}
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
                        {t('settings:title')}
                      </p>
                      <ToggleSwitch
                        checked={crashReporting}
                        onChange={handleCrashReportingToggle}
                        label={t('settings:crashReports.label')}
                        description={t('settings:crashReports.description')}
                      />
                      {isMultiLangEnabled && (
                        <div className='mt-3'>
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
                      )}
                    </div>
                    <div className='border-t border-border-primary py-1'>
                      {MENU_ITEMS.map(({ icon: Icon, key, ...rest }) => (
                        <button
                          key={key}
                          type='button'
                          onClick={() => handleMenuAction(key)}
                          className='flex w-full appearance-none items-center gap-3 border-0 bg-transparent px-5 py-2.5 text-[14px] text-text-secondary transition-colors hover:bg-surface-secondary hover:text-text-primary'
                        >
                          <Icon size={15} />
                          <span className='flex-1 text-left'>
                            {key === 'feedback'
                              ? t('settings:rows.feedback')
                              : key === 'discord'
                                ? t('settings:rows.discord')
                                : key === 'github'
                                  ? 'GitHub'
                                  : t('settings:rows.website')}
                          </span>
                          {'chevron' in rest && rest.chevron && <ChevronRightIcon size={13} />}
                        </button>
                      ))}
                    </div>
                    <div className='border-t border-border-primary px-5 py-4'>
                      <p className='m-0 font-medium text-[12px] text-text-muted'>
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
                          setReportType('bug')
                        }}
                      >
                        {t('feedback:title')}
                      </Button>
                    </div>

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
                          rows={4}
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
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </footer>
  )
}
