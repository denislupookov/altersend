import { createCliRuntime } from '../runtime.js'
import { displayQR } from '../qr.js'
import { isValidJoinCode } from '@altersend/domain'
import { isPathSafe } from '@altersend/core'
import fs from 'node:fs/promises'
import path from 'node:path'

export async function send(files: string[], options: { qr?: boolean; temp?: boolean; storage?: string }): Promise<void> {
  const resolvedFiles: string[] = []
  for (const file of files) {
    if (file.includes('*') || file.includes('?')) {
      const matches = await fs.glob(file)
      resolvedFiles.push(...matches)
    } else {
      resolvedFiles.push(path.resolve(file))
    }
  }

  for (const file of resolvedFiles) {
    if (!isPathSafe(file)) {
      console.error(`Unsafe path: ${file}`)
      process.exit(2)
    }
    try {
      await fs.access(file)
    } catch {
      console.error(`File not found: ${file}`)
      process.exit(2)
    }
  }

  const { client, destroy } = await createCliRuntime(options.storage)

  process.on('SIGINT', async () => {
    await client.disconnect()
    destroy()
    process.exit(0)
  })

  try {
    const { topic } = await client.host()
    console.log(`Join code: ${topic}`)
    if (options.qr) {
      await displayQR(topic)
    }
    console.log('Waiting for receiver...')

    const shareRequests = resolvedFiles.map((file) => ({
      path: file,
      isTemporary: options.temp
    }))
    await client.shareFiles(shareRequests)

    client.onEvent = (event) => {
      if (event.type === 'status') {
        if (event.state === 'peer-connected') {
          console.log(`Peer connected (${event.peers} peer[s])`)
        } else if (event.state === 'sharing') {
          console.log(`Sharing "${event.file}"...`)
        } else if (event.state === 'peer-download-progress' && event.file) {
          console.log(`Peer downloading "${event.file}" (${event.bytesTransferred}/${event.totalBytes})`)
        } else if (event.state === 'peer-downloaded' && event.file) {
          console.log(`Peer downloaded "${event.file}"`)
        } else if (event.state === 'peer-disconnected') {
          console.log('Peer disconnected')
        } else if (event.state === 'disconnected') {
          console.log('Transfer complete!')
        }
      } else if (event.type === 'error') {
        console.error(`Error: ${event.message}`)
      }
    }
  } catch (err) {
    console.error('Error:', err instanceof Error ? err.message : String(err))
    destroy()
    process.exit(1)
  }
}