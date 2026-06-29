import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

const repoRoot = new URL('../../..', import.meta.url)

const hardcodedCopyChecks = [
  {
    file: 'apps/desktop/src/renderer/pages/TransferPage/index.tsx',
    snippets: [
      'Leaving will end your active share session. Continue?',
      'Leaving will end your active receive session. Continue?',
      'Transfer mode'
    ]
  },
  {
    file: 'apps/desktop/src/renderer/components/QRCode/QRCode.tsx',
    snippets: ['Generating…', 'QR code for connection key']
  },
  {
    file: 'packages/components/src/components/PeerListCard/PeerListCard.tsx',
    snippets: ['Devices', '1 connected', '${activeCount} connected']
  },
  {
    file: 'apps/mobile/src/transfer/receive/views/ErrorPanel.tsx',
    snippets: ['Transfer issue']
  },
  {
    file: 'apps/desktop/src/renderer/components/Settings/SettingsPanel.tsx',
    snippets: ["{' and '}", "{'.'}"]
  },
  {
    file: 'apps/desktop/src/renderer/pages/ReceivePage/ReceiveJoinView.tsx',
    snippets: ['error.message', 's.errorMessage', 'PEER_UNREACHABLE_ERROR_CODE']
  },
  {
    file: 'apps/desktop/src/renderer/pages/ReceivePage/WebcamScanView.tsx',
    snippets: ['error.message']
  },
  {
    file: 'apps/mobile/app/(tabs)/receive/index.tsx',
    snippets: ['s.errorMessage', 'PEER_UNREACHABLE_ERROR_CODE']
  },
  {
    file: 'apps/mobile/app/receive/incoming.tsx',
    snippets: ['s.errorMessage', 'PEER_UNREACHABLE_ERROR_CODE']
  }
]

describe('user-facing source copy', () => {
  it('keeps audited UI copy in translation catalogs instead of source literals', () => {
    const remaining = hardcodedCopyChecks.flatMap(({ file, snippets }) => {
      const source = readFileSync(new URL(file, repoRoot), 'utf8')
      return snippets
        .filter((snippet) => source.includes(snippet))
        .map((snippet) => `${file}: ${snippet}`)
    })

    expect(remaining).toEqual([])
  })
})
