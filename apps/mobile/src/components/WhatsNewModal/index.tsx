import Constants from 'expo-constants'
import { Modal, ScrollView, StyleSheet, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Button, useTheme } from '@altersend/components'
import { highlightsForPlatform, type ReleaseNote } from '@altersend/domain'
import { useTranslation } from '@altersend/locales'
import { IconButton } from '../IconButton'
import { Text } from '../ThemedText'
import UpdateSvg from '../../../../../assets/update.svg'

interface WhatsNewModalProps {
  release: ReleaseNote | null
  open: boolean
  onClose: () => void
}

export function WhatsNewModal({ release, open, onClose }: WhatsNewModalProps) {
  const { t } = useTranslation(['common'])
  const { theme } = useTheme()
  const c = theme.colors
  const insets = useSafeAreaInsets()
  const version = Constants.expoConfig?.version ?? ''
  const highlights = release ? highlightsForPlatform(release, 'mobile') : []

  return (
    <Modal
      visible={open && release !== null}
      animationType='slide'
      presentationStyle='pageSheet'
      onRequestClose={onClose}
    >
      {release ? (
        <View style={[styles.root, { backgroundColor: c.colorBackground }]}>
          <View
            style={[
              styles.hero,
              { backgroundColor: c.colorBackgroundDeep, borderBottomColor: c.colorBorderStrong }
            ]}
          >
            <UpdateSvg width={252} height={218} />
            <View style={styles.close}>
              <IconButton icon='close' label={t('common:actions.close')} onPress={onClose} />
            </View>
          </View>

          <ScrollView contentContainerStyle={styles.body}>
            <Text style={[styles.heading, { color: c.colorTextPrimary }]}>
              {t('common:whatsNew.heading', { version })}
            </Text>
            <Text style={[styles.subtitle, { color: c.colorTextMuted }]}>
              {t('common:whatsNew.subtitle', { count: highlights.length })}
            </Text>

            <View style={styles.highlights}>
              {highlights.map((highlight) => (
                <View key={highlight.key} style={styles.highlight}>
                  <View style={[styles.marker, { backgroundColor: c.colorTextFaint }]} />
                  <View style={styles.copy}>
                    <Text style={[styles.title, { color: c.colorTextPrimary }]}>
                      {t(highlight.titleKey)}
                    </Text>
                    <Text style={[styles.description, { color: c.colorTextMuted }]}>
                      {t(highlight.descriptionKey)}
                    </Text>
                  </View>
                </View>
              ))}
            </View>
          </ScrollView>

          <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 28) }]}>
            <Button variant='primary' size='lg' width='full' onClick={onClose}>
              {t('common:actions.continue')}
            </Button>
          </View>
        </View>
      ) : null}
    </Modal>
  )
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  hero: { alignItems: 'center', borderBottomWidth: 1, paddingTop: 24 },
  close: { position: 'absolute', right: 12, top: 12 },
  body: { paddingHorizontal: 20, paddingTop: 24, paddingBottom: 24 },
  heading: { fontSize: 25, fontWeight: '700', lineHeight: 31 },
  subtitle: { fontSize: 14, lineHeight: 20, marginTop: 6 },
  highlights: { marginTop: 26, gap: 20 },
  highlight: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  marker: { width: 14, height: 1, marginTop: 9 },
  copy: { flex: 1, minWidth: 0 },
  title: { fontSize: 15, fontWeight: '600', lineHeight: 19 },
  description: { fontSize: 14, lineHeight: 18, marginTop: 2 },
  footer: { paddingHorizontal: 20, paddingTop: 12 }
})
