import { useEffect, useRef, useState } from 'react'
import {
  AppearancePicker,
  Button,
  LinkCard,
  LinkRow,
  SYSTEM_THEME_PREFERENCE,
  ThemeType,
  ToggleSwitch,
  useTheme
} from '@altersend/components'
import { FolderIcon } from '@altersend/components/icons'
import { useTranslation } from '@altersend/locales'
import { bridgeApi } from '../../../api/bridgeApi'
import { useToast } from '../../Toast'
import { closeSentry, initSentry } from '../../../sentry'
import {
  isCrashReportingEnabled,
  setCrashReportingEnabled
} from '../../../lifecycle/crashReportingStorage'
import { isAskEveryTime, setAskEveryTime } from '../../../lifecycle/downloadLocationStorage'
import { SectionShell } from './SectionShell'

const MAX_PATH_CHARS = 52

function truncatePath(folder: string): string {
  if (folder.length <= MAX_PATH_CHARS) return folder
  const tail = folder.slice(-(MAX_PATH_CHARS - 1))
  const cut = tail.indexOf('/')
  return `…${cut > 0 ? tail.slice(cut) : tail}`
}

export function GeneralSection() {
  const { t } = useTranslation(['settings', 'errors', 'common'])
  const { theme, themePreference, setThemePreference } = useTheme()
  const c = theme.colors
  const toast = useToast()

  const appearanceLabels = {
    [ThemeType.Light]: t('settings:appearance.light'),
    [ThemeType.Dark]: t('settings:appearance.dark'),
    [SYSTEM_THEME_PREFERENCE]: t('settings:appearance.system')
  }

  const [folder, setFolder] = useState<string | null>(null)
  const [askEveryTime, setAsk] = useState(isAskEveryTime)
  const [crashReporting, setCrashReporting] = useState(isCrashReportingEnabled)
  const [shareExtension, setShareExtension] = useState<ShareExtensionState>('unknown')
  const awaitingSettingsVisit = useRef(false)

  useEffect(() => {
    bridgeApi
      .getDownloadFolder()
      .then(setFolder)
      .catch((error) => console.error('GeneralSection: could not load download folder', error))
  }, [])

  useEffect(() => {
    if (bridgeApi.platform() !== 'darwin') return

    const check = () => {
      bridgeApi
        .shareExtensionState()
        .then(setShareExtension)
        .catch((error) => console.error('GeneralSection: could not read share menu state', error))
    }

    const recheckAfterSettingsVisit = () => {
      if (!awaitingSettingsVisit.current) return
      awaitingSettingsVisit.current = false
      check()
    }

    check()
    window.addEventListener('focus', recheckAfterSettingsVisit)
    return () => window.removeEventListener('focus', recheckAfterSettingsVisit)
  }, [])

  const handleChangeFolder = async () => {
    try {
      const picked = await bridgeApi.chooseDownloadFolder()
      if (picked) setFolder(picked)
    } catch (error) {
      console.error('GeneralSection: could not save download folder', error)
      toast.show({ title: t('settings:downloads.changeFailed'), variant: 'error' })
    }
  }

  const handleAutoSaveToggle = (next: boolean) => {
    setAsk(!next)
    setAskEveryTime(!next)
  }

  const handleShareMenuToggle = () => {
    awaitingSettingsVisit.current = true
    bridgeApi
      .openShareSettings()
      .catch((error) => console.error('GeneralSection: could not open share settings', error))
  }

  const handleCrashToggle = (next: boolean) => {
    const apply = (value: boolean) => {
      setCrashReporting(value)
      setCrashReportingEnabled(value)
      if (value) initSentry()
      else closeSentry()
    }

    apply(next)
    bridgeApi.setSentryEnabled(next).catch((error) => {
      console.error('GeneralSection: could not sync crash reporting to main', error)
      apply(!next)
    })
  }

  return (
    <SectionShell title={t('settings:sections.general')}>
      <div className='flex flex-col gap-2.5'>
        <LinkCard>
          <LinkRow
            compact
            isLast={askEveryTime}
            label={t('settings:downloads.autoSaveLabel')}
            trailing={
              <ToggleSwitch
                checked={!askEveryTime}
                onChange={handleAutoSaveToggle}
                aria-label={t('settings:downloads.autoSaveLabel')}
              />
            }
          />
          {askEveryTime ? null : (
            <LinkRow
              compact
              isLast
              icon={<FolderIcon size={16} color={c.colorTextMuted} />}
              label={folder ? truncatePath(folder) : t('settings:downloads.chooseFolder')}
              trailing={
                <Button
                  size='sm'
                  variant='outline'
                  onClick={() => handleChangeFolder().catch(console.error)}
                >
                  {t('settings:downloads.change')}
                </Button>
              }
            />
          )}
        </LinkCard>

        <LinkCard>
          {shareExtension !== 'unknown' && (
            <LinkRow
              compact
              label={t('settings:shareMenu.label')}
              subtitle={t('settings:shareMenu.description')}
              trailing={
                <ToggleSwitch
                  checked={shareExtension === 'enabled'}
                  onChange={handleShareMenuToggle}
                  aria-label={t('settings:shareMenu.label')}
                />
              }
            />
          )}

          <LinkRow
            compact
            isLast
            label={t('settings:crashReports.label')}
            trailing={
              <ToggleSwitch
                checked={crashReporting}
                onChange={handleCrashToggle}
                aria-label={t('settings:crashReports.label')}
              />
            }
          />
        </LinkCard>

        <div className='mt-3 flex flex-col gap-2.5'>
          <h3 className='m-0 text-[16px] font-semibold text-text-primary'>
            {t('settings:appearance.title')}
          </h3>
          <AppearancePicker
            value={themePreference}
            labels={appearanceLabels}
            onChange={setThemePreference}
          />
        </div>
      </div>
    </SectionShell>
  )
}
