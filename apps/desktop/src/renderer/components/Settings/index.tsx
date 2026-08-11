import { useEffect, useState, type ComponentType } from 'react'
import {
  GlobeIcon,
  InfoIcon,
  LaptopIcon,
  MailIcon,
  SlidersHorizontalIcon,
  ArrowUpCircleIcon,
  UserIcon,
  WaypointsIcon,
  type IconProps
} from '@altersend/components/icons'
import { loadPeers, useSubscriptionStore } from '@altersend/domain'
import { useTranslation } from '@altersend/locales'
import { ListItem, Modal } from '@altersend/components'
import { DevicesSection } from './sections/DevicesSection'
import { GeneralSection } from './sections/GeneralSection'
import { LanguageSection } from './sections/LanguageSection'
import { ConnectionSection } from './sections/ConnectionSection'
import { AccountRoute } from './sections/AccountRoute'
import { FeedbackSection } from './sections/FeedbackSection'
import { AboutSection } from './sections/AboutSection'
import { subscribeOpenSettings, type SettingsSection } from './settingsControl'

export { openSettingsPanel } from './settingsControl'

function renderSection(section: SettingsSection, version: string) {
  switch (section) {
    case 'devices':
      return <DevicesSection />
    case 'general':
      return <GeneralSection />
    case 'language':
      return <LanguageSection />
    case 'connection':
      return <ConnectionSection />
    case 'account':
      return <AccountRoute />
    case 'feedback':
      return <FeedbackSection version={version} />
    case 'about':
      return <AboutSection version={version} />
  }
}

type NavEntry = { id: SettingsSection; icon: ComponentType<IconProps>; labelKey: string }

const ACCOUNT_NAV: NavEntry = {
  id: 'account',
  icon: UserIcon,
  labelKey: 'settings:account.title'
}

const NAV: NavEntry[] = [
  { id: 'devices', icon: LaptopIcon, labelKey: 'settings:pairing.pairedDevices' },
  { id: 'general', icon: SlidersHorizontalIcon, labelKey: 'settings:sections.general' },
  { id: 'language', icon: GlobeIcon, labelKey: 'settings:languageTitle' },
  { id: 'connection', icon: WaypointsIcon, labelKey: 'settings:rows.connection' },
  { id: 'feedback', icon: MailIcon, labelKey: 'settings:rows.feedback' },
  { id: 'about', icon: InfoIcon, labelKey: 'settings:sections.about' }
]

export function Settings({ version }: { version: string }) {
  const { t } = useTranslation(['settings', 'common'])
  const [open, setOpen] = useState(false)
  const [section, setSection] = useState<SettingsSection>('devices')
  const isPro = useSubscriptionStore((state) => state.active)
  const nav = isPro ? [ACCOUNT_NAV, ...NAV] : NAV

  useEffect(() => {
    if (open) loadPeers()
  }, [open])

  useEffect(
    () =>
      subscribeOpenSettings((next) => {
        setSection(next)
        setOpen(true)
      }),
    []
  )

  return (
    <Modal
      closeLabel={t('common:actions.close')}
      open={open}
      title={t('settings:title')}
      size='panel'
      onClose={() => setOpen(false)}
    >
      <div className='flex h-[560px] border-t border-border-primary'>
        <nav className='w-[210px] shrink-0 space-y-1 overflow-y-auto border-r border-border-primary px-2.5 pb-2.5 pt-5'>
          {nav.map(({ id, icon: Icon, labelKey }) => (
            <ListItem
              key={id}
              icon={<Icon size={16} />}
              label={t(labelKey)}
              active={section === id}
              onClick={() => setSection(id)}
            />
          ))}

          {isPro ? null : (
            <>
              <div className='my-2 h-px bg-border-primary' />

              <ListItem
                icon={<ArrowUpCircleIcon size={16} />}
                label={t('settings:account.upgradeToPro')}
                active={section === 'account'}
                onClick={() => setSection('account')}
              />
            </>
          )}
        </nav>

        <div className='flex min-h-0 min-w-0 flex-1 flex-col'>
          {renderSection(section, version)}
        </div>
      </div>
    </Modal>
  )
}
