import { createCliRuntime, type EventCallback } from '../runtime.js'
import { isValidJoinCode, extractJoinCode } from '../joinCode.js'
import fs from 'node:fs/promises'

export async function receive(joinCode: string, options: { output?: string; storage?: string }): Promise<void> {
  const code = extractJoinCode(joinCode)
  if (!code || !isValidJoinCode(code)) {
    console.error('Invalid join code. Must be 64 hex characters.')
    process.exit(2)
  }

  const outputDir = options.output ?? './altersend-downloads'
  await fs.mkdir(outputDir, { recursive: true })

  const onEvent: EventCallback = (event) => {
    if (event.type === 'status') {
      if (event.state === 'peer-connected') {
        console.log(`Peer connected (${event.peers} peer[s])`)
      } else if (event.state === 'downloading' && event.file) {
        console.log(`Downloading "${event.file}"...`)
      } else if (event.state === 'download-progress' && event.file) {
        console.log(`Downloading "${event.file}" (${event.bytesTransferred}/${event.totalBytes})`)
      } else if (event.state === 'downloaded' && event.savedTo) {
        console.log(`Saved: ${event.savedTo}`)
      } else if (event.state === 'peer-disconnected') {
        console.log('Peer disconnected')
      } else if (event.state === 'disconnected') {
        console.log('Transfer complete!')
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
    console.log('Connected! Waiting for files...')

    await new Promise<void>((resolve) => {
      const checkDone = setInterval(() => {
        // Keep alive until ctrl+c
      }, 1000)
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