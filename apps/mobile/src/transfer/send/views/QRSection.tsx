import { useEffect, useRef } from 'react'
import { Animated, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native'
import QRCode from 'react-native-qrcode-svg'
import { buildJoinUrl } from '@altersend/domain'
import { useTheme } from '@altersend/components'
import { useTranslation } from '@altersend/locales'
import { Text } from '@/src/components/ThemedText'

interface QRSectionProps {
  topic: string
  showWaitingState: boolean
  size?: number
  style?: StyleProp<ViewStyle>
}

export function QRSection({ topic, showWaitingState, size = 200, style }: QRSectionProps) {
  const { t } = useTranslation(['send'])
  const { theme } = useTheme()

  const pulseAnim = useRef(new Animated.Value(0.3)).current
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1, duration: 900, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 0.3, duration: 900, useNativeDriver: true })
      ])
    )
    loop.start()
    return () => loop.stop()
  }, [pulseAnim])

  return (
    <View style={[styles.qrSection, style]}>
      {topic ? (
        <View style={[styles.qrContainer, { backgroundColor: theme.colors.colorTextPrimary }]}>
          <QRCode
            value={buildJoinUrl(topic)}
            size={size}
            backgroundColor={theme.colors.colorTextPrimary}
            color={theme.colors.colorBackground}
          />
        </View>
      ) : (
        <View
          style={[
            styles.qrContainer,
            styles.qrPlaceholder,
            { backgroundColor: theme.colors.colorTextPrimary, height: size, width: size }
          ]}
        >
          <Text style={{ color: theme.colors.colorTextSecondary }}>
            {t('send:connection.generating')}
          </Text>
        </View>
      )}

      {showWaitingState && (
        <View style={styles.waitingIndicator}>
          <Animated.View
            style={[
              styles.waitingDot,
              { opacity: pulseAnim, backgroundColor: theme.colors.colorTextMuted }
            ]}
          />
          <Text style={[styles.waitingText, { color: theme.colors.colorTextMuted }]}>
            {t('send:connection.waitingForConnection')}
          </Text>
        </View>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  qrSection: { alignItems: 'center', paddingTop: 36 },
  qrContainer: { padding: 16, borderRadius: 12 },
  qrPlaceholder: { width: 200, height: 200, justifyContent: 'center', alignItems: 'center' },
  waitingIndicator: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 18 },
  waitingDot: { width: 6, height: 6, borderRadius: 3 },
  waitingText: { fontSize: 12 }
})
