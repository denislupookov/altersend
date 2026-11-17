import { useState } from 'react'
import { StyleSheet, View } from 'react-native'
import { Button, useTheme } from '@altersend/components'
import { InfoIcon } from '@altersend/components/icons'
import { NATIVE_RELAY_MAX_LABEL } from '@altersend/domain'
import { useTranslation } from '@altersend/locales'
import { Text } from '@/src/components/ThemedText'
import { TryDirectSheet } from './TryDirectSheet'

interface RelayLimitNoteProps {
  onGetPro: () => void
  onTryAgain?: () => void
}

export function RelayLimitNote({ onGetPro, onTryAgain }: RelayLimitNoteProps) {
  const { t } = useTranslation(['receive', 'settings'])
  const { theme } = useTheme()
  const c = theme.colors
  const [isDirectOpen, setIsDirectOpen] = useState(false)

  return (
    <View style={[styles.note, { borderTopColor: c.colorBorderPrimary }]}>
      <Button
        variant='ghost'
        size='xs'
        iconOnly
        aria-label={t('receive:relayLimit.directTitle')}
        icon={<InfoIcon size={18} />}
        onClick={() => setIsDirectOpen(true)}
      />
      <Text numberOfLines={1} style={[styles.text, { color: c.colorTextMuted }]}>
        {t('receive:relayLimit.free', { limit: NATIVE_RELAY_MAX_LABEL })}
      </Text>
      <Button onClick={onGetPro} size='xs' variant='ghost'>
        {t('settings:account.getPro')}
      </Button>
      <TryDirectSheet
        open={isDirectOpen}
        onClose={() => setIsDirectOpen(false)}
        onTryAgain={onTryAgain}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  note: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    minHeight: 48,
    paddingHorizontal: 8,
    borderTopWidth: StyleSheet.hairlineWidth
  },
  text: { flex: 1, fontSize: 14, lineHeight: 18 }
})
