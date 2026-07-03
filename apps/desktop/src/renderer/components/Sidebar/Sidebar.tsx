import {
  DownloadIcon,
  PanelLeftCloseIcon,
  PanelLeftOpenIcon,
  SendIcon,
  SlidersHorizontalIcon
} from '@altersend/components/icons'
import { useTransferStore } from '@altersend/domain'
import { useTranslation } from '@altersend/locales'
import logoMark from '../../../../../../assets/altersend-logo.png'
import { Button, ListItem } from '@altersend/components'
import { openSettingsPanel } from '../Settings'

export type TransferTab = 'send' | 'receive'

export function Sidebar({
  collapsed,
  activeTab,
  onSelect,
  onToggleCollapsed
}: {
  collapsed: boolean
  activeTab: TransferTab
  onSelect: (tab: TransferTab) => void
  onToggleCollapsed: () => void
}) {
  const { t } = useTranslation(['common'])
  const role = useTransferStore((s) => s.role)
  const toggleLabel = collapsed
    ? t('common:labels.expandSidebar')
    : t('common:labels.collapseSidebar')

  return (
    <aside
      className={`flex h-screen shrink-0 flex-col border-r border-border-primary bg-background-deep pb-[30px] transition-[width] duration-200 ease-out ${
        collapsed ? 'w-[74px]' : 'w-[244px]'
      }`}
    >
      <div className='h-11 shrink-0' style={{ WebkitAppRegion: 'drag' }} />

      <div
        className={`flex shrink-0 items-center ${
          collapsed ? 'justify-center px-3' : 'justify-between gap-2.5 px-4'
        }`}
      >
        {!collapsed && (
          <img src={logoMark} alt='AlterSend' className='h-6 w-auto shrink-0 object-contain' />
        )}
        <Button
          variant='ghost'
          iconOnly
          size={collapsed ? 'md' : 'sm'}
          aria-label={toggleLabel}
          onClick={onToggleCollapsed}
          icon={collapsed ? <PanelLeftOpenIcon size={17} /> : <PanelLeftCloseIcon size={17} />}
        />
      </div>

      {collapsed && <div className='mx-3 mt-1 border-t border-border-primary' />}

      <nav
        className={`flex flex-col gap-1 px-3 ${collapsed ? 'items-center pt-3' : 'pt-8'}`}
        aria-label={t('common:labels.transferMode')}
      >
        <ListItem
          icon={<SendIcon size={18} />}
          label={t('common:labels.send')}
          collapsed={collapsed}
          active={activeTab === 'send'}
          showDot={role === 'sender'}
          onClick={() => onSelect('send')}
        />
        <ListItem
          icon={<DownloadIcon size={18} />}
          label={t('common:labels.receive')}
          collapsed={collapsed}
          active={activeTab === 'receive'}
          showDot={role === 'receiver'}
          onClick={() => onSelect('receive')}
        />
      </nav>

      <div className='flex-1' />

      <div className={`flex flex-col gap-1 px-3 ${collapsed ? 'items-center' : ''}`}>
        <ListItem
          icon={<SlidersHorizontalIcon size={18} />}
          label={t('common:labels.settings')}
          collapsed={collapsed}
          onClick={() => openSettingsPanel()}
        />
      </div>
    </aside>
  )
}
