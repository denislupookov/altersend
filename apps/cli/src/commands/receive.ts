import { createCliRuntime, type EventCallback } from '../runtime.js'
import { isValidJoinCode, extractJoinCode } from '../joinCode.js'
import type { RendererTransferEvent, DownloadFileRequest } from '@altersend/core'
import fs from 'node:fs/promises'

export async function receive(joinCode: string, options: { output?: string; storage?: string }): Promise<void> {
  const code = extractJoinCode(joinCode)
  if (!code || !isValidJoinCode(code)) {
    console.error('Invalid join code. Must be 64 hex characters.')
    process.exit(2)
  }

  const outputDir = options.output ?? './altersend-downloads'
  await fs.mkdir(outputDir, { recursive: true })

  let clientRef: Awaited<ReturnType<typeof createCliRuntime>>['client'] | null = null

  const onEvent: EventCallback = (event: RendererTransferEvent) => {
    if (event.type === 'transfer-ready') {
      const offers = event.files
      console.log(`Received ${offers.length} file offer(s):`)
      for (const f of offers) {
        console.log(`  - ${f.name} (${f.size} bytes)`)
      }

      const downloads: DownloadFileRequest[] = offers.map((f) => ({
        transferId: f.transferId,
        fileId: f.id,
        driveKey: f.driveKey,
        path: f.path,
        name: f.name,
        size: f.size,
        targetDir: outputDir
      }))

      if (clientRef) {
        clientRef
          .downloadFiles(downloads)
          .catch((err) => {
            console.error('Download failed:', err instanceof Error ? err.message : String(err))
          })
      }
      return
    }

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

  const runtime = await createCliRuntime(options.storage, onEvent)
  clientRef = runtime.client

  process.on('SIGINT', async () => {
    await runtime.client.disconnect()
    runtime.destroy()
    process.exit(0)
  })

  try {
    console.log('Connecting to peer...')
    await runtime.client.join(code)
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
    runtime.destroy()
    process.exit(1)
  }
}
