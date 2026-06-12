import { createCliRuntime, type EventCallback } from '../runtime.js'
import { isValidJoinCode, extractJoinCode } from '@altersend/domain'

export async function peek(joinCode: string, options: { storage?: string }): Promise<void> {
  const code = extractJoinCode(joinCode)
  if (!code || !isValidJoinCode(code)) {
    console.error('Invalid join code. Must be 64 hex characters.')
    process.exit(2)
  }

  const onEvent: EventCallback = (event) => {
    if (event.type === 'status') {
      if (event.state === 'peer-connected') {
        console.log(`Peer connected (${event.peers} peer[s])`)
      } else if (event.state === 'joined') {
        console.log('Waiting for file offers...')
      } else if (event.state === 'peer-disconnected') {
        console.log('Peer disconnected')
      } else if (event.state === 'disconnected') {
        console.log('Session ended.')
      }
    } else if (event.type === 'error') {
      console.error(`Error: ${event.message}`)
    }
  }

  const { client, destroy } = await createCliRuntime(options.storage, onEvent)

  process.on('SIGINT', async () => {
    await client.disconnect()
    destroy()
    process.exit(0)
  })

  try {
    console.log('Connecting to peer...')
    await client.join(code)
    console.log('Connected! Waiting for file offers...')

    await new Promise<void>((resolve) => {
      const checkDone = setInterval(() => {}, 1000)
      process.on('SIGINT', () => {
        clearInterval(checkDone)
        resolve()
      })
    })
  } catch (err) {
    console.error('Error:', err instanceof Error ? err.message : String(err))
    destroy()
    process.exit(1)
  }
}