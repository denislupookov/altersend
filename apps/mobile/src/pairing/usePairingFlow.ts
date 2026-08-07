import { useEffect, useState } from 'react'
import { router, useLocalSearchParams } from 'expo-router'
import {
  forgetPeer,
  renamePeer,
  usePairingSession,
  type DeviceRenameTarget
} from '@altersend/domain'
import { useTranslation } from '@altersend/locales'
import { useToast } from '@/src/components/Toast'
import { SHEET_TRANSITION_MS, useDeviceRename } from './useDeviceRename'
import { useDeviceRemove } from './useDeviceRemove'

export function usePairingFlow() {
  const { t } = useTranslation(['settings'])
  const toast = useToast()
  const params = useLocalSearchParams<{ pairCode?: string }>()

  const [actionsTarget, setActionsTarget] = useState<DeviceRenameTarget | null>(null)
  const { openRename, renameSheet } = useDeviceRename(renamePeer)
  const { confirmRemove, removeDialog } = useDeviceRemove(forgetPeer)
  const [addSheetOpen, setAddSheetOpen] = useState(false)
  const [qrSheetOpen, setQrSheetOpen] = useState(false)
  const [scanSheetOpen, setScanSheetOpen] = useState(false)
  const [manualSheetOpen, setManualSheetOpen] = useState(false)
  const [deepLinkCode, setDeepLinkCode] = useState('')

  const closePairingSheets = () => {
    setQrSheetOpen(false)
    setScanSheetOpen(false)
    setManualSheetOpen(false)
    setDeepLinkCode('')
  }

  const { peers, pairingTopic, isHostWaiting, isJoinWaiting, setJoinedTopic } = usePairingSession({
    hostOpen: qrSheetOpen,
    joinOpen: manualSheetOpen || scanSheetOpen,
    onPaired: () => {
      closePairingSheets()
      toast.show({ title: t('settings:pairing.devicePaired') })
    },
    onFailed: () => toast.show({ title: t('settings:pairing.pairFailed'), tone: 'error' })
  })

  useEffect(() => {
    const code = typeof params.pairCode === 'string' ? params.pairCode : ''
    if (!code) return
    setDeepLinkCode(code)
    setAddSheetOpen(false)
    setScanSheetOpen(false)
    setManualSheetOpen(true)
    router.setParams({ pairCode: '' })
  }, [params.pairCode])

  const reopenAddSheet = () => setTimeout(() => setAddSheetOpen(true), SHEET_TRANSITION_MS)

  const removeDevice = () => {
    const target = actionsTarget
    setActionsTarget(null)
    if (target) confirmRemove(target)
  }

  const openRenameSheet = () => {
    const target = actionsTarget
    setActionsTarget(null)
    if (target) openRename(target)
  }

  return {
    peers,
    openAddSheet: () => setAddSheetOpen(true),
    openDeviceActions: (peerKey: string, name: string) => setActionsTarget({ peerKey, name }),

    deviceActionsSheet: {
      open: actionsTarget !== null,
      onClose: () => setActionsTarget(null),
      onRemove: removeDevice,
      onRename: openRenameSheet
    },
    renameSheet,
    removeDialog,
    addSheet: {
      open: addSheetOpen,
      onClose: () => setAddSheetOpen(false),
      onShowQrCode: () => {
        setAddSheetOpen(false)
        setTimeout(() => setQrSheetOpen(true), SHEET_TRANSITION_MS)
      },
      onScanQrCode: () => {
        setAddSheetOpen(false)
        setTimeout(() => setScanSheetOpen(true), SHEET_TRANSITION_MS)
      },
      onEnterCode: () => {
        setAddSheetOpen(false)
        setTimeout(() => setManualSheetOpen(true), SHEET_TRANSITION_MS)
      }
    },
    qrSheet: {
      open: qrSheetOpen,
      topic: pairingTopic,
      isWaiting: isHostWaiting,
      onBack: () => {
        setQrSheetOpen(false)
        reopenAddSheet()
      },
      onClose: () => setQrSheetOpen(false)
    },
    scanSheet: {
      open: scanSheetOpen,
      onBack: () => {
        setScanSheetOpen(false)
        reopenAddSheet()
      },
      onClose: () => setScanSheetOpen(false),
      onJoined: setJoinedTopic,
      isWaiting: isJoinWaiting
    },
    manualSheet: {
      open: manualSheetOpen,
      onBack: () => {
        setManualSheetOpen(false)
        setDeepLinkCode('')
        reopenAddSheet()
      },
      onClose: () => {
        setManualSheetOpen(false)
        setDeepLinkCode('')
      },
      onJoined: setJoinedTopic,
      isWaiting: isJoinWaiting,
      initialCode: deepLinkCode
    }
  }
}
