import { createCliRuntime, type EventCallback } from '../runtime.js'
import { isValidJoinCode, extractJoinCode } from '../joinCode.js'
import type { RendererTransferEvent } from '@altersend/core'

export async function peek(joinCode: string, options: { storage?: string; updates?: boolean }): Promise<void> {
  const code = extractJoinCode(joinCode)
  if (!code || !isValidJoinCode(code)) {
    console.error('Invalid join code. Must be 64 hex characters.')
    process.exit(2)
  }

  const onEvent: EventCallback = (event: RendererTransferEvent) => {
    if (event.type === 'transfer-ready') {
      const offers = event.files
      console.log(`\n${offers.length} file(s) offered:`)
      for (const f of offers) {
        const size = f.size < 1024
          ? `${f.size} B`
          : f.size < 1024 * 1024
            ? `${(f.size / 1024).toFixed(1)} KB`
            : `${(f.size / (1024 * 1024)).toFixed(1)} MB`
        console.log(`  ${f.name} (${size})`)
      }
      console.log('\nDisconnecting...')
      return
    }

    if (event.type === 'status') {
      if (event.state === 'peer-connected') {
        console.log(`Peer connected (${event.peers} peer[s])`)
      } else if (event.state === 'peer-disconnected') {
        console.log('Peer disconnected')
      } else if (event.state === 'disconnected') {
        console.log('Session ended.')
      }
    } else if (event.type === 'error') {
      console.error(`Error: ${event.message}`)
    }
  }

  const { client, destroy } = await createCliRuntime(options.storage, onEvent, options.updates)

  const exitDeferred = () => {
    destroy()
    setTimeout(() => process.exit(0), 0)
  }

  process.on('SIGINT', async () => {
    await client.disconnect()
    exitDeferred()
  })

  try {
    console.log('Connecting to peer...')
    await client.join(code)
    console.log('Connected! Waiting for file offers...')

    await new Promise<void>((resolve) => {
      process.on('SIGINT', () => resolve())
    })

    await client.disconnect()
    exitDeferred()
  } catch (err) {
    console.error('Error:', err instanceof Error ? err.message : String(err))
    destroy()
    process.exit(1)
  }
}
