import { useState } from 'react'
import { ExternalLink, ToggleSwitch } from '@altersend/components'
import { useTranslation } from '@altersend/locales'
import { websiteUrl } from '@altersend/domain'
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
      <ToggleSwitch
        checked={relay}
        onChange={handleRelayToggle}
        label={t('settings:relay.label')}
        description={t('settings:relay.description')}
      />
      <p className='m-0 mt-5 text-[12px] leading-5 text-text-muted'>
        {t('settings:relay.fairUse')} {t('settings:relay.contact')}{' '}
        <ExternalLink onPress={() => bridgeApi.openExternalUrl(websiteUrl).catch(() => {})}>
          {t('settings:rows.contact')}
        </ExternalLink>
      </p>
    </SectionShell>
  )
}
