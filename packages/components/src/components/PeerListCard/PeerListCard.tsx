import { html } from 'react-strict-dom'
import { Button } from '../Button'
import { styles } from './styles'

export type PeerListCardStatus = 'online' | 'downloading' | 'downloaded' | 'failed' | 'disconnected'
export type PeerPairState = 'pairable' | 'requested' | 'paired'

export interface PeerListCardEntry {
  peerKey: string
  shortKey: string
  status: PeerListCardStatus
  statusLabel: string
  detail: string | null
  progressPercent?: number
  pairState?: PeerPairState
}

interface PeerListCardProps {
  entries: PeerListCardEntry[]
  onPair?: (peerKey: string) => void
}

const DOT_TONE = {
  online: styles.dotOnline,
  downloading: styles.dotDownloading,
  downloaded: styles.dotDownloaded,
  failed: styles.dotFailed,
  disconnected: styles.dotDisconnected
} as const

const TEXT_TONE = {
  online: styles.textOnline,
  downloading: styles.textDownloading,
  downloaded: styles.textDownloaded,
  failed: styles.textFailed,
  disconnected: styles.textDisconnected
} as const

export function PeerListCard({ entries, onPair }: PeerListCardProps) {
  if (entries.length === 0) return null

  return (
    <html.section style={styles.section}>
      <html.div style={styles.list}>
        {entries.map((entry, index) => (
          <PeerRow
            key={entry.peerKey}
            entry={entry}
            isLast={index === entries.length - 1}
            onPair={onPair}
          />
        ))}
      </html.div>
    </html.section>
  )
}

interface PeerRowProps {
  entry: PeerListCardEntry
  isLast: boolean
  onPair?: (peerKey: string) => void
}

function PairControl({ entry, onPair }: PeerRowProps) {
  switch (entry.pairState) {
    case 'pairable':
      return (
        <Button onClick={() => onPair?.(entry.peerKey)} size='sm' variant='primary'>
          Pair
        </Button>
      )
    case 'requested':
      return (
        <Button disabled size='sm' variant='secondary'>
          Requested…
        </Button>
      )
    case 'paired':
      return <html.p style={styles.pairedText}>Paired</html.p>
    default:
      return null
  }
}

function PeerRow({ entry, isLast, onPair }: PeerRowProps) {
  const isDimmed = entry.status === 'disconnected'
  const showBar = entry.status === 'downloading' && typeof entry.progressPercent === 'number'
  const clampedPercent = showBar ? Math.max(0, Math.min(100, entry.progressPercent ?? 0)) : 0

  return (
    <html.div style={[styles.row, isLast && styles.rowLast, isDimmed && styles.rowDimmed]}>
      <html.div style={styles.rowInner}>
        <html.div style={styles.identity}>
          <html.div style={styles.avatar}>
            <html.p style={styles.avatarText}>{entry.shortKey.slice(0, 2)}</html.p>
          </html.div>
          <html.div style={styles.textBlock}>
            <html.p style={styles.peerKey}>{entry.shortKey}</html.p>
            {entry.detail ? <html.p style={styles.detail}>{entry.detail}</html.p> : null}
          </html.div>
        </html.div>

        <html.div style={styles.rowRight}>
          <html.div style={styles.status}>
            <html.span style={[styles.statusDot, DOT_TONE[entry.status]]} />
            <html.p style={[styles.statusText, TEXT_TONE[entry.status]]}>
              {entry.statusLabel}
            </html.p>
          </html.div>
          <PairControl entry={entry} isLast={isLast} onPair={onPair} />
        </html.div>
      </html.div>

      {showBar ? (
        <html.div style={styles.progressTrack}>
          <html.div style={styles.progressBar(clampedPercent)} />
        </html.div>
      ) : null}
    </html.div>
  )
}
