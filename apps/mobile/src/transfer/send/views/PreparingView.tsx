import { StyleSheet, View } from 'react-native'
import { WaitingState } from '@altersend/components'
import { SendIcon } from '@altersend/components/icons'
import { useTranslation } from '@altersend/locales'

export function PreparingView() {
  const { t } = useTranslation(['send'])

  return (
    <View style={styles.container}>
      <WaitingState
        icon={<SendIcon size={30} />}
        title={t('send:page.preparing.title')}
        description={t('send:page.preparing.description')}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingBottom: 120
  }
})
