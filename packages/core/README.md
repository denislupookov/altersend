# @altersend/core

The peer-to-peer protocol and transfer orchestration for AlterSend. Hosts a [Bare](https://bare.pears.com/) worklet that owns Hyperswarm peer discovery, Hyperdrive replication, and the wire protocol — isolated from Electron and React Native renderers.

## Architecture

This package has two halves:

- **Worklet** (`src/worklet/`) — runs inside a [Bare](https://bare.pears.com/) process spawned by the host app. Owns the network stack and never touches the UI directly. Communicates with the host over IPC.
- **Client** (`src/client/`) — typed RPC wrapper used by the host (Electron main process / React Native bridge) to invoke worklet commands and subscribe to events.

```
┌─────────────────────────────┐
│ Host app (Electron / RN)    │
│   uses createTransferWorker │
│   Client(...) from this pkg │
└──────────────┬──────────────┘
               │ IPC
┌──────────────▼──────────────┐
│ Bare worklet (this pkg)     │
│   - TransferOrchestrator    │
│   - TransferSwarm (DHT)     │
│   - TransferStorage         │
│   - Sender / Receiver       │
│   - Pairing / Discovery /   │
│     Recognition / Remember  │
│   - DeviceIdentityStore     │
│   - RememberedPeerStore     │
│   - PeerControlChannel      │
└─────────────────────────────┘
```

## Public API

### From the host (renderer / main process)

```ts
import { createTransferWorkerClient } from '@altersend/core';

const client = createTransferWorkerClient(workerProcess, {
  onEvent: (event) => {
    // Receives RendererTransferEvent — status, role, error, peer-control messages
  },
});

await client.ready;
await client.host();                         // generate + join a topic
await client.join(topicHex);                 // join an existing topic
await client.shareFiles(['/path/to/file']);  // stage + announce files
await client.downloadFiles([...]);           // pull from a peer
await client.disconnect();                   // tear down + wipe storage
await client.closePeers();                   // tear down without ending session

await client.initDeviceSecret({ ... });      // inject the keychain-sealed device secret
await client.hostPairing();                  // open the pairing swarm (show a QR)
await client.joinPairing(topicHex);          // join a pairing code (scan a QR)
await client.rememberVote({ ... });          // vote to remember a connected peer
await client.peersList();                    // list remembered devices
await client.inviteDevice({ ... });          // invite a remembered device (no code)
await client.respondToInvite({ ... });       // accept / decline an incoming invite
await client.forgetPeer(devicePubkeyHex);    // remove a remembered device
```

### Wire protocol

Exported types describe every message that crosses the IPC boundary between host and worklet:

- `TransferRPC` — the command surface
- `RendererTransferEvent`, `TransferStatus`, `TransferRole` — events flowing worklet → renderer
- `TransferMethod`, `API` — command identifiers (`API.methods` for request/reply, `API.channels` for emit-only streams)
- `HostReply`, `JoinReply`, `ShareFilesReply`, `DownloadFilesReply`, `DisconnectReply` — RPC reply DTOs
- `DownloadFileRequest`, `DownloadFileResult`, `IncomingFileOffer` — request and result DTOs

Anything not re-exported from `@altersend/core` (the wire-format codecs, command-id constants, validation error class, peer-channel types) is internal and may change without notice.

### Utilities

- `isPathSafe(value)` — generic null-byte + `..` traversal check; safe to call from the renderer (no Bare-only deps)

## Worklet entry point

Built output of `src/worklet/index.ts` is what the host spawns:

```js
// from the host
const worker = pear.run('packages/core/dist/worklet/index.js', [`--storage=${storageRoot}`])
```

The worklet exports nothing — it sets up RPC over IPC and handles `SIGTERM`, `SIGINT`, `beforeExit`, plus Bare's `suspend` / `resume` lifecycle events.

## Storage

The transfer corestore (the Hyperdrive working copy) is wiped on every disconnect — transfers do not resume across sessions, by design. What **does** persist: the device keypair (secret sealed in the OS keychain and injected via `initDeviceSecret`; only the public key + metadata hit disk) and the remembered-peer list (`RememberedPeerStore`, on HyperDB). Resumable transfers remain out of scope.

## Security

Input that comes from peers (control messages) and from the renderer (download requests) is validated at the trust boundary:

- 64-hex-char check on every Hyperdrive key and Hyperswarm topic
- File-name traversal check (no `/`, `\`, `..`, NUL byte, length > 255)
- Per-file size cap (50 GB) and per-download timeout (30 min)
- Hyperdrive entry signature check against wire-claimed size — sender can't lie about file size

**Out of scope:** no rate limit on inbound peer control messages. A connected peer already shares our transfer topic, so a flood of `download-progress` events is treated as a connectivity nuisance, not a security boundary. If your threat model includes hostile paired peers, gate or throttle in the host before forwarding to the renderer.

## Building

```sh
npm run build
```

Bundles via `tsup` (see `tsup.config.ts`) into `dist/`. Three entry points: `index` (host-side public API), `client/worker-client` (RPC wrapper), and `worklet/index` (the Bare worklet entry).

## Testing

```sh
npm test
```

Pure-function tests covering the wire protocol, file-name and path-safety validation, and hex-key validation. The orchestrator / sender / receiver modules don't yet have integration tests — that's a tracked gap.

## License

Apache-2.0
