import { useEffect } from 'react'
import { Linking, StyleSheet, View } from 'react-native'
import { Button, ExternalLink, LinkRow, useTheme } from '@altersend/components'
import { useTranslation } from '@altersend/locales'
import {
  planComparisonRows,
  planRows,
  privacyPolicyUrl,
  termsOfServiceUrl
} from '@altersend/domain'
import { HeroBackdrop, Layout } from '@/src/components'
import { IconButton } from '@/src/components/IconButton'
import { Text } from '@/src/components/ThemedText'
import { purchasesReady } from '@/src/lifecycle/purchases'
import { HEADER_TOP, SCREEN_PADDING } from './constants'
import { PlanCellValue } from './PlanCellValue'
import { successTap } from '@/src/haptics'
import type { AccountPhaseProps } from './types'

const PRO_COLUMN_WIDTH = 80
const FREE_CHECK_SIZE = 15
const PRO_CHECK_SIZE = 17

function openExternalUrl(url: string) {
  Linking.openURL(url).catch((err) => console.warn('[account] could not open url', err))
}

export function Paywall({ model, errorText, onDismiss }: AccountPhaseProps) {
  const { t } = useTranslation(['settings', 'common'])
  const restore = model.store?.restore
  const { theme } = useTheme()
  const c = theme.colors
  const rows = planComparisonRows(t)
  const { prepareStore } = model

  useEffect(() => prepareStore(), [prepareStore])

  const footer = (
    <View style={[styles.footer, styles.footerBar, { borderTopColor: c.colorBorderStrong }]}>
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

      <Button
        size='sm'
        variant='ghost'
        width='full'
        disabled={model.busy}
        onClick={model.showEntry}
      >
        {t('settings:account.haveCodeLink')}
      </Button>

      <View style={styles.legalLinks}>
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
    </View>
  )

  return (
    <Layout compactTop backdrop={<HeroBackdrop />} footer={footer}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: c.colorTextPrimary }]}>
          {t('settings:account.paywallTitle')}
        </Text>
        <IconButton
          icon='close'
          size='large'
          label={t('common:actions.close')}
          onPress={onDismiss}
        />
      </View>
      <Text style={[styles.lead, { color: c.colorTextSecondary }]}>
        {t('settings:account.paywallLead')}
      </Text>

      <View style={styles.plans}>
        {planRows(t, model.prices).map((row) => (
          <LinkRow
            key={row.plan}
            standalone
            label={row.title}
            subtitle={row.caption}
            selected={row.plan === model.plan}
            onPress={() => model.choosePlan(row.plan)}
            trailing={
              row.price ? (
                <Text style={[styles.planPrice, { color: c.colorTextPrimary }]}>{row.price}</Text>
              ) : null
            }
          />
        ))}
      </View>

      <View style={styles.table}>
        <View
          style={[
            styles.proColumn,
            { backgroundColor: c.colorBackgroundSubtle, borderColor: c.colorBorderPrimary }
          ]}
        />

        <View style={styles.tableHead}>
          <Text style={[styles.rowLabel, styles.headLabel, { color: c.colorTextPrimary }]}>
            {t('settings:account.included')}
          </Text>
          <Text style={[styles.freeCell, styles.headColumn, { color: c.colorTextMuted }]}>
            {t('settings:account.columnFree')}
          </Text>
          <View style={styles.proHeadCell}>
            <View style={[styles.proChip, { backgroundColor: c.colorSurfacePrimary }]}>
              <Text style={[styles.proChipLabel, { color: c.colorTextPrimary }]}>
                {t('settings:account.columnPro')}
              </Text>
            </View>
          </View>
        </View>

        {rows.map((row, index) => (
          <View
            key={row.label}
            style={[styles.tableRow, index === rows.length - 1 && styles.tableRowLast]}
          >
            <Text style={[styles.rowLabel, { color: c.colorTextSecondary }]}>{row.label}</Text>
            <View style={styles.freeCell}>
              <PlanCellValue
                cell={row.free}
                color={c.colorTextMuted}
                size={FREE_CHECK_SIZE}
                style={styles.freeValue}
              />
            </View>
            <View style={styles.proCell}>
              <PlanCellValue
                cell={row.pro}
                color={c.colorTextPrimary}
                size={PRO_CHECK_SIZE}
                style={styles.proValue}
              />
            </View>
          </View>
        ))}
      </View>
    </Layout>
  )
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 12,
    paddingTop: HEADER_TOP
  },
  title: { flexShrink: 1, fontSize: 30, fontWeight: '700', letterSpacing: -0.6, marginBottom: 6 },
  lead: { fontSize: 15, lineHeight: 21 },
  plans: { marginTop: 24, marginBottom: 8, gap: 10 },
  planPrice: { fontSize: 16, fontWeight: '600' },
  table: { position: 'relative', marginTop: 28 },
  proColumn: {
    position: 'absolute',
    right: 0,
    top: 0,
    bottom: 0,
    width: PRO_COLUMN_WIDTH,
    borderRadius: 16,
    borderWidth: 1
  },
  tableHead: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12 },
  headLabel: { fontSize: 15, fontWeight: '600' },
  headColumn: { fontSize: 13, fontWeight: '600', textAlign: 'center' },
  tableRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 16 },
  tableRowLast: { paddingBottom: 24 },
  rowLabel: { flex: 1, fontSize: 14, lineHeight: 19, paddingRight: 12 },
  freeCell: { width: 56, marginRight: 16, alignItems: 'center' },
  freeValue: { fontSize: 14, textAlign: 'center' },
  proHeadCell: { width: PRO_COLUMN_WIDTH, alignItems: 'center' },
  proCell: { width: PRO_COLUMN_WIDTH, alignItems: 'center' },
  proValue: { textAlign: 'center', fontSize: 16, fontWeight: '600' },
  proChip: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 },
  proChipLabel: { fontSize: 13, fontWeight: '600' },
  footer: { gap: 10 },
  note: { fontSize: 13, lineHeight: 18, textAlign: 'center' },
  error: { fontSize: 13, lineHeight: 18, marginTop: 12, textAlign: 'center' },
  legalLinks: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    columnGap: 16,
    rowGap: 4
  },
  footerBar: {
    marginHorizontal: -SCREEN_PADDING,
    paddingHorizontal: SCREEN_PADDING,
    paddingTop: 16,
    borderTopWidth: StyleSheet.hairlineWidth
  }
})
