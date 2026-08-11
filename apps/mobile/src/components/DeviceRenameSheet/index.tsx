import { StyleSheet, View } from 'react-native'
import { Button, Input } from '@altersend/components'
import { useDeviceRenameForm } from '@altersend/domain'
import { useTranslation } from '@altersend/locales'
import { BottomSheet } from '../BottomSheet'

interface DeviceRenameSheetProps {
  open: boolean
  initialName: string
  onClose: () => void
  onRename: (name: string) => Promise<boolean>
}

export function DeviceRenameSheet({
  open,
  initialName,
  onClose,
  onRename
}: DeviceRenameSheetProps) {
  const { t } = useTranslation(['settings', 'common'])
  const { value, setValue, canSave, isSaving, maxLength, save } = useDeviceRenameForm({
    open,
    initialName,
    onRename,
    onClose
  })

  return (
    <BottomSheet
      open={open}
      onClose={onClose}
      title={t('settings:pairing.renameDevice')}
      sheetStyle={styles.sheet}
    >
      <View style={styles.form}>
        <Input
          aria-label={t('settings:pairing.nameLabel')}
          autoCapitalize='words'
          disabled={isSaving}
          maxLength={maxLength}
          placeholder={t('settings:pairing.namePlaceholder')}
          value={value}
          onChange={(event: { target: { value: string } }) => setValue(event.target.value)}
        />

        <Button
          disabled={!canSave}
          loading={isSaving}
          onClick={save}
          size='lg'
          variant='primary'
          width='full'
        >
          {t('common:actions.save')}
        </Button>
      </View>
    </BottomSheet>
  )
}

const styles = StyleSheet.create({
  sheet: { paddingBottom: 58, gap: 24 },
  form: { gap: 22, paddingHorizontal: 16 }
})
