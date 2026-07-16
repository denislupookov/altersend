# @altersend/drive

Chunked file transfer over a caller-supplied channel. The sender reads byte
ranges from the source file (`pread`) and the receiver writes them to their
offsets in the destination (`pwrite`). Neither side makes an intermediate copy.

## Usage

```ts
import { Drive } from '@altersend/drive'

const drive = new Drive(receiveDir)
const savedTo = await drive.receive('photo.jpg', channelB)
await drive.send(filePath, channelA)
```

`receive` takes a name and saves it under the configured directory. `send` takes
a full path to any file on disk — the directory says where files arrive, not
where they may be sent from.

If the destination varies per transfer, skip `Drive` and pass full paths:

```ts
import { sendFile, receiveFile } from '@altersend/drive'

const savedTo = await receiveFile(destPath, channelB)
await sendFile(srcPath, channelA)
```

`transferId` is optional — the sender generates one, the receiver adopts it. Pass
one explicitly when a channel carries several transfers at once.

For a non-disk source, drive the sessions with your own reader/writer:

```ts
import { SenderSession, ReceiverSession, DiskReader, DiskWriter } from '@altersend/drive'

const receiver = new ReceiverSession(new DiskWriter(destPath), channelB, { transferId })
const savedTo = await receiver.receive()

const sender = new SenderSession(new DiskReader(srcPath), channelA, { transferId, name })
await sender.start()
await sender.close()
```

## Protocol

```
start    { transferId, name, size, chunkSize }   sender → receiver
need     { indices }                              receiver → sender
<chunk>  header{ index, hash } + bytes            sender → receiver
complete { fileHash | null }                      sender → receiver
ack      { savedTo }                              receiver → sender
cancel   { reason? }                              either
```

Chunk size is a pure function of file size, so both sides derive the same
geometry from `start` alone. Each chunk carries a blake2b hash, verified on
arrival. `fileHash` is a hash over the chunk hashes.

## Interfaces

The engine imports no filesystem or socket. It drives three interfaces:

| Interface      | Native           | Browser (not built)           |
| -------------- | ---------------- | ----------------------------- |
| `ChunkReader`  | `bare-fs` pread  | `File.slice().arrayBuffer()`  |
| `ChunkWriter`  | `bare-fs` pwrite | File System Access API / OPFS |
| `DriveChannel` | Protomux on UDX  | WebSocket                     |

This build ships `DiskReader` / `DiskWriter` on `node:fs`; `bare-fs` has the same
`FileHandle` API, so the worklet swaps the import. The root export resolves to an
fs-free build under a browser condition.
