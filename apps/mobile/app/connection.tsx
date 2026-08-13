import { useMemo } from 'react'
import { Button, RelaySettingsCard } from '@altersend/components'
import { ClipboardIcon } from '@altersend/components/icons'
import { useTranslation } from '@altersend/locales'
import {
  relayErrorText,
  relaySettingsLabels,
  relayTestText,
  useRelaySettings
} from '@altersend/domain'
import { Layout } from '@/src/components'
import { relayStoragePort } from '@/src/lifecycle/relayStorage'
import { usePasteFromClipboard } from '@/src/hooks/usePasteFromClipboard'
import { mobileApi } from '@/src/api/mobileApi'

export default function ConnectionScreen() {
  const { t } = useTranslation(['settings', 'common'])
  const form = useRelaySettings({
    storage: relayStoragePort,
    send: (input) => mobileApi.worker.setRelayConfig(input),
    testConnection: () => mobileApi.worker.testCustomRelay()
  })

  const labels = useMemo(() => relaySettingsLabels(t), [t])

  const paste = usePasteFromClipboard(form.setCode)

  return (
    <Layout hasNativeHeader>
      <RelaySettingsCard
        form={form}
        labels={labels}
        iconSize={18}
        autoCapitalize='none'
        autoComplete='off'
        spellCheck={false}
        errorText={relayErrorText(t, form.error)}
        successText={relayTestText(t, form.testState, form.testMs)}
        pasteAction={
          <Button
            variant='ghost'
            size='sm'
            iconOnly
            aria-label={t('common:actions.paste')}
            icon={<ClipboardIcon size={18} />}
            onClick={paste}
          />
        }
      />
    </Layout>
  )
}
