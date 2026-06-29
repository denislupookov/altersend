import { useEffect, useState } from 'react'
import { StyleSheet, View } from 'react-native'
import * as Clipboard from 'expo-clipboard'
import { Button, Input } from '@altersend/components'
import { ClipboardIcon } from '@altersend/components/icons'
import { extractJoinCode, joinPairingSession, useTransferStore } from '@altersend/domain'
import { useTranslation } from '@altersend/locales'
import { BottomSheet } from '../BottomSheet'
import { useToast } from '../Toast'

interface PairingManualCodeSheetProps {
  open: boolean
  onBack: () => void
  onClose: () => void
  onJoined?: (topic: string) => void
  isWaiting?: boolean
  initialCode?: string
}

export function PairingManualCodeSheet({
  open,
  onBack,
  onClose,
  onJoined,
  isWaiting = false,
  initialCode
}: PairingManualCodeSheetProps) {
  const { t } = useTranslation(['settings'])
  const toast = useToast()
  const role = useTransferStore((s) => s.role)
  const [value, setValue] = useState('')
  const [isJoining, setIsJoining] = useState(false)
  const [showError, setShowError] = useState(false)

  useEffect(() => {
    if (open) {
      if (initialCode) setValue(initialCode)
      return
    }
    setValue('')
    setIsJoining(false)
    setShowError(false)
  }, [open, initialCode])

  const joinCode = extractJoinCode(value)
  const isLoading = isJoining || isWaiting
  const error =
    showError && value.trim().length > 0 && !joinCode ? t('settings:pairing.codeError') : undefined

  const pasteFromClipboard = async () => {
    const text = await Clipboard.getStringAsync()
    if (text) {
      setValue(text)
      setShowError(false)
    }
  }

  const join = async () => {
    setShowError(true)
    if (!joinCode || isLoading || role !== null) return
    try {
      setIsJoining(true)
      await joinPairingSession(joinCode)
      onJoined?.(joinCode)
    } catch (error) {
      console.warn('PairingManualCodeSheet: joinPairingSession failed', error)
      toast.show({
        title: t('settings:pairing.couldNotJoin'),
        hint: t('settings:pairing.couldNotJoinHint')
      })
    } finally {
      setIsJoining(false)
    }
  }

  return (
    <BottomSheet
      open={open}
      onClose={onClose}
      onBack={onBack}
      title={t('settings:pairing.enterCode')}
      keyboardAvoiding
      sheetStyle={styles.sheet}
    >
      <View style={styles.form}>
        <Input
          aria-label={t('settings:pairing.codeLabel')}
          autoCapitalize='none'
          disabled={isLoading}
          error={error}
          onChange={(event: { target: { value: string } }) => {
            setValue(event.target.value)
            if (showError) setShowError(false)
          }}
          placeholder={t('settings:pairing.codePlaceholder')}
          trailing={
            <Button
              variant='ghost'
              size='sm'
              iconOnly
              aria-label={t('settings:pairing.pasteCodeLabel')}
              disabled={isJoining}
              onClick={() => {
                pasteFromClipboard().catch(() => {})
              }}
              icon={<ClipboardIcon size={16} />}
            />
          }
          value={value}
        />

        <Button
          disabled={!value.trim()}
          loading={isLoading}
          onClick={() => {
            join().catch(() => {})
          }}
          size='lg'
          variant='primary'
          width='full'
        >
          {isLoading ? t('settings:pairing.pairingInProgress') : t('settings:pairing.joinButton')}
        </Button>
      </View>
    </BottomSheet>
  )
}

const styles = StyleSheet.create({
  sheet: { paddingBottom: 58, gap: 24 },
  form: { gap: 22, paddingHorizontal: 20 }
})
