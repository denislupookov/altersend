import { useMemo } from 'react'
import { RelaySettingsCard } from '@altersend/components'
import { useTranslation } from '@altersend/locales'
import {
  relayErrorText,
  relaySettingsLabels,
  relayTestText,
  selfHostSetupUrl,
  useRelaySettings
} from '@altersend/domain'
import { bridgeApi } from '../../../api/bridgeApi'
import { relayStoragePort } from '../../../lifecycle/relayStorage'
import { SectionShell } from './SectionShell'

export function ConnectionSection() {
  const { t } = useTranslation(['settings'])
  const form = useRelaySettings({
    storage: relayStoragePort,
    send: (input) => bridgeApi.worker.setRelayConfig(input),
    testConnection: () => bridgeApi.worker.testCustomRelay()
  })

  const labels = useMemo(() => relaySettingsLabels(t), [t])

  return (
    <SectionShell title={t('settings:rows.connection')}>
      <RelaySettingsCard
        form={form}
        labels={labels}
        errorText={relayErrorText(t, form.error)}
        successText={relayTestText(t, form.testState, form.testMs)}
        onOpenSetupGuide={() => {
          bridgeApi.openExternalUrl(selfHostSetupUrl).catch((err: unknown) => {
            console.warn('[relay] could not open setup guide', err)
          })
        }}
      />
    </SectionShell>
  )
}
