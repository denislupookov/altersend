import { createCliRuntime } from '../runtime.js'
import { isValidJoinCode, extractJoinCode } from '@altersend/domain'
import type { DownloadFileRequest } from '@altersend/core'
import fs from 'node:fs/promises'
import path from 'node:path'

export async function receive(joinCode: string, options: { output?: string; storage?: string }): Promise<void> {
  const code = extractJoinCode(joinCode)
  if (!code || !isValidJoinCode(code)) {
    console.error('Invalid join code. Must be 64 hex characters.')
    process.exit(2)
  }

  const outputDir = options.output ?? './altersend-downloads'
  await fs.mkdir(outputDir, { recursive: true })

  const { client, destroy } = await createCliRuntime(options.storage)

  process.on('SIGINT', async () => {
    await client.disconnect()
    destroy()
    process.exit(0)
  })

  try {
    console.log('Connecting to peer...')
    await client.join(code)
    console.log('Connected! Waiting for files...')

    const pendingOffers: Map<string, { name: string; size: number; driveKey: string }> = new Map()

    client.onEvent = (event) => {
      if (event.type === 'status') {
        if (event.state === 'peer-connected') {
          console.log(`Peer connected (${event.peers} peer[s])`)
        } else if (event.state === 'downloading' && event.file) {
          console.log(`Downloading "${event.file}"...`)
        } else if (event.state === 'download-progress' && event.file) {
          console.log(`Downloading "${event.file}" (${event.bytesTransferred}/${event.totalBytes})`)
        } else if (event.state === 'downloaded' && event.file) {
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

    client.onEvent = (event) => {
      if (event.type === 'peer-offer') {
        pendingOffers.set(event.fileId, {
          name: event.name ?? path.basename(event.path),
          size: event.size ?? 0,
          driveKey: event.driveKey
        })
      }
    }

    await client.join(code)

    const downloadRequests: DownloadFileRequest[] = []
    for (const [fileId, offer] of pendingOffers) {
      downloadRequests.push({
        transferId: 'transfer',
        fileId,
        driveKey: offer.driveKey,
        path: offer.name,
        name: offer.name,
        size: offer.size,
        targetDir: outputDir
      })
    }

    if (downloadRequests.length > 0) {
      await client.downloadFiles(downloadRequests)
    }
  } catch (err) {
    console.error('Error:', err instanceof Error ? err.message : String(err))
    destroy()
    process.exit(1)
  }
}