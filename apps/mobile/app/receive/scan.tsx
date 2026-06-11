import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { ActivityIndicator, Linking, Pressable, StyleSheet, View } from 'react-native'
import {
  CameraView,
  scanFromURLAsync,
  useCameraPermissions,
  type BarcodeScanningResult
} from 'expo-camera'
import * as ImagePicker from 'expo-image-picker'
import { Button, useTheme, withAlpha } from '@altersend/components'
import { ArrowLeftIcon, QrCodeIcon } from '@altersend/components/icons'
import { useTranslation } from '@altersend/locales'
import { useNavigation, useRouter } from 'expo-router'
import { extractJoinCode, useTransferStore } from '@altersend/domain'
import { joinSession } from '@altersend/domain'
import { Layout } from '@/src/components'
import { useToast } from '@/src/components/Toast'
import { Text } from '@/src/components/ThemedText'

export default function ReceiveScanScreen() {
  const { t } = useTranslation(['receive', 'common'])
  const { theme } = useTheme()
  const navigation = useNavigation()
  const router = useRouter()
  const toast = useToast()
  const role = useTransferStore((s) => s.role)
  const [permission, requestPermission] = useCameraPermissions()
  const [isResolving, setIsResolving] = useState(false)
  const invalidScanAtRef = useRef(0)
  const scanLockRef = useRef(false)

  const goBack = useCallback(() => {
    if (router.canGoBack()) {
      router.back()
      return
    }

    if (router.canDismiss()) {
      router.dismiss()
      return
    }

    router.replace('/receive')
  }, [router])

  useEffect(() => {
    navigation.setOptions({
      headerBackVisible: false,
      headerLeft: () => (
        <Pressable
          accessibilityLabel={t('common:actions.back')}
          accessibilityRole='button'
          hitSlop={12}
          onPress={goBack}
          style={({ pressed }) => ({
            paddingHorizontal: 8,
            paddingVertical: 4,
            opacity: pressed ? 0.6 : 1
          })}
        >
          <ArrowLeftIcon size={22} color={theme.colors.colorTextPrimary} />
        </Pressable>
      )
    })
  }, [goBack, navigation, t, theme.colors.colorTextPrimary])

  useEffect(() => {
    if (!permission) {
      void requestPermission()
    }
  }, [permission, requestPermission])

  const cameraGranted = permission?.granted ?? false
  const canAskAgain = permission?.canAskAgain ?? true
  const canScan = cameraGranted && !isResolving && role === null

  const resolveCode = useCallback(
    async (data: string, invalidHint: string) => {
      if (scanLockRef.current || role !== null) {
        return
      }

      const joinCode = extractJoinCode(data)

      if (!joinCode) {
        const now = Date.now()
        if (now - invalidScanAtRef.current > 1500) {
          invalidScanAtRef.current = now
          toast.show({
            title: t('receive:errors.unsupportedQrTitle'),
            hint: invalidHint,
            durationMs: 2500
          })
        }
        return
      }

      try {
        scanLockRef.current = true
        setIsResolving(true)
        await joinSession(joinCode)
        goBack()
      } catch (error) {
        console.warn('ReceiveScanScreen: joinSession failed', error)
        scanLockRef.current = false
        setIsResolving(false)
        toast.show({
          title: t('receive:errors.mobileJoinFailedTitle'),
          hint: t('receive:errors.mobileJoinFailedHint'),
          durationMs: 3500
        })
      }
    },
    [goBack, role, t, toast]
  )

  const handleBarcodeScanned = useCallback(
    ({ data }: BarcodeScanningResult) => {
      if (!canScan) return
      void resolveCode(data, t('receive:errors.unsupportedQrHint'))
    },
    [canScan, resolveCode, t]
  )

  const importFromImage = useCallback(async () => {
    if (scanLockRef.current || role !== null) {
      return
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: 'images',
      quality: 1
    })
    const asset = result.canceled ? null : result.assets[0]
    if (!asset) return

    try {
      const [scan] = await scanFromURLAsync(asset.uri, ['qr'])
      if (!scan) {
        toast.show({
          title: t('receive:errors.imageNoQrTitle'),
          hint: t('receive:errors.imageNoQrHint'),
          durationMs: 2500
        })
        return
      }
      await resolveCode(scan.data, t('receive:errors.imageUnsupportedQrHint'))
    } catch (error) {
      console.warn('ReceiveScanScreen: importFromImage failed', error)
      toast.show({ title: t('receive:errors.imageReadFailedTitle'), durationMs: 2500 })
    }
  }, [resolveCode, role, t, toast])

  const permissionCopy = useMemo(() => {
    if (!permission) {
      return {
        title: t('receive:camera.preparingTitle'),
        description: t('receive:camera.preparingDescription')
      }
    }

    if (!cameraGranted) {
      return {
        title: t('receive:camera.accessNeededTitle'),
        description: t('receive:camera.accessNeededDescription')
      }
    }

    return {
      title: t('receive:camera.scanImportTitle'),
      description: t('receive:camera.scanImportDescription')
    }
  }, [cameraGranted, permission, t])

  const handlePermissionAction = useCallback(async () => {
    if (canAskAgain) {
      await requestPermission()
      return
    }

    await Linking.openSettings()
  }, [canAskAgain, requestPermission])

  const permissionButtonLabel = canAskAgain
    ? t('receive:actions.allowCamera')
    : t('common:actions.openSettings')

  return (
    <Layout title={permissionCopy.title} description={permissionCopy.description} hasNativeHeader>
      {!permission || !cameraGranted ? (
        <View
          style={[
            styles.noticeCard,
            {
              backgroundColor: theme.colors.colorBackgroundSubtle,
              borderColor: theme.colors.colorBorderPrimary
            }
          ]}
        >
          <View
            style={[styles.iconBadge, { backgroundColor: withAlpha(theme.colors.colorInfo, 0.16) }]}
          >
            <QrCodeIcon size={24} color={theme.colors.colorInfo} />
          </View>
          <Text style={[styles.noticeTitle, { color: theme.colors.colorTextPrimary }]}>
            {t('receive:camera.enableTitle')}
          </Text>
          <Text style={[styles.noticeText, { color: theme.colors.colorTextSecondary }]}>
            {t('receive:camera.enableImportDescription')}
          </Text>
          <Button
            onClick={() => void handlePermissionAction()}
            size='lg'
            variant='primary'
            width='full'
          >
            {permissionButtonLabel}
          </Button>
          <Button onClick={() => void importFromImage()} size='lg' variant='secondary' width='full'>
            {t('receive:actions.importFromImage')}
          </Button>
          <Button onClick={goBack} size='lg' variant='secondary' width='full'>
            {t('receive:camera.usePastedCode')}
          </Button>
        </View>
      ) : (
        <View style={styles.content}>
          <View
            style={[
              styles.cameraShell,
              {
                backgroundColor: theme.colors.colorBackgroundSubtle,
                borderColor: theme.colors.colorBorderPrimary
              }
            ]}
          >
            <CameraView
              barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
              facing='back'
              onBarcodeScanned={canScan ? handleBarcodeScanned : undefined}
              style={styles.camera}
            />

            <View pointerEvents='none' style={styles.overlay}>
              <View
                style={[
                  styles.overlayMaskVertical,
                  { backgroundColor: withAlpha(theme.colors.colorScrim, 0.3) }
                ]}
              />
              <View style={styles.overlayMiddleRow}>
                <View
                  style={[
                    styles.overlayMaskSide,
                    { backgroundColor: withAlpha(theme.colors.colorScrim, 0.3) }
                  ]}
                />
                <View style={styles.frameRow}>
                  <View
                    style={[
                      styles.frameCorner,
                      styles.frameTopLeft,
                      { borderColor: theme.colors.colorTextPrimary }
                    ]}
                  />
                  <View
                    style={[
                      styles.frameCorner,
                      styles.frameTopRight,
                      { borderColor: theme.colors.colorTextPrimary }
                    ]}
                  />
                  <View
                    style={[
                      styles.frameCorner,
                      styles.frameBottomLeft,
                      { borderColor: theme.colors.colorTextPrimary }
                    ]}
                  />
                  <View
                    style={[
                      styles.frameCorner,
                      styles.frameBottomRight,
                      { borderColor: theme.colors.colorTextPrimary }
                    ]}
                  />
                </View>
                <View
                  style={[
                    styles.overlayMaskSide,
                    { backgroundColor: withAlpha(theme.colors.colorScrim, 0.3) }
                  ]}
                />
              </View>
              <View
                style={[
                  styles.overlayMaskVertical,
                  { backgroundColor: withAlpha(theme.colors.colorScrim, 0.3) }
                ]}
              />
            </View>

            {isResolving ? (
              <View
                style={[
                  styles.statusOverlay,
                  { backgroundColor: withAlpha(theme.colors.colorScrim, 0.48) }
                ]}
              >
                <View
                  style={[
                    styles.statusCard,
                    { backgroundColor: withAlpha(theme.colors.colorScrim, 0.72) }
                  ]}
                >
                  <ActivityIndicator color={theme.colors.colorTextPrimary} />
                  <Text style={[styles.statusTitle, { color: theme.colors.colorTextPrimary }]}>
                    {t('common:actions.connecting')}
                  </Text>
                  <Text
                    style={[
                      styles.statusText,
                      { color: withAlpha(theme.colors.colorTextPrimary, 0.82) }
                    ]}
                  >
                    {t('receive:camera.joiningDescription')}
                  </Text>
                </View>
              </View>
            ) : null}
          </View>

          <Button
            disabled={!canScan}
            onClick={() => void importFromImage()}
            size='lg'
            variant='secondary'
            width='full'
          >
            {t('receive:actions.importFromImage')}
          </Button>
        </View>
      )}
    </Layout>
  )
}

const FRAME_SIZE = 280
const CORNER_SIZE = 28
const CORNER_STROKE = 4

const styles = StyleSheet.create({
  content: {
    gap: 16
  },
  noticeCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 20,
    gap: 14,
    alignItems: 'flex-start'
  },
  iconBadge: {
    width: 48,
    height: 48,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center'
  },
  noticeTitle: {
    fontSize: 20,
    fontWeight: '600'
  },
  noticeText: {
    fontSize: 14,
    lineHeight: 20
  },
  cameraShell: {
    position: 'relative',
    height: 420,
    overflow: 'hidden',
    borderRadius: 20,
    borderWidth: 1
  },
  camera: {
    flex: 1
  },
  overlay: {
    ...StyleSheet.absoluteFillObject
  },
  overlayMaskVertical: {
    flex: 1
  },
  overlayMiddleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center'
  },
  overlayMaskSide: {
    flex: 1,
    height: FRAME_SIZE
  },
  frameRow: {
    width: FRAME_SIZE,
    height: FRAME_SIZE,
    position: 'relative',
    backgroundColor: 'transparent'
  },
  frameCorner: {
    position: 'absolute',
    width: CORNER_SIZE,
    height: CORNER_SIZE
  },
  frameTopLeft: {
    top: 0,
    left: 0,
    borderLeftWidth: CORNER_STROKE,
    borderTopWidth: CORNER_STROKE,
    borderTopLeftRadius: 12
  },
  frameTopRight: {
    top: 0,
    right: 0,
    borderRightWidth: CORNER_STROKE,
    borderTopWidth: CORNER_STROKE,
    borderTopRightRadius: 12
  },
  frameBottomLeft: {
    bottom: 0,
    left: 0,
    borderLeftWidth: CORNER_STROKE,
    borderBottomWidth: CORNER_STROKE,
    borderBottomLeftRadius: 12
  },
  frameBottomRight: {
    bottom: 0,
    right: 0,
    borderRightWidth: CORNER_STROKE,
    borderBottomWidth: CORNER_STROKE,
    borderBottomRightRadius: 12
  },
  statusOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32
  },
  statusCard: {
    alignItems: 'center',
    gap: 8,
    borderRadius: 20,
    paddingVertical: 24,
    paddingHorizontal: 28
  },
  statusTitle: {
    fontSize: 18,
    fontWeight: '600'
  },
  statusText: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20
  },
  helperCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 18,
    gap: 8
  },
  helperTitle: {
    fontSize: 15,
    fontWeight: '600'
  },
  helperText: {
    fontSize: 13,
    lineHeight: 19
  },
  errorText: {
    fontSize: 13,
    lineHeight: 18,
    marginTop: 2
  }
})
