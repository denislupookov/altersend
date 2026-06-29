import { useCallback, useEffect, useRef, useState } from 'react'
import { ActivityIndicator, Linking, StyleSheet, View } from 'react-native'
import {
  CameraView,
  scanFromURLAsync,
  useCameraPermissions,
  type BarcodeScanningResult
} from 'expo-camera'
import * as ImagePicker from 'expo-image-picker'
import { Button, useTheme, withAlpha } from '@altersend/components'
import { extractJoinCode, joinPairingSession, useTransferStore } from '@altersend/domain'
import { useTranslation } from '@altersend/locales'
import { BottomSheet } from '../BottomSheet'
import { useToast } from '../Toast'
import { Text } from '../ThemedText'

interface PairingScanSheetProps {
  open: boolean
  onBack: () => void
  onClose: () => void
  onJoined?: (topic: string) => void
  isWaiting?: boolean
}

export function PairingScanSheet({
  open,
  onBack,
  onClose,
  onJoined,
  isWaiting = false
}: PairingScanSheetProps) {
  const { t } = useTranslation(['settings'])
  const { theme } = useTheme()
  const c = theme.colors
  const toast = useToast()
  const role = useTransferStore((s) => s.role)
  const [permission, requestPermission] = useCameraPermissions()
  const [isResolving, setIsResolving] = useState(false)
  const scanLockRef = useRef(false)
  const invalidScanAtRef = useRef(0)

  useEffect(() => {
    if (!open) {
      scanLockRef.current = false
      setIsResolving(false)
      return
    }
    if (!permission) requestPermission().catch(() => {})
  }, [open, permission, requestPermission])

  const cameraGranted = permission?.granted ?? false
  const canAskAgain = permission?.canAskAgain ?? true
  const canScan = open && cameraGranted && !isResolving && role === null

  const resolveCode = useCallback(
    async (data: string) => {
      if (scanLockRef.current || role !== null) return
      const joinCode = extractJoinCode(data)
      if (!joinCode) {
        const now = Date.now()
        if (now - invalidScanAtRef.current > 1500) {
          invalidScanAtRef.current = now
          toast.show({
            title: t('settings:pairing.unsupportedQr'),
            hint: t('settings:pairing.unsupportedQrHint')
          })
        }
        return
      }

      try {
        scanLockRef.current = true
        setIsResolving(true)
        await joinPairingSession(joinCode)
        onJoined?.(joinCode)
      } catch (error) {
        console.warn('PairingScanSheet: joinPairingSession failed', error)
        scanLockRef.current = false
        setIsResolving(false)
        toast.show({
          title: t('settings:pairing.couldNotJoin'),
          hint: t('settings:pairing.couldNotJoinQrHint')
        })
      }
    },
    [role, toast, t, onJoined]
  )

  const handleBarcodeScanned = useCallback(
    ({ data }: BarcodeScanningResult) => {
      if (!canScan) return
      resolveCode(data).catch(() => {})
    },
    [canScan, resolveCode]
  )

  const handlePermissionAction = async () => {
    if (canAskAgain) {
      await requestPermission()
      return
    }
    await Linking.openSettings()
  }

  const importFromImage = useCallback(async () => {
    if (scanLockRef.current || role !== null) return

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
          title: t('settings:pairing.noQrFound'),
          hint: t('settings:pairing.noQrFoundHint')
        })
        return
      }
      await resolveCode(scan.data)
    } catch (error) {
      console.warn('PairingScanSheet: importFromImage failed', error)
      toast.show({ title: t('settings:pairing.couldNotReadImage') })
    }
  }, [resolveCode, role, toast, t])

  return (
    <BottomSheet
      open={open}
      onClose={onClose}
      onBack={onBack}
      title={t('settings:pairing.scanQrCode')}
    >
      <View style={[styles.cameraShell, { borderColor: c.colorBorderPrimary }]}>
        {cameraGranted ? (
          <>
            <CameraView
              barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
              facing='back'
              onBarcodeScanned={canScan ? handleBarcodeScanned : undefined}
              style={styles.camera}
            />
            <View pointerEvents='none' style={styles.scanOverlay}>
              <View
                style={[styles.maskVertical, { backgroundColor: withAlpha(c.colorScrim, 0.3) }]}
              />
              <View style={styles.maskMiddle}>
                <View
                  style={[styles.maskSide, { backgroundColor: withAlpha(c.colorScrim, 0.3) }]}
                />
                <View style={styles.frameRow}>
                  <View
                    style={[
                      styles.frameCorner,
                      styles.frameTopLeft,
                      { borderColor: c.colorTextPrimary }
                    ]}
                  />
                  <View
                    style={[
                      styles.frameCorner,
                      styles.frameTopRight,
                      { borderColor: c.colorTextPrimary }
                    ]}
                  />
                  <View
                    style={[
                      styles.frameCorner,
                      styles.frameBottomLeft,
                      { borderColor: c.colorTextPrimary }
                    ]}
                  />
                  <View
                    style={[
                      styles.frameCorner,
                      styles.frameBottomRight,
                      { borderColor: c.colorTextPrimary }
                    ]}
                  />
                </View>
                <View
                  style={[styles.maskSide, { backgroundColor: withAlpha(c.colorScrim, 0.3) }]}
                />
              </View>
              <View
                style={[styles.maskVertical, { backgroundColor: withAlpha(c.colorScrim, 0.3) }]}
              />
            </View>
          </>
        ) : (
          <View style={styles.permissionCard}>
            <Text style={[styles.permissionTitle, { color: c.colorTextPrimary }]}>
              {t('settings:pairing.cameraAccessNeeded')}
            </Text>
            <Text style={[styles.permissionText, { color: c.colorTextMuted }]}>
              {t('settings:pairing.cameraAccessText')}
            </Text>
            <Button
              onClick={() => {
                handlePermissionAction().catch(() => {})
              }}
              size='lg'
              variant='secondary'
              width='full'
            >
              {canAskAgain ? t('settings:pairing.allowCamera') : t('common:actions.openSettings')}
            </Button>
          </View>
        )}

        {isResolving || isWaiting ? (
          <View style={[styles.statusOverlay, { backgroundColor: withAlpha(c.colorScrim, 0.5) }]}>
            <ActivityIndicator color={c.colorTextPrimary} />
            <Text style={[styles.statusText, { color: c.colorTextPrimary }]}>
              {isWaiting
                ? t('settings:pairing.pairingInProgress')
                : t('settings:pairing.connecting')}
            </Text>
          </View>
        ) : null}
      </View>

      <View style={styles.actions}>
        <Button
          onClick={() => {
            importFromImage().catch(() => {})
          }}
          size='lg'
          variant='secondary'
          width='full'
        >
          {t('settings:pairing.importFromImage')}
        </Button>
      </View>
    </BottomSheet>
  )
}

const FRAME_SIZE = 260
const CORNER_SIZE = 26
const CORNER_STROKE = 3

const styles = StyleSheet.create({
  cameraShell: {
    marginHorizontal: 20,
    height: 380,
    borderRadius: 16,
    borderWidth: 1,
    overflow: 'hidden',
    position: 'relative'
  },
  camera: { flex: 1 },
  scanOverlay: { ...StyleSheet.absoluteFillObject },
  maskVertical: { flex: 1 },
  maskMiddle: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
  maskSide: { flex: 1, height: FRAME_SIZE },
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
    borderTopLeftRadius: 10
  },
  frameTopRight: {
    top: 0,
    right: 0,
    borderRightWidth: CORNER_STROKE,
    borderTopWidth: CORNER_STROKE,
    borderTopRightRadius: 10
  },
  frameBottomLeft: {
    bottom: 0,
    left: 0,
    borderLeftWidth: CORNER_STROKE,
    borderBottomWidth: CORNER_STROKE,
    borderBottomLeftRadius: 10
  },
  frameBottomRight: {
    bottom: 0,
    right: 0,
    borderRightWidth: CORNER_STROKE,
    borderBottomWidth: CORNER_STROKE,
    borderBottomRightRadius: 10
  },
  permissionCard: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 14,
    paddingHorizontal: 24
  },
  permissionTitle: { fontSize: 18, fontWeight: '700', textAlign: 'center' },
  permissionText: { fontSize: 14, lineHeight: 20, textAlign: 'center' },
  statusOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12
  },
  actions: { gap: 10, paddingHorizontal: 20 },
  statusText: { fontSize: 15, fontWeight: '600' }
})
