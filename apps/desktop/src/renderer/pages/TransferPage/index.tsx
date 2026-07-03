import { useState } from 'react'
import { Settings, Sidebar, type TransferTab } from '../../components'
import { isSidebarCollapsed, setSidebarCollapsed } from '../../lifecycle/sidebarStorage'
import { ReceivePage, SendPage } from '..'

export default function TransferPage({
  version,
  activeTab,
  onTabChange
}: {
  version: string
  activeTab: TransferTab
  onTabChange: (tab: TransferTab) => void
}) {
  const [collapsed, setCollapsed] = useState(() => isSidebarCollapsed())

  const toggleCollapsed = () => {
    setCollapsed((prev) => {
      const next = !prev
      setSidebarCollapsed(next)
      return next
    })
  }

  return (
    <div className='flex h-screen w-full bg-background text-text-primary'>
      <Sidebar
        collapsed={collapsed}
        activeTab={activeTab}
        onSelect={onTabChange}
        onToggleCollapsed={toggleCollapsed}
      />

      <main className='flex min-h-0 min-w-0 flex-1 flex-col'>
        <div className='h-11 w-full shrink-0' style={{ WebkitAppRegion: 'drag' }} />

        <section className='flex min-h-0 flex-1 flex-col px-10 pb-[30px] pt-2 max-[820px]:px-6'>
          <div className='mx-auto flex min-h-0 w-full max-w-[920px] flex-1 flex-col'>
            {activeTab === 'send' ? <SendPage /> : <ReceivePage />}
          </div>
        </section>
      </main>

      <Settings version={version} />
    </div>
  )
}
