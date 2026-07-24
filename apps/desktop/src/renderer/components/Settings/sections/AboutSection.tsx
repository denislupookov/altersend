import { LinkCard, LinkRow, useTheme } from '@altersend/components'
import {
  ArrowUpRightIcon,
  DiscordIcon,
  FileTextIcon,
  GithubIcon,
  GlobeIcon,
  HeartIcon,
  LockIcon,
  XIcon
} from '@altersend/components/icons'
import type { IconComponent } from '@altersend/components/icons'
import { useTranslation } from '@altersend/locales'
import { aboutLinkGroups, type AboutLinkKey } from '@altersend/domain'
import logo from '../../../../../../../assets/logo.png'
import { bridgeApi } from '../../../api/bridgeApi'
import { SectionShell } from './SectionShell'

const linkIcons: Record<AboutLinkKey, IconComponent> = {
  website: GlobeIcon,
  github: GithubIcon,
  discord: DiscordIcon,
  x: XIcon,
  sponsor: HeartIcon,
  privacy: LockIcon,
  terms: FileTextIcon
}

export function AboutSection({ version }: { version: string }) {
  const { t } = useTranslation(['settings'])
  const { theme } = useTheme()
  const c = theme.colors

  const openUrl = (url: string) => {
    bridgeApi.openExternalUrl(url).catch((error: unknown) => {
      console.error('Failed to open external url', error)
    })
  }

  return (
    <SectionShell title={t('settings:sections.about')}>
      <div className='mb-4 flex items-center gap-[14px] rounded-xl border border-border-primary bg-background-subtle px-[18px] py-4'>
        <div className='h-10 w-10 shrink-0 overflow-hidden rounded-[10px]'>
          <img src={logo} alt='' aria-hidden className='h-full w-full object-cover' />
        </div>
        <p className='m-0 min-w-0 flex-1 text-[15px] font-semibold text-text-primary'>AlterSend</p>
        <span className='shrink-0 text-[14px] tabular-nums text-text-muted'>v{version}</span>
      </div>

      <div className='flex flex-col gap-4'>
        {aboutLinkGroups.map((group) => (
          <LinkCard key={group[0].key}>
            {group.map(({ key, labelKey, url }, index) => {
              const Icon = linkIcons[key]
              return (
                <LinkRow
                  key={key}
                  compact
                  icon={<Icon size={16} color={c.colorTextSecondary} />}
                  label={t(labelKey)}
                  trailing={<ArrowUpRightIcon size={14} color={c.colorTextMuted} />}
                  onPress={() => openUrl(url)}
                  isLast={index === group.length - 1}
                />
              )
            })}
          </LinkCard>
        ))}
      </div>

      <p className='m-0 mt-4 text-center text-[12px] text-text-muted'>
        © {new Date().getFullYear()} AlterSend
      </p>
    </SectionShell>
  )
}
