import { MenuGroup, MenuItem, useTheme } from '@altersend/components'
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
      <div className='flex flex-col gap-4'>
        <MenuGroup>
          <MenuItem
            isLast
            iconSize={36}
            icon={<img src={logo} alt='' aria-hidden className='h-9 w-9 rounded-md object-cover' />}
            label='AlterSend'
            value={`v${version}`}
          />
        </MenuGroup>

        {aboutLinkGroups.map((group) => (
          <MenuGroup key={group[0].key}>
            {group.map(({ key, labelKey, url }, index) => {
              const Icon = linkIcons[key]
              return (
                <MenuItem
                  key={key}
                  icon={<Icon size={19} color={c.colorTextSecondary} />}
                  label={t(labelKey)}
                  trailing={<ArrowUpRightIcon size={14} color={c.colorTextMuted} />}
                  onPress={() => openUrl(url)}
                  isLast={index === group.length - 1}
                />
              )
            })}
          </MenuGroup>
        ))}
      </div>

      <p className='m-0 mt-4 text-center text-[12px] text-text-muted'>
        © {new Date().getFullYear()} AlterSend
      </p>
    </SectionShell>
  )
}
