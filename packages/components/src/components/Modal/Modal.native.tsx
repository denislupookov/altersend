import { Modal as RNModal, Pressable, StyleSheet, Text, View } from 'react-native'
import { ArrowLeftIcon, CloseIcon } from '../../icons'
import { radius, useTheme } from '../../theme'
import { withAlpha } from '../../theme/withAlpha'
import { widthForSize } from './sizes'
import type { ModalProps } from './types'

export function Modal({
  open,
  title,
  subtitle,
  size = 'md',
  closeLabel,
  backLabel,
  onClose,
  onBack,
  children
}: ModalProps) {
  const { theme } = useTheme()

  return (
    <RNModal visible={open} transparent animationType='fade' onRequestClose={onClose}>
      <Pressable
        style={[styles.backdrop, { backgroundColor: withAlpha(theme.colors.colorScrim, 0.45) }]}
        onPress={onClose}
      >
        <Pressable
          style={[
            styles.panel,
            {
              maxWidth: widthForSize[size],
              backgroundColor: theme.colors.colorBackground,
              borderColor: theme.colors.colorBorderPrimary
            }
          ]}
          onPress={() => {}}
        >
          {title || onBack ? (
            <View style={styles.header}>
              {onBack ? (
                <Pressable accessibilityLabel={backLabel} onPress={onBack} hitSlop={8}>
                  <ArrowLeftIcon size={18} color={theme.colors.colorTextMuted} />
                </Pressable>
              ) : null}
              <View style={styles.headerText}>
                <Text style={[styles.title, { color: theme.colors.colorTextPrimary }]}>
                  {title}
                </Text>
                {subtitle ? (
                  <Text style={[styles.subtitle, { color: theme.colors.colorTextMuted }]}>
                    {subtitle}
                  </Text>
                ) : null}
              </View>
              <Pressable accessibilityLabel={closeLabel} onPress={onClose} hitSlop={8}>
                <CloseIcon size={16} color={theme.colors.colorTextMuted} />
              </Pressable>
            </View>
          ) : null}
          {children}
        </Pressable>
      </Pressable>
    </RNModal>
  )
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  panel: { width: '100%', borderRadius: radius.radius2xl, borderWidth: 1, overflow: 'hidden' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 12
  },
  headerText: { flex: 1, minWidth: 0 },
  title: { fontSize: 16, fontWeight: '700' },
  subtitle: { fontSize: 13, lineHeight: 18, marginTop: 2 }
})
