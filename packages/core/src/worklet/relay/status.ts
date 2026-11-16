import Protomux from 'protomux'
import c from 'compact-encoding'
import { allRelaysBusy, markRelayBusy } from './config'

const PROTOCOL = 'altersend-relay-status'

function parseState(raw: string): string | null {
  try {
    const parsed = JSON.parse(raw) as { state?: unknown }
    return typeof parsed.state === 'string' ? parsed.state : null
  } catch {
    return null
  }
}

export function reportRelayBusy(relayKey: Uint8Array, onAllRelaysBusy: () => void): void {
  markRelayBusy(relayKey)
  if (allRelaysBusy()) onAllRelaysBusy()
}

export function watchRelayStatus(
  socket: unknown,
  relayKey: Uint8Array,
  onAllRelaysBusy: () => void
): void {
  try {
    const channel = Protomux.from(socket).createChannel({ protocol: PROTOCOL })
    if (!channel) return

    channel.addMessage<string>({
      encoding: c.string,
      onmessage: (raw) => {
        if (parseState(raw) !== 'busy') return
        reportRelayBusy(relayKey, onAllRelaysBusy)
      }
    })
    channel.open()
  } catch (err) {
    console.warn('relay status: channel setup failed', err instanceof Error ? err.message : err)
  }
}
