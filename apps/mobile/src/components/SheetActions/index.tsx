import { StyleSheet, View } from 'react-native'
import { Button } from '@altersend/components'
import { useTranslation } from '@altersend/locales'

interface SheetActionsProps {
  primaryLabel: string
  onPrimary: () => void
  onClose: () => void
}

export function SheetActions({ primaryLabel, onPrimary, onClose }: SheetActionsProps) {
  const { t } = useTranslation(['common'])

  return (
    <View style={styles.actions}>
      <Button
        onClick={() => {
          onClose()
          onPrimary()
        }}
        size='lg'
        variant='light'
        width='full'
      >
        {primaryLabel}
      </Button>
      <Button onClick={onClose} size='lg' variant='ghost' width='full'>
        {t('common:actions.cancel')}
      </Button>
    </View>
  )
}

const styles = StyleSheet.create({
  actions: { marginTop: 8, gap: 8 }
})
