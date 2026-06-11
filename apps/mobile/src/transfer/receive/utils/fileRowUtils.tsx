import React from 'react'
import { Pressable, StyleSheet } from 'react-native'
import { getFileKind, useTheme } from '@altersend/components'
import { formatFileSize, type DownloadItemState } from '@altersend/domain'
import { useTranslation } from '@altersend/locales'
import { Text } from '@/src/components/ThemedText'

type Translate = ReturnType<typeof useTranslation>['t']

function getActionLabel(name: string, t: Translate): string {
  const kind = getFileKind(name)
  if (kind === 'image') return t('receive:actions.view')
  if (kind === 'video') return t('receive:actions.play')
  return t('receive:actions.open')
}

function getDestinationLabel(state: DownloadItemState | undefined, t: Translate): string {
  if (!state || state.destination === undefined) return ''
  if (state.destination === 'photos') return t('common:files.photos')
  return t('common:files.downloads')
}

export function getFileMeta(
  size: number,
  state: DownloadItemState | undefined,
  t: Translate,
  options?: { disabled?: boolean }
): string {
  if (options?.disabled) return t('receive:errors.didntArrive')
  const destination = getDestinationLabel(state, t)
  return destination ? `${destination} · ${formatFileSize(size)}` : formatFileSize(size)
}

interface OpenActionProps {
  fileName: string
  offerKey: string
  onPress: (offerKey: string) => void
}

export function OpenAction({ fileName, offerKey, onPress }: OpenActionProps) {
  const { t } = useTranslation(['receive'])
  const { theme } = useTheme()
  return (
    <Pressable
      onPress={() => onPress(offerKey)}
      style={({ pressed }) => [
        actionStyles.button,
        {
          borderColor: theme.colors.colorBorderPrimary,
          backgroundColor: pressed ? theme.colors.colorSurfaceSecondary : 'transparent'
        }
      ]}
    >
      <Text style={[actionStyles.label, { color: theme.colors.colorTextSecondary }]}>
        {getActionLabel(fileName, t)}
      </Text>
    </Pressable>
  )
}

const actionStyles = StyleSheet.create({
  button: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
    flexShrink: 0
  },
  label: {
    fontSize: 13,
    fontWeight: '500'
  }
})
