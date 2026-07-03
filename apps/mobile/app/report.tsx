import { StyleSheet, View } from 'react-native'
import Constants from 'expo-constants'
import { useState } from 'react'
import { Button, FeedbackTypeSelector, useTheme } from '@altersend/components'
import { SendIcon } from '@altersend/components/icons'
import type { FeedbackType } from '@altersend/components'
import { submitFeedback } from '@altersend/domain'
import { useTranslation } from '@altersend/locales'
import { Layout } from '@/src/components'
import { Text, TextInput } from '@/src/components/ThemedText'

type State = 'idle' | 'sending' | 'sent' | 'error'

export default function ReportScreen() {
  const { t } = useTranslation(['feedback', 'common'])
  const { theme } = useTheme()
  const [type, setType] = useState<FeedbackType>('bug')
  const [message, setMessage] = useState('')
  const [state, setState] = useState<State>('idle')
  const version = Constants.expoConfig?.version ?? '0.0.0'

  const send = async () => {
    setState('sending')
    const sent = await submitFeedback({
      webhookUrl: process.env.EXPO_PUBLIC_DISCORD_WEBHOOK_URL,
      title: t(`feedback:types.${type}`),
      message: message.trim(),
      version,
      platform: t('common:labels.mobile'),
      labels: { version: t('common:labels.version'), platform: t('common:labels.platform') }
    })
    setState(sent ? 'sent' : 'error')
  }

  const canSend = message.trim().length > 0 && state === 'idle'

  if (state === 'sent') {
    return (
      <Layout title={t('feedback:title')} description='' hasNativeHeader>
        <View style={styles.centred}>
          <Text style={[styles.sentTitle, { color: theme.colors.colorTextPrimary }]}>
            {t('feedback:states.sent')}
          </Text>
          <Text style={[styles.sentHint, { color: theme.colors.colorTextMuted }]}>
            {t('feedback:states.received')}
          </Text>
        </View>
      </Layout>
    )
  }

  return (
    <Layout title={t('feedback:title')} description='' hasNativeHeader>
      <View style={styles.content}>
        <FeedbackTypeSelector
          value={type}
          onChange={setType}
          labels={{
            bug: t('feedback:types.bug'),
            feature: t('feedback:types.feature'),
            general: t('feedback:types.general')
          }}
          disabled={state === 'sending'}
        />

        <TextInput
          style={[
            styles.input,
            {
              color: theme.colors.colorTextPrimary,
              backgroundColor: theme.colors.colorBackgroundSubtle,
              borderColor:
                state === 'error' ? theme.colors.colorDanger : theme.colors.colorBorderPrimary
            }
          ]}
          placeholder={
            type === 'bug'
              ? t('feedback:placeholders.bug')
              : type === 'feature'
                ? t('feedback:placeholders.feature')
                : t('feedback:placeholders.general')
          }
          placeholderTextColor={theme.colors.colorTextMuted}
          multiline
          textAlignVertical='top'
          value={message}
          onChangeText={(t) => {
            setMessage(t)
            if (state === 'error') setState('idle')
          }}
          editable={state !== 'sending'}
        />

        {state === 'error' && (
          <Text style={[styles.error, { color: theme.colors.colorDanger }]}>
            {t('feedback:states.failed')}
          </Text>
        )}

        <Button
          variant='primary'
          size='lg'
          width='full'
          disabled={!canSend}
          onClick={() => void send()}
          icon={
            <SendIcon
              size={16}
              color={canSend ? theme.colors.colorBackground : theme.colors.colorTextMuted}
            />
          }
        >
          {state === 'sending' ? t('feedback:actions.sending') : t('feedback:actions.send')}
        </Button>
      </View>
    </Layout>
  )
}

const styles = StyleSheet.create({
  content: { gap: 12 },
  input: {
    borderRadius: 8,
    borderWidth: 1,
    padding: 12,
    fontSize: 14,
    minHeight: 140
  },
  error: { fontSize: 12 },
  centred: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 8 },
  sentTitle: { fontSize: 18, fontWeight: '700' },
  sentHint: { fontSize: 14, textAlign: 'center' }
})
