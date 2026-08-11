import { useState } from 'react'
import { LinkRow, ToggleSwitch } from '@altersend/components'
import { useTranslation } from '@altersend/locales'
import { bridgeApi } from '../../../api/bridgeApi'
import { isRelayEnabled, setRelayEnabledStorage } from '../../../lifecycle/relayStorage'
import { SectionShell } from './SectionShell'

export function ConnectionSection() {
  const { t } = useTranslation(['settings'])
  const [relay, setRelay] = useState(isRelayEnabled)

  const handleRelayToggle = (next: boolean) => {
    setRelay(next)
    setRelayEnabledStorage(next)
    bridgeApi.worker.setRelayConfig({ enabled: next }).catch(() => {
      setRelay(!next)
      setRelayEnabledStorage(!next)
    })
  }

  return (
    <SectionShell title={t('settings:rows.connection')}>
      <LinkRow
        standalone
        compact
        label={t('settings:relay.label')}
        trailing={
          <ToggleSwitch
            checked={relay}
            onChange={handleRelayToggle}
            aria-label={t('settings:relay.label')}
          />
        }
      />
      <p className='m-0 mt-5 text-[12px] leading-5 text-text-muted'>
        {t('settings:relay.description')}
      </p>
    </SectionShell>
  )
}
