import { useEffect, useRef } from 'react'
import { Animated, Pressable, StyleSheet, View } from 'react-native'
import QRCode from 'react-native-qrcode-svg'
import { buildJoinUrl } from '@altersend/domain'
import { Input, useTheme } from '@altersend/components'
import { CheckIcon, CopyIcon } from '@altersend/components/icons'
import { useTranslation } from '@altersend/locales'
import { Text } from '@/src/components/ThemedText'

interface QRSectionProps {
  topic: string
  isKeyCopied: boolean
  onCopy: () => void
  showWaitingState: boolean
}

export function QRSection({ topic, isKeyCopied, onCopy, showWaitingState }: QRSectionProps) {
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

  const surfaceStyle = {
    backgroundColor: theme.colors.colorBackgroundSubtle,
    borderColor: theme.colors.colorBorderPrimary
  }

  return (
    <View style={[styles.qrSection, surfaceStyle]}>
      {topic ? (
        <View style={[styles.qrContainer, { backgroundColor: theme.colors.colorTextPrimary }]}>
          <QRCode
            value={buildJoinUrl(topic)}
            size={200}
            backgroundColor={theme.colors.colorTextPrimary}
            color={theme.colors.colorBackground}
          />
        </View>
      ) : (
        <View
          style={[
            styles.qrContainer,
            styles.qrPlaceholder,
            { backgroundColor: theme.colors.colorTextPrimary }
          ]}
        >
          <Text style={{ color: theme.colors.colorTextSecondary }}>
            {t('send:connection.generating')}
          </Text>
        </View>
      )}

      <View style={styles.keyContainer}>
        <Input
          mono
          readOnly
          secure
          placeholder={t('send:connection.placeholder')}
          value={topic}
          trailing={
            <Pressable
              onPress={onCopy}
              accessibilityRole='button'
              accessibilityLabel={t('send:connection.copyLabel')}
              style={({ pressed }) => [styles.copyButton, pressed && styles.copyButtonPressed]}
            >
              {isKeyCopied ? <CheckIcon size={16} /> : <CopyIcon size={16} />}
            </Pressable>
          }
        />
      </View>

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
  qrSection: {
    alignItems: 'center',
    padding: 24,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 16
  },
  qrContainer: {
    padding: 16,
    borderRadius: 12
  },
  qrPlaceholder: {
    width: 200,
    height: 200,
    justifyContent: 'center',
    alignItems: 'center'
  },
  keyContainer: {
    marginTop: 20,
    width: '100%'
  },
  waitingIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 16
  },
  waitingDot: {
    width: 6,
    height: 6,
    borderRadius: 3
  },
  waitingText: {
    fontSize: 12
  },
  copyButton: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center'
  },
  copyButtonPressed: {
    opacity: 0.55
  }
})
