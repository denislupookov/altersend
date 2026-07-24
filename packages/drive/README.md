# @altersend/drive

Chunked file transfer over a caller-supplied channel. The sender reads byte
ranges from the source, the receiver writes them to offsets in the
destination. Neither side makes an intermediate copy.

## Usage

```ts
import { sendFile, receiveFile } from '@altersend/drive'

const savedTo = await receiveFile(destPath, channelB)
await sendFile(srcPath, channelA)
```

`Drive(receiveDir)` wraps these when one directory is reused:
`drive.receive(name, channel)` saves under it, `drive.send(path, channel)` sends
any file on disk.

`transferId` is optional — the sender generates one, the receiver adopts it. Pass
one when a channel carries several transfers.

For a non-disk source, pass your own reader/writer to `SenderSession` /
`ReceiverSession`.

## Protocol

```
start    { transferId, name, size, chunkSize }   sender → receiver
need     { indices }                              receiver → sender
<chunk>  header{ index, hash } + bytes            sender → receiver
complete { fileHash }                             sender → receiver
ack      { savedTo }                              receiver → sender
cancel   { reason? }                              either
```

Chunk size is derived from file size, so both sides compute the same geometry
from `start`. Each chunk carries a blake2b hash, verified on arrival. `fileHash`
hashes the chunk hashes; the receiver checks it on resume.

## Interfaces

The engine imports no filesystem or socket:

| Interface      | Native          | Browser (not built)           |
| -------------- | --------------- | ----------------------------- |
| `ChunkReader`  | pread           | `File.slice().arrayBuffer()`  |
| `ChunkWriter`  | pwrite          | File System Access API / OPFS |
| `DriveChannel` | Protomux on UDX | WebSocket                     |

Ships `DiskReader` / `DiskWriter`. They import `#fs` and `#path`, which the
`imports` map resolves to `bare-fs/promises` / `bare-path` under Bare and the Node
builtins elsewhere, so the same adapter runs in the worklet and in tests. The
root export resolves to an fs-free build under a browser condition.
