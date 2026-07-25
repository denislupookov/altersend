import type { ChangeEvent } from 'react'
import { Button, Input } from '@altersend/components'
import { ClipboardIcon } from '@altersend/components/icons'
import { useTranslation } from '@altersend/locales'
import { Card, ScreenIntro, SentWithBanner } from '../../components'

export interface EnterCodeScreenProps {
  code: string
  error?: string
  onChange: (value: string) => void
  onPaste: () => void
  onConnect: () => void
}

export function EnterCodeScreen({
  code,
  error,
  onChange,
  onPaste,
  onConnect
}: EnterCodeScreenProps) {
  const { t } = useTranslation(['web', 'receive', 'common'])

  return (
    <>
      <ScreenIntro title={t('web:join.title')} description={t('web:join.description')} />

      <Card>
        <Input
          label={t('web:join.codeLabel')}
          mono
          autoCapitalize='none'
          autoComplete='off'
          spellCheck={false}
          placeholder={t('receive:form.codePlaceholder')}
          value={code}
          error={error}
          onChange={(e: ChangeEvent<HTMLInputElement>) => onChange(e.currentTarget.value)}
          onKeyDown={(e: Readonly<{ key: string }>) => {
            if (e.key === 'Enter') onConnect()
          }}
          trailing={
            <Button
              variant='ghost'
              size='sm'
              iconOnly
              aria-label={t('common:actions.paste')}
              icon={<ClipboardIcon size={16} />}
              onClick={onPaste}
            />
          }
        />

        <div className='mt-3.5'>
          <Button variant='primary' size='lg' width='full' onClick={onConnect}>
            {t('common:actions.connect')}
          </Button>
        </div>
      </Card>

      <SentWithBanner />
    </>
  )
}
