import { createCliRuntime, type EventCallback } from '../runtime.js'
import { isValidJoinCode, extractJoinCode } from '../joinCode.js'
import { writeProgress, clearProgress } from '../progress.js'
import type { RendererTransferEvent, DownloadFileRequest } from '@altersend/core'
import fs from 'node:fs/promises'

export async function receive(joinCode: string, options: { output?: string; storage?: string; updates?: boolean }): Promise<void> {
  const code = extractJoinCode(joinCode)
  if (!code || !isValidJoinCode(code)) {
    console.error('Invalid join code. Must be 64 hex characters.')
    process.exit(2)
  }

  const outputDir = options.output ?? './altersend-downloads'
  await fs.mkdir(outputDir, { recursive: true })

  let clientRef: Awaited<ReturnType<typeof createCliRuntime>>['client'] | null = null
  let done: () => void
  const donePromise = new Promise<void>((resolve) => {
    done = resolve
  })

  let interrupted = false
  let gotTransfer = false

  const onEvent: EventCallback = (event: RendererTransferEvent) => {
    if (event.type === 'transfer-ready') {
      gotTransfer = true
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
          .then(() => {
            if (!interrupted) {
              console.log('All files downloaded. Disconnecting...')
              clientRef!.disconnect().catch((err) => {
                if (!interrupted) {
                  console.error('Disconnect failed:', err instanceof Error ? err.message : String(err))
                }
                if (!interrupted) done()
              })
            }
          })
          .catch((err) => {
            if (!interrupted) {
              console.error('Download failed:', err instanceof Error ? err.message : String(err))
            }
            if (!interrupted) done()
          })
      }
      return
    }

    if (event.type === 'status') {
      if (event.state === 'peer-connected') {
        console.log(`Peer connected (${event.peers} peer[s])`)
      } else if (event.state === 'downloading' && event.file) {
        console.log(`Downloading "${event.file}"...`)
      } else if (event.state === 'download-progress' && event.file && event.totalBytes) {
        writeProgress({ file: event.file, current: event.bytesTransferred ?? 0, total: event.totalBytes }, 'Downloading')
      } else if (event.state === 'downloaded' && event.savedTo) {
        clearProgress()
        console.log(`Saved: ${event.savedTo}`)
      } else if (event.state === 'peer-disconnected') {
        console.log('Peer disconnected')
        if (interrupted) {
          clearProgress()
          console.log('Transfer cancelled.')
        } else if (!gotTransfer) {
          console.log('Connection failed or no sender.')
        } else {
          console.log('Sender cancelled the transfer.')
        }
        done()
      } else if (event.state === 'disconnected') {
        if (interrupted) {
          clearProgress()
          console.log('Transfer cancelled.')
        } else if (!gotTransfer) {
          console.log('Connection closed.')
        } else {
          console.log('Transfer complete!')
        }
        done()
      }
    } else if (event.type === 'error') {
      if (!interrupted) {
        console.error(`Error: ${event.message}`)
      }
    }
  }

  const runtime = await createCliRuntime(options.storage, onEvent, options.updates)
  clientRef = runtime.client

  const exitDeferred = () => {
    runtime.destroy()
    setTimeout(() => process.exit(0), 0)
  }

  process.on('SIGINT', async () => {
    if (interrupted) return
    interrupted = true
    try {
      await runtime.client.disconnect()
    } finally {
      exitDeferred()
    }
  })

  try {
    console.log('Connecting to peer...')
    await runtime.client.join(code)
    console.log('Joined network, waiting for sender...')

    const hintTimer = setTimeout(() => {
      if (!gotTransfer && !interrupted) {
        console.log('(still waiting, sender may not be connected...)')
      }
    }, 10000)

    await donePromise
    clearTimeout(hintTimer)
    process.removeAllListeners('SIGINT')
    runtime.destroy()
    process.exit(0)
  } catch (err) {
    console.error('Error:', err instanceof Error ? err.message : String(err))
    runtime.destroy()
    process.exit(1)
  }
}