import { StyleSheet, View } from 'react-native'
import { useTranslation } from '@altersend/locales'
import { IconButton } from '@/src/components/IconButton'
import { HEADER_TOP } from './constants'

export function DismissRow({ onDismiss }: { onDismiss: () => void }) {
  const { t } = useTranslation(['common'])

  return (
    <View style={styles.row}>
      <IconButton icon='close' size='large' label={t('common:actions.close')} onPress={onDismiss} />
    </View>
  )
}

const styles = StyleSheet.create({
  row: { alignItems: 'flex-end', paddingTop: HEADER_TOP }
})
