import { Badge, Button, LinkRow, RowGroup, Spinner, useTheme } from '@altersend/components'
import { useTranslation } from '@altersend/locales'
import { Card, CardFooter, CardStatusRow, ScreenIntro } from '../../components'
import { useIsCompact } from '../../useIsCompact'

const SKELETON_ROWS = [
  { label: '70%', meta: '30%' },
  { label: '56%', meta: '26%' },
  { label: '64%', meta: '28%' }
]

export function ConnectingScreen({ onCancel }: { onCancel: () => void }) {
  const { t } = useTranslation(['web', 'common'])
  const { theme } = useTheme()
  const isPhone = useIsCompact()

  return (
    <>
      <ScreenIntro
        title={t('common:actions.connecting')}
        description={t('web:connecting.description')}
      />

      <Card bare={isPhone}>
        <CardStatusRow
          status={
            <Badge
              pill
              tone='muted'
              icon={<Spinner size={14} color={theme.colors.colorTextMuted} />}
            >
              {t('common:actions.connecting')}
            </Badge>
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

        <CardFooter align='end'>
          <Button
            variant='secondary'
            size={isPhone ? 'lg' : 'sm'}
            width={isPhone ? 'full' : 'auto'}
            onClick={onCancel}
          >
            {t('common:actions.cancel')}
          </Button>
        </CardFooter>
      </Card>
    </>
  )
}
