import { LinkRow, RowGroup, Spinner, useTheme } from '@altersend/components'
import { useTranslation } from '@altersend/locales'
import { Card, CardFooter, CardStatusRow, ScreenIntro, StatusPill } from '../../components'
import type { ConnectStage } from '../../transfer/webReceiver'

const SKELETON_ROWS = [
  { label: '70%', meta: '30%' },
  { label: '56%', meta: '26%' },
  { label: '64%', meta: '28%' }
]

export function ConnectingScreen({ stage }: { stage: ConnectStage | null }) {
  const { t } = useTranslation(['web', 'common'])
  const { theme } = useTheme()

  return (
    <>
      <ScreenIntro
        title={t('common:actions.connecting')}
        description={t('web:connecting.description')}
      />

      <Card>
        <CardStatusRow
          status={
            <StatusPill icon={<Spinner size={14} color={theme.colors.colorTextMuted} />}>
              {t('common:actions.connecting')}
            </StatusPill>
          }
          meta={<div className='h-4 w-[110px] rounded-full bg-surface-secondary' />}
        />

        <div className='animate-pulse'>
          <RowGroup title={t('common:files.files')}>
            {SKELETON_ROWS.map((row, index) => (
              <LinkRow
                key={row.label}
                bare
                compact
                isFirst={index === 0}
                label=''
                icon={<span />}
                iconBackground={theme.colors.colorSurfaceTertiary}
                labelNode={
                  <div className='flex flex-col gap-1.5'>
                    <div
                      className='h-3 rounded-full bg-surface-tertiary'
                      style={{ width: row.label }}
                    />
                    <div
                      className='h-2.5 rounded-full bg-surface-tertiary'
                      style={{ width: row.meta }}
                    />
                  </div>
                }
              />
            ))}
          </RowGroup>
        </div>

        <CardFooter>
          <span className='flex items-center gap-2 text-sm text-text-muted'>
            <span className='h-1.5 w-1.5 shrink-0 rounded-full bg-warning' />
            {t(`web:connecting.stage.${stage ?? 'idle'}`)}
          </span>
        </CardFooter>
      </Card>
    </>
  )
}
