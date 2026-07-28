import { ReceiverSession } from '@altersend/drive'
import { createSink, type WebSink } from './storage'
import type { FileOffer, PeerProtocol } from './peerProtocol'
import type { DownloadHandlers } from './types'

export interface FileTransfer {
  sink: WebSink
  receiver?: { cancel: (reason?: string) => void }
  paused: boolean
}

const fileRef = (offer: FileOffer) => ({
  transferId: offer.transferId,
  fileId: offer.id,
  fileName: offer.name
})

export async function downloadOffer(
  proto: PeerProtocol,
  transfers: Map<string, FileTransfer>,
  offer: FileOffer,
  handlers: DownloadHandlers
): Promise<void> {
  const state: FileTransfer = {
    sink: await createSink({ id: offer.id, name: offer.name }),
    paused: false
  }

  return new Promise<void>((resolve, reject) => {
    transfers.set(offer.id, state)

    const channel = proto.driveSession(offer.id)

    const receiver = new ReceiverSession(state.sink, channel, {
      transferId: offer.id,
      expectedSize: offer.size,
      onProgress: (received, total) => {
        handlers.onProgress?.(received, total)
        proto.sendControl({
          type: 'download-progress',
          ...fileRef(offer),
          bytesTransferred: received,
          totalBytes: total
        })
      }
    })
    state.receiver = receiver

    proto.sendControl({
      type: 'download-request',
      ...fileRef(offer),
      path: offer.name,
      totalBytes: offer.size
    })

    receiver
      .receive()
      .then(async () => {
        await state.sink.save(offer.name)
        proto.sendControl({ type: 'download-complete', ...fileRef(offer), savedTo: offer.name })
        handlers.onDone?.(offer.name, offer.size)
        transfers.delete(offer.id)
        channel.close()
        resolve()
      })
      .catch((err: Error) => {
        channel.close()
        transfers.delete(offer.id)
        if (state.paused) {
          resolve()
          return
        }
        proto.sendControl({ type: 'download-failed', ...fileRef(offer), message: err.message })
        handlers.onError?.(err.message)
        reject(err)
      })
  })
}
