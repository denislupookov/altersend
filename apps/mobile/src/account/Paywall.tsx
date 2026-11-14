import { useEffect } from 'react'
import { Platform, StyleSheet, View } from 'react-native'
import { Button, ExternalLink, useTheme } from '@altersend/components'
import { CheckIcon } from '@altersend/components/icons'
import { useTranslation } from '@altersend/locales'
import {
  WEB_LINK_MAX_LABEL,
  planRows,
  privacyPolicyUrl,
  termsOfServiceUrl
} from '@altersend/domain'
import { Layout } from '@/src/components'
import { Text } from '@/src/components/ThemedText'
import { purchasesReady } from '@/src/lifecycle/purchases'
import { successTap } from '@/src/haptics'
import PrivateSharingSvg from '../../../../assets/private-sharing.svg'
import { DismissRow } from './DismissRow'
import { openExternalUrl } from './openExternalUrl'
import { PlanOption } from './PlanOption'
import type { AccountPhaseProps } from './types'

const ILLUSTRATION_HEIGHT = 132

const RENEWAL_KEY =
  Platform.OS === 'ios' ? 'settings:account.renewalIos' : 'settings:account.renewalAndroid'

export function Paywall({ model, errorText, onDismiss }: AccountPhaseProps) {
  const { t } = useTranslation(['settings', 'common'])
  const restore = model.store?.restore
  const { theme } = useTheme()
  const c = theme.colors
  const { prepareStore } = model

  useEffect(() => prepareStore(), [prepareStore])

  const benefits = [
    t('settings:account.benefitRelay'),
    t('settings:account.benefitWebLinks', { limit: WEB_LINK_MAX_LABEL }),
    t('settings:account.featurePriority'),
    t('settings:account.benefitDirectFree')
  ]

  const footer = (
    <View style={styles.footer}>
      {errorText ? <Text style={[styles.error, { color: c.colorDanger }]}>{errorText}</Text> : null}

      <Button
        size='lg'
        width='full'
        loading={model.busy}
        disabled={!purchasesReady || model.storeUnavailable}
        onClick={model.startUpgrade}
      >
        {t('settings:account.getPro')}
      </Button>

      {model.storeUnavailable ? (
        <Text style={[styles.note, { color: c.colorTextSecondary }]}>
          {t('settings:account.storeUnavailable')}
        </Text>
      ) : null}

      <View style={styles.links}>
        <ExternalLink onPress={model.busy ? undefined : model.showEntry}>
          {t('settings:account.haveCodeLink')}
        </ExternalLink>
        {model.store ? (
          <ExternalLink onPress={() => restore?.().then((ok) => ok && successTap())}>
            {t('settings:account.restore')}
          </ExternalLink>
        ) : null}
        <ExternalLink onPress={() => openExternalUrl(termsOfServiceUrl)}>
          {t('settings:rows.terms')}
        </ExternalLink>
        <ExternalLink onPress={() => openExternalUrl(privacyPolicyUrl)}>
          {t('settings:rows.privacyPolicy')}
        </ExternalLink>
      </View>

      <Text style={[styles.finePrint, { color: c.colorTextFaint }]}>{t(RENEWAL_KEY)}</Text>
    </View>
  )

  return (
    <Layout compactTop footer={footer}>
      <DismissRow onDismiss={onDismiss} />

      <View style={styles.hero}>
        <PrivateSharingSvg height={ILLUSTRATION_HEIGHT} />
      </View>

      <Text style={[styles.title, { color: c.colorTextPrimary }]}>
        {t('settings:account.paywallTitle')}
      </Text>
      <Text style={[styles.lead, { color: c.colorTextSecondary }]}>
        {t('settings:account.paywallLead')}
      </Text>

      <View style={styles.benefits}>
        {benefits.map((benefit) => (
          <View key={benefit} style={styles.benefit}>
            <View style={[styles.check, { backgroundColor: c.colorInfoSubtle }]}>
              <CheckIcon size={14} color={c.colorInfo} />
            </View>
            <Text style={[styles.benefitLabel, { color: c.colorTextPrimary }]}>{benefit}</Text>
          </View>
        ))}
      </View>

      <View style={styles.plans}>
        {planRows(t, model.prices).map((row) => (
          <PlanOption
            key={row.plan}
            row={row}
            selected={row.plan === model.plan}
            onPress={() => model.choosePlan(row.plan)}
          />
        ))}
      </View>
    </Layout>
  )
}

const styles = StyleSheet.create({
  hero: { alignItems: 'center', marginTop: 4 },
  title: {
    marginTop: 14,
    fontSize: 30,
    fontWeight: '700',
    letterSpacing: -0.8,
    lineHeight: 35,
    textAlign: 'center'
  },
  lead: { marginTop: 8, fontSize: 15, lineHeight: 21, textAlign: 'center' },
  benefits: { marginTop: 18, gap: 12, paddingHorizontal: 6 },
  benefit: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  check: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center'
  },
  benefitLabel: { flex: 1, fontSize: 15, fontWeight: '500' },
  plans: { flexDirection: 'row', gap: 10, marginTop: 20, marginBottom: 8 },
  footer: { gap: 12, paddingTop: 12 },
  note: { fontSize: 13, lineHeight: 18, textAlign: 'center' },
  finePrint: { fontSize: 11, lineHeight: 15, textAlign: 'center' },
  error: { fontSize: 13, lineHeight: 18, textAlign: 'center' },
  links: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    columnGap: 16,
    rowGap: 6
  }
})
