import { Footer, PageHeader } from './components'
import {
  ConnectingScreen,
  DisconnectedScreen,
  DownloadScreen,
  EnterCodeScreen,
  TooLargeScreen
} from './screens'
import { useReceiveViewModel } from './useReceiveViewModel'

export default function App() {
  const vm = useReceiveViewModel()

  const renderScreen = () => {
    if (vm.phase === 'connecting') return <ConnectingScreen onCancel={vm.cancel} />

    if (vm.phase === 'disconnected') {
      return <DisconnectedScreen files={vm.files} onReconnect={vm.start} onReset={vm.reset} />
    }

    if (vm.tooLarge) {
      return <TooLargeScreen code={vm.code} onReset={vm.reset} />
    }

    if (!vm.isAwaitingCode) {
      return (
        <DownloadScreen
          files={vm.files}
          texts={vm.texts}
          error={vm.error || undefined}
          inApp={vm.inApp}
          forceZip={vm.forceZip}
          onForceZipChange={vm.setForceZip}
          onDownload={vm.download}
          onDownloadAll={vm.downloadAll}
          onReset={vm.reset}
        />
      )
    }

    return (
      <EnterCodeScreen
        code={vm.code}
        error={vm.error || undefined}
        onChange={vm.setCode}
        onPaste={vm.paste}
        onConnect={vm.start}
      />
    )
  }

  return (
    <div className='flex min-h-screen w-full flex-col bg-background'>
      <div className='relative flex w-full flex-1 flex-col items-center px-4 pb-6 pt-4 sm:px-6 sm:pb-11 sm:pt-13'>
        <PageHeader />

        {renderScreen()}

        <Footer />
      </div>
    </div>
  )
}
