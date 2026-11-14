import type { ReactNode } from 'react'
import { Button } from '@altersend/components'
import {
  CodeIcon,
  DiscordIcon,
  GithubIcon,
  GlobeIcon,
  HeartIcon,
  XIcon
} from '@altersend/components/icons'
import { communityLinks, type CommunityLinkKey } from '@altersend/domain'
import { useTranslation } from '@altersend/locales'
import { bridgeApi } from '../../api/bridgeApi'
import { PageHeading } from './PageHeading'
import { VisualCard } from './VisualCard'

interface Row {
  key: string
  icon: ReactNode
  title: string
  body: string
}

function openUrl(url: string) {
  bridgeApi.openExternalUrl(url).catch((error: unknown) => {
    console.error('Failed to open external url', error)
  })
}

export function ProIntroView() {
  const { t } = useTranslation(['onboarding', 'settings'])

  const icons: Record<CommunityLinkKey, ReactNode> = {
    discord: <DiscordIcon size={22} />,
    github: <GithubIcon size={22} />,
    x: <XIcon size={20} />
  }

  const rows: Row[] = [
    {
      key: 'open',
      icon: <CodeIcon size={18} />,
      title: t('onboarding:proIntro.openTitle'),
      body: t('onboarding:proIntro.openBody')
    },
    {
      key: 'relay',
      icon: <GlobeIcon size={18} />,
      title: t('onboarding:proIntro.relayTitle'),
      body: t('onboarding:proIntro.relayBody')
    },
    {
      key: 'support',
      icon: <HeartIcon size={18} />,
      title: t('onboarding:proIntro.supportTitle'),
      body: t('onboarding:proIntro.supportBody')
    }
  ]

  return (
    <div className='flex min-h-0 flex-1 flex-col overflow-y-auto'>
      <VisualCard height='h-[168px] shrink-0' wallpaperBackdrop={false}>
        <div className='absolute inset-0 flex items-center justify-center gap-4'>
          {communityLinks.map((link) => (
            <Button
              key={link.key}
              iconOnly
              pill
              size='lg'
              variant='outline'
              icon={icons[link.key]}
              aria-label={t(link.labelKey)}
              onClick={() => openUrl(link.url)}
            />
          ))}
        </div>
      </VisualCard>

      <div className='mt-6'>
        <PageHeading title={t('onboarding:proIntro.title')} />
      </div>

      <div className='mt-6 flex flex-col gap-5'>
        {rows.map((row) => (
          <div key={row.key} className='flex items-start gap-3.5'>
            <div className='flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px] bg-surface-primary text-text-primary'>
              {row.icon}
            </div>
            <div className='flex min-w-0 flex-col'>
              <span className='text-[15px] font-semibold leading-5 text-text-primary'>
                {row.title}
              </span>
              <span className='text-[14px] leading-5 text-text-secondary'>{row.body}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
