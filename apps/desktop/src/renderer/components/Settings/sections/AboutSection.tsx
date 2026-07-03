import { ExternalLink, LinkCard, LinkRow, useTheme } from '@altersend/components'
import { ArrowUpRightIcon, DiscordIcon, GithubIcon, GlobeIcon } from '@altersend/components/icons'
import { Trans, useTranslation } from '@altersend/locales'
import {
  discordUrl,
  githubUrl,
  privacyPolicyUrl,
  termsOfServiceUrl,
  websiteUrl
} from '@altersend/domain'
import logo from '../../../../../../../assets/logo.png'
import { bridgeApi } from '../../../api/bridgeApi'
import { SectionShell } from './SectionShell'

export function AboutSection({ version }: { version: string }) {
  const { t } = useTranslation(['settings', 'common'])
  const { theme } = useTheme()
  const c = theme.colors

  const links = [
    { icon: DiscordIcon, label: t('settings:rows.discord'), url: discordUrl },
    { icon: GithubIcon, label: 'GitHub', url: githubUrl },
    { icon: GlobeIcon, label: t('settings:rows.website'), url: websiteUrl }
  ]

  return (
    <SectionShell title={t('settings:sections.about')}>
      <div className='mb-4 flex items-center gap-[14px] rounded-xl border border-border-primary bg-background-subtle px-[18px] py-4'>
        <div className='h-10 w-10 shrink-0 overflow-hidden rounded-[10px]'>
          <img src={logo} alt='' aria-hidden className='h-full w-full object-cover' />
        </div>
        <div className='min-w-0'>
          <p className='m-0 text-[15px] font-semibold text-text-primary'>AlterSend</p>
          <p className='m-0 mt-0.5 text-[12.5px] text-text-muted'>{t('common:app.tagline')}</p>
        </div>
      </div>

      <div className='mb-4 flex items-center justify-between gap-3 rounded-xl border border-border-primary bg-background-subtle px-[18px] py-[13px]'>
        <span className='text-[14px] font-medium text-text-primary'>
          {t('common:labels.version')}
        </span>
        <span className='text-[14px] tabular-nums text-text-muted'>v{version}</span>
      </div>

      <LinkCard>
        {links.map(({ icon: Icon, label, url }, index) => (
          <LinkRow
            key={label}
            compact
            icon={<Icon size={16} color={c.colorTextSecondary} />}
            label={label}
            trailing={<ArrowUpRightIcon size={14} color={c.colorTextMuted} />}
            onPress={() => void bridgeApi.openExternalUrl(url)}
            isLast={index === links.length - 1}
          />
        ))}
      </LinkCard>

      <p className='m-0 mt-4 text-center text-[12px] text-text-muted'>
        <Trans
          ns='settings'
          i18nKey='legal.sentence'
          components={{
            terms: (
              <ExternalLink onPress={() => void bridgeApi.openExternalUrl(termsOfServiceUrl)}>
                {null}
              </ExternalLink>
            ),
            privacy: (
              <ExternalLink onPress={() => void bridgeApi.openExternalUrl(privacyPolicyUrl)}>
                {null}
              </ExternalLink>
            )
          }}
        />
      </p>
    </SectionShell>
  )
}
