import { useState } from 'react'
import { ToggleSwitch } from '@altersend/components'
import { useTranslation } from '@altersend/locales'
import { bridgeApi } from '../../../api/bridgeApi'
import { closeSentry, initSentry } from '../../../sentry'
import {
  isCrashReportingEnabled,
  setCrashReportingEnabled
} from '../../../lifecycle/crashReportingStorage'
import { SectionShell } from './SectionShell'

export function SecuritySection() {
  const { t } = useTranslation(['settings'])
  const [crashReporting, setCrashReporting] = useState(isCrashReportingEnabled)

  const handleToggle = (next: boolean) => {
    setCrashReporting(next)
    setCrashReportingEnabled(next)
    if (next) {
      initSentry()
    } else {
      closeSentry()
    }
    bridgeApi.setSentryEnabled(next)
  }

  return (
    <SectionShell title={t('settings:rows.security')}>
      <ToggleSwitch
        checked={crashReporting}
        onChange={handleToggle}
        label={t('settings:crashReports.label')}
        description={t('settings:crashReports.description')}
      />
    </SectionShell>
  )
}
