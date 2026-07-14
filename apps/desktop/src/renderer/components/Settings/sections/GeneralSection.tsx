import { useEffect, useState, type ReactNode } from 'react'
import { Button, LinkRow, ToggleSwitch, useTheme } from '@altersend/components'
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

function Group({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div>
      <p className='m-0 mb-2 text-[13px] font-medium text-text-muted'>{title}</p>
      <div className='flex flex-col gap-2.5'>{children}</div>
    </div>
  )
}

export function GeneralSection() {
  const { t } = useTranslation(['settings', 'errors'])
  const { theme } = useTheme()
  const c = theme.colors
  const toast = useToast()

  const [folder, setFolder] = useState<string | null>(null)
  const [askEveryTime, setAsk] = useState(isAskEveryTime)
  const [crashReporting, setCrashReporting] = useState(isCrashReportingEnabled)

  useEffect(() => {
    bridgeApi
      .getDownloadFolder()
      .then(setFolder)
      .catch((error) => console.error('GeneralSection: could not load download folder', error))
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
      <div className='flex flex-col gap-6'>
        <Group title={t('settings:downloads.title')}>
          <LinkRow
            standalone
            compact
            subtitleWrap
            label={t('settings:downloads.autoSaveLabel')}
            subtitle={t('settings:downloads.autoSaveDescription')}
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
              standalone
              compact
              icon={<FolderIcon size={16} color={c.colorTextMuted} />}
              label={folder ? truncatePath(folder) : t('settings:downloads.chooseFolder')}
              trailing={
                <Button
                  size='sm'
                  variant='secondary'
                  onClick={() => handleChangeFolder().catch(console.error)}
                >
                  {t('settings:downloads.change')}
                </Button>
              }
            />
          )}
        </Group>

        <Group title={t('settings:sections.security')}>
          <LinkRow
            standalone
            compact
            subtitleWrap
            label={t('settings:crashReports.label')}
            subtitle={t('settings:crashReports.description')}
            trailing={
              <ToggleSwitch
                checked={crashReporting}
                onChange={handleCrashToggle}
                aria-label={t('settings:crashReports.label')}
              />
            }
          />
        </Group>
      </div>
    </SectionShell>
  )
}
