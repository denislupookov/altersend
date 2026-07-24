import { useEffect, useState, type ComponentType } from 'react'
import {
  GlobeIcon,
  InfoIcon,
  LaptopIcon,
  MailIcon,
  SlidersHorizontalIcon,
  WaypointsIcon,
  type IconProps
} from '@altersend/components/icons'
import { loadPeers } from '@altersend/domain'
import { useTranslation } from '@altersend/locales'
import { Modal } from '../Modal'
import { ListItem } from '@altersend/components'
import { DevicesSection } from './sections/DevicesSection'
import { GeneralSection } from './sections/GeneralSection'
import { LanguageSection } from './sections/LanguageSection'
import { ConnectionSection } from './sections/ConnectionSection'
import { FeedbackSection } from './sections/FeedbackSection'
import { AboutSection } from './sections/AboutSection'
import { subscribeOpenSettings, type SettingsSection } from './settingsControl'

export { openSettingsPanel } from './settingsControl'

const NAV: { id: SettingsSection; icon: ComponentType<IconProps>; labelKey: string }[] = [
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
    <Modal open={open} title={t('settings:title')} width={820} onClose={() => setOpen(false)}>
      <div className='flex h-[560px] border-t border-border-primary'>
        <nav className='w-[210px] shrink-0 space-y-1 overflow-y-auto border-r border-border-primary px-2.5 pb-2.5 pt-5'>
          {NAV.map(({ id, icon: Icon, labelKey }) => (
            <ListItem
              key={id}
              icon={<Icon size={16} />}
              label={t(labelKey)}
              active={section === id}
              onClick={() => setSection(id)}
            />
          ))}
        </nav>

        <div className='flex min-h-0 min-w-0 flex-1 flex-col'>
          {section === 'devices' ? (
            <DevicesSection />
          ) : section === 'general' ? (
            <GeneralSection />
          ) : section === 'language' ? (
            <LanguageSection />
          ) : section === 'connection' ? (
            <ConnectionSection />
          ) : section === 'feedback' ? (
            <FeedbackSection version={version} />
          ) : (
            <AboutSection version={version} />
          )}
        </div>
      </div>
    </Modal>
  )
}
