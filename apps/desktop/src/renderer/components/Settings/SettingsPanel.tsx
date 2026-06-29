import { useState } from 'react'
import { ExternalLink, ToggleSwitch, getFontFamilyCssVariables } from '@altersend/components'
import {
  AlertCircleIcon,
  ArrowUpRightIcon,
  ChevronRightIcon,
  CloseIcon,
  DiscordIcon,
  GithubIcon,
  GlobeIcon,
  SmartphoneIcon
} from '@altersend/components/icons'
import {
  LOCALE_OPTIONS,
  Trans,
  changeI18nLanguage,
  getLocaleFontFamily,
  normalizeLocalePreference,
  resolveLocalePreference,
  useTranslation,
  type LocaleOption,
  type LocalePreference
} from '@altersend/locales'
import {
  discordUrl,
  githubUrl,
  privacyPolicyUrl,
  termsOfServiceUrl,
  useTransferStore,
  websiteUrl
} from '@altersend/domain'
import { bridgeApi } from '../../api/bridgeApi'
import { Select } from '../Select'
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

function getLocaleOptionFontFamily(option: LocaleOption): string | undefined {
  if (!option.resolvedCode) return undefined
  return getFontFamilyCssVariables(getLocaleFontFamily(option.resolvedCode)).fontFamily
}

interface SettingsPanelProps {
  onNavigate: (panel: 'devices' | 'report') => void
  onClose: () => void
}

export function SettingsPanel({ onNavigate, onClose }: SettingsPanelProps) {
  const { t } = useTranslation(['settings', 'common'])
  const peers = useTransferStore((s) => s.peers)
  const [crashReporting, setCrashReporting] = useState(isCrashReportingEnabled)
  const [localePreference, setLocalePreference] =
    useState<LocalePreference>(getSavedLocalePreference)

  const handleCrashReportingToggle = (next: boolean) => {
    setCrashReporting(next)
    setCrashReportingEnabled(next)

    if (next) {
      initSentry()
    } else {
      closeSentry()
    }

    bridgeApi.setSentryEnabled(next)
  }

  const handleLocaleChange = (value: string) => {
    const preference = normalizeLocalePreference(value)

    setLocalePreference(preference)
    setSavedLocalePreference(preference)

    changeI18nLanguage(resolveLocalePreference(preference, getDesktopSystemLocales()))
  }

  return (
    <>
      <div className='flex shrink-0 items-center justify-between border-b border-border-primary px-5 py-4'>
        <p className='m-0 text-[18px] font-semibold text-text-primary'>{t('settings:title')}</p>
        <button
          type='button'
          aria-label={t('common:actions.close')}
          onClick={onClose}
          className='inline-flex h-7 w-7 cursor-pointer items-center justify-center rounded-[8px] border-none bg-transparent p-0 text-text-primary transition-colors hover:bg-surface-secondary'
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
            onClick={() => onNavigate('devices')}
            className='flex w-full appearance-none items-center gap-3 border-0 bg-transparent px-5 py-3 text-[14px] text-text-secondary transition-colors hover:bg-surface-secondary hover:text-text-primary'
          >
            <SmartphoneIcon size={15} />
            <span className='flex-1 text-left'>{t('settings:pairing.pairedDevices')}</span>
            <span className='text-[12px] text-text-muted'>
              {peers.length === 0
                ? t('settings:rows.noDevices')
                : t('settings:rows.pairedCount', { count: peers.length })}
            </span>
            <ChevronRightIcon size={13} />
          </button>
          <button
            type='button'
            onClick={() => onNavigate('report')}
            className='flex w-full appearance-none items-center gap-3 border-0 bg-transparent px-5 py-3 text-[14px] text-text-secondary transition-colors hover:bg-surface-secondary hover:text-text-primary'
          >
            <AlertCircleIcon size={15} />
            <span className='flex-1 text-left'>{t('settings:rows.feedback')}</span>
            <ChevronRightIcon size={13} />
          </button>
        </div>

        <div className='border-t border-border-primary py-1'>
          {[
            { icon: DiscordIcon, key: 'discord' as const, label: t('settings:rows.discord') },
            { icon: GithubIcon, key: 'github' as const, label: 'GitHub' },
            { icon: GlobeIcon, key: 'website' as const, label: t('settings:rows.website') }
          ].map(({ icon: Icon, key, label }) => (
            <button
              key={key}
              type='button'
              onClick={() => {
                if (key === 'discord') void bridgeApi.openExternalUrl(discordUrl)
                if (key === 'github') void bridgeApi.openExternalUrl(githubUrl)
                if (key === 'website') void bridgeApi.openExternalUrl(websiteUrl)
              }}
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
                <ExternalLink onPress={() => void bridgeApi.openExternalUrl(termsOfServiceUrl)}>
                  {null}
                </ExternalLink>
              ),
              privacy: (
                <ExternalLink onPress={() => void bridgeApi.openExternalUrl(privacyPolicyUrl)}>
                  {null}
                </ExternalLink>
              )
            }}
          />
        </p>
      </div>
    </>
  )
}
