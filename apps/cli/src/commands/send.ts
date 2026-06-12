import { createCliRuntime, type EventCallback } from '../runtime.js'
import { displayQR } from '../qr.js'
import { writeProgress, clearProgress } from '../progress.js'
import { isPathSafe } from '@altersend/core'
import fs from 'node:fs/promises'
import path from 'node:path'

export async function send(files: string[], options: { qr?: boolean; temp?: boolean; storage?: string; updates?: boolean }): Promise<void> {
  if (files.length === 0) {
    console.error('No files specified. Usage: altersend send <files>...')
    process.exit(2)
  }

  const resolvedFiles = files.map((f) => path.resolve(f))

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

  let done: () => void
  const donePromise = new Promise<void>((resolve) => {
    done = resolve
  })

  let interrupted = false
  let peerConnected = false

  const onEvent: EventCallback = (event) => {
    if (event.type === 'status') {
      if (event.state === 'peer-connected') {
        peerConnected = true
        console.log(`Peer connected (${event.peers} peer[s])`)
      } else if (event.state === 'sharing' && event.file) {
        console.log(`Sharing "${event.file}"...`)
      } else if (event.state === 'peer-download-progress' && event.file && event.totalBytes) {
        writeProgress({ file: event.file, current: event.bytesTransferred ?? 0, total: event.totalBytes }, 'Peer downloading')
      } else if (event.state === 'peer-downloaded' && event.file) {
        clearProgress()
        console.log(`Peer downloaded "${event.file}"`)
      } else if (event.state === 'peer-disconnected') {
        console.log('Peer disconnected')
        if (interrupted) {
          clearProgress()
          console.log('Transfer cancelled.')
        }
        done()
      } else if (event.state === 'disconnected') {
        if (interrupted) {
          clearProgress()
          console.log('Transfer cancelled.')
        } else {
          console.log('Connection closed.')
        }
        done()
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
    if (interrupted) return
    interrupted = true
    await client.disconnect()
    exitDeferred()
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

    while (!peerConnected && !interrupted) {
      await new Promise((r) => setTimeout(r, 100))
    }

    if (interrupted) return
    await client.shareFiles(shareRequests)

    await donePromise
    process.removeAllListeners('SIGINT')
    destroy()
    process.exit(0)
  } catch (err) {
    console.error('Error:', err instanceof Error ? err.message : String(err))
    destroy()
    process.exit(1)
  }
}