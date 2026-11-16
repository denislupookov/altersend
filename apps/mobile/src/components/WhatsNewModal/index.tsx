import Constants from 'expo-constants'
import { useRouter } from 'expo-router'
import { useState } from 'react'
import { Modal, ScrollView, StyleSheet, useWindowDimensions, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Button, useTheme } from '@altersend/components'
import { highlightsForPlatform, localDay, ratingDue, type ReleaseNote } from '@altersend/domain'
import { useTranslation } from '@altersend/locales'
import { RATE_AFTER_DISMISS_MS, requestStoreRating } from '../../lifecycle/storeRating'
import { readRatedDay, writeRatedDay } from '../../lifecycle/whatsNewStorage'
import { IconButton } from '../IconButton'
import { LaurelStars } from '../LaurelStars'
import { Text } from '../ThemedText'
import UpdateSvg from '../../../../../assets/update.svg'

interface WhatsNewModalProps {
  release: ReleaseNote | null
  open: boolean
  onClose: () => void
}

export function WhatsNewModal({ release, open, onClose }: WhatsNewModalProps) {
  return (
    <Modal
      visible={open && release !== null}
      animationType='slide'
      presentationStyle='pageSheet'
      onRequestClose={onClose}
    >
      {release ? <WhatsNewSheet release={release} onClose={onClose} /> : null}
    </Modal>
  )
}

type Page = 'news' | 'rate'

const LAUREL_MAX_WIDTH = 280

interface WhatsNewSheetProps {
  release: ReleaseNote
  onClose: () => void
}

function WhatsNewSheet({ release, onClose }: WhatsNewSheetProps) {
  const { t } = useTranslation(['common'])
  const { theme } = useTheme()
  const c = theme.colors
  const insets = useSafeAreaInsets()
  const { width } = useWindowDimensions()
  const router = useRouter()
  const version = Constants.expoConfig?.version ?? ''
  const highlights = highlightsForPlatform(release, 'mobile')
  const [offerRating] = useState(() => ratingDue(readRatedDay(), localDay()))
  const [page, setPage] = useState<Page>('news')

  const handleContinue = () => {
    if (offerRating) setPage('rate')
    else onClose()
  }

  const handleRate = () => {
    writeRatedDay(localDay())
    onClose()
    setTimeout(() => {
      requestStoreRating().catch((err) => console.warn('WhatsNewModal: rating failed', err))
    }, RATE_AFTER_DISMISS_MS)
  }

  const handleFeedback = () => {
    onClose()
    router.push('/report')
  }

  return (
    <View style={[styles.root, { backgroundColor: c.colorBackground }]}>
      <View style={styles.close}>
        <IconButton icon='close' label={t('common:actions.close')} onPress={onClose} />
      </View>

      {page === 'news' ? (
        <>
          <View
            style={[
              styles.hero,
              { backgroundColor: c.colorBackgroundDeep, borderBottomColor: c.colorBorderStrong }
            ]}
          >
            <UpdateSvg width={252} height={218} />
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
        </>
      ) : (
        <ScrollView contentContainerStyle={styles.rateBody}>
          <LaurelStars width={Math.min(LAUREL_MAX_WIDTH, width - 40)} color={c.colorTextPrimary} />
          <Text style={[styles.rateTitle, { color: c.colorTextPrimary }]}>
            {t('common:whatsNew.rate.title')}
          </Text>
          <Text style={[styles.rateLead, { color: c.colorTextMuted }]}>
            {t('common:whatsNew.rate.body')}
          </Text>
        </ScrollView>
      )}

      <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 28) }]}>
        {page === 'news' ? (
          <Button variant='primary' size='lg' width='full' onClick={handleContinue}>
            {t('common:actions.continue')}
          </Button>
        ) : (
          <>
            <View style={styles.feedback}>
              <Button variant='ghost' size='md' onClick={handleFeedback}>
                {t('common:whatsNew.rate.feedback')}
              </Button>
            </View>
            <Button variant='primary' size='lg' width='full' onClick={handleRate}>
              {t('common:whatsNew.rate.action')}
            </Button>
          </>
        )}
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  hero: { alignItems: 'center', borderBottomWidth: 1, paddingTop: 24 },
  close: { position: 'absolute', right: 12, top: 12, zIndex: 1 },
  body: { paddingHorizontal: 20, paddingTop: 24, paddingBottom: 24 },
  heading: { fontSize: 25, fontWeight: '700', lineHeight: 31 },
  subtitle: { fontSize: 14, lineHeight: 20, marginTop: 6 },
  highlights: { marginTop: 26, gap: 20 },
  highlight: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  marker: { width: 14, height: 1, marginTop: 9 },
  copy: { flex: 1, minWidth: 0 },
  title: { fontSize: 15, fontWeight: '600', lineHeight: 19 },
  description: { fontSize: 14, lineHeight: 18, marginTop: 2 },
  rateBody: {
    flexGrow: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingVertical: 24
  },
  rateTitle: {
    fontSize: 25,
    fontWeight: '700',
    lineHeight: 31,
    marginTop: 20,
    textAlign: 'center'
  },
  rateLead: { fontSize: 14, lineHeight: 20, marginTop: 8, maxWidth: 320, textAlign: 'center' },
  footer: { paddingHorizontal: 20, paddingTop: 12, gap: 8 },
  feedback: { alignItems: 'center' }
})
