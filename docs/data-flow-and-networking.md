# Data Flow and Networking

AlterSend is built for direct device-to-device file transfer. There are no user accounts, no cloud upload step, and no server that stores your files. This document explains what data exists at each step, where it goes, and which outside services or public network infrastructure may be involved.

## Summary

- Your files are selected locally and staged locally before transfer.
- The join code is a random, single-use discovery topic. It does not contain your file names, file contents, device identity, account details, or contact details.
- File contents move over an end-to-end encrypted peer-to-peer connection between the paired devices.
- File names, file sizes, transfer-relative paths, drive keys, and progress messages are shared with the paired peer over that encrypted connection.
- Public HyperDHT bootstrap nodes may be contacted for peer discovery and update discovery. They do not receive your files.
- Crash reporting uses Sentry only when a DSN is built into the app and the user opts in. Community/self-built binaries without DSNs do not send Sentry events.

## What Happens on App Startup

### Desktop

When the desktop app starts, Electron launches the main process and renderer. The renderer also starts the Bare transfer worklet so the app is ready to send or receive.

Two benign network-related things can happen before you choose files or enter a join code:

1. **PearRuntime update discovery**
   - The desktop app constructs a `PearRuntime` instance during startup.
   - `PearRuntime` owns the packaged runtime/update channel configured by the `upgrade` link in `apps/desktop/package.json`.
   - Internally, it uses Hyperdrive and Hyperswarm/HyperDHT to discover update metadata for that update drive.
   - This may open UDP sockets and may contact public HyperDHT bootstrap nodes such as `node1.hyperdht.org:49737`, `node2.hyperdht.org:49737`, and `node3.hyperdht.org:49737`.
   - This is not a file-transfer session and does not expose selected files, file contents, or join codes.

2. **Bare worklet startup**
   - The renderer calls `bindTransferApi()`, which starts the Bare worklet process.
   - The worklet initializes the transfer RPC server and local transfer storage.
   - The transfer swarm does **not** join a send/receive topic until the user starts sending files or joins a receive code.

In a local Windows startup check, the packaged app opened UDP sockets owned by `AlterSend.exe`; the Bare worker did not own active startup TCP or UDP endpoints before a transfer action. The UDP behavior matches HyperDHT/PearRuntime startup behavior.

### Mobile

The mobile app starts the same core transfer worklet through `react-native-bare-kit`. It uses app-local cache storage for transfer data and app document storage for peer identity data. Transfer networking begins when the user starts a send/receive flow.

## Sending Files

1. The sender chooses files or receives a share intent from the OS.
2. The app keeps the selected file paths in local in-memory state so the UI can show the pending selection.
3. When the sender continues, the worklet creates a fresh random 32-byte topic and joins the matching Hyperswarm discovery topic.
4. The app displays the topic as a join code or QR code.
5. The worklet scans the selected files and stages them into a local Hyperdrive/Corestore under AlterSend's local app storage.
6. When a receiver connects, AlterSend sends file offers over the encrypted peer control channel. Offers include metadata needed for the receiver to choose files, such as file names, sizes, paths within the transfer, and drive keys.
7. File bytes are replicated from the sender's local Hyperdrive to the receiver over the encrypted peer connection.

Data involved in this step:

- **Local only before pairing:** original file contents, selected file paths, staged Hyperdrive data.
- **Shared with the paired receiver over the encrypted peer connection:** file names, transfer-relative paths, file sizes, drive keys, transfer status, and file contents selected for transfer.
- **Visible to DHT discovery infrastructure:** discovery traffic for the random topic, public peer keys, and network addressing information needed to connect peers. File contents are not sent to the DHT.

## Receiving Files

1. The receiver scans or enters the join code.
2. The join code is decoded into the same random discovery topic created by the sender.
3. The receiver joins the Hyperswarm topic and discovers the sender through HyperDHT.
4. Once connected, the receiver gets the sender's file offers over the encrypted peer control channel.
5. The receiver chooses where to save files.
6. File bytes replicate from the sender's Hyperdrive to the receiver and are written to the chosen local destination.

Data involved in this step:

- **Entered locally:** join code or QR content.
- **Shared with the paired sender over the encrypted peer connection:** download requests and transfer progress/status. The receiver's local save path is kept local for the receiver UI and is not sent back to the sender.
- **Written locally:** downloaded files at the destination selected by the receiver.
- **Visible to DHT discovery infrastructure:** discovery traffic for the random topic and network addressing information needed to connect peers.

## Services and Infrastructure

### HyperDHT / Hyperswarm

AlterSend uses Hyperswarm for peer discovery and connection setup. Hyperswarm uses HyperDHT bootstrap nodes to find peers for a random topic.

What DHT infrastructure may see:

- The discovery key for a random transfer topic or runtime update drive.
- Public peer keys used by the P2P stack.
- IP addresses and UDP ports involved in discovery and NAT traversal.
- Timing and volume of discovery messages.

What DHT infrastructure does not receive:

- Your file contents.
- File names or transfer-relative file paths.
- Your original OS file paths.
- Your account details, because AlterSend has no accounts.
- Your join code as a human-readable app secret; the network uses derived discovery keys and peer-routing messages.

### PearRuntime Update Channel

Desktop builds include a PearRuntime update channel. On startup, PearRuntime may discover update metadata using Hyperdrive over Hyperswarm/HyperDHT. That can create UDP network activity even before a user starts a transfer.

This update path is separate from file transfer. It is used for runtime/app update discovery and does not inspect or upload user files.

### Sentry Crash Reporting

Crash reporting is opt-in and off by default.

- Desktop main process initializes Sentry early, but `beforeSend` drops events until reporting is enabled.
- Desktop renderer only initializes Sentry if crash reporting is enabled and a `VITE_SENTRY_DSN` exists.
- Mobile uses its configured Sentry integration when a DSN is present.
- Community and self-built binaries without DSNs are Sentry no-ops.

If crash reporting is enabled, error events may include technical diagnostics such as stack traces and app state breadcrumbs. The desktop renderer scrubs home-directory paths before sending events.

## Local Storage

AlterSend stores runtime data locally on the device.

- Desktop PearRuntime storage lives under the app's local application data directory, or under a custom `--storage=` directory when supplied.
- Desktop transfer worklet storage is under the PearRuntime app storage directory.
- Mobile transfer cache storage lives in the app cache directory.
- Mobile peer identity storage lives in the app document directory so it is less likely to be evicted by the OS.

The current core worklet intentionally wipes its Corestore on startup and disconnect for v1 transfer behavior. Transfers are not persisted as a cloud backup.

AlterSend does not add a separate app-level encryption layer for local staged transfer data or peer identity files at rest. Local protection depends on the device operating system and storage encryption. The in-transit peer connection is end-to-end encrypted; local app storage is a separate boundary.

## What AlterSend Does Not Do

- It does not require signup, login, email, or account identity.
- It does not upload files to AlterSend servers.
- It does not store files in a cloud bucket for later download.
- It does not send file contents to Sentry.
- It does not make the DHT bootstrap nodes file hosts.

## Encryption Boundaries

The peer connection itself is encrypted by Hyperswarm's Noise-based transport. AlterSend sends Hyperdrive replication traffic and peer control messages, including file offers and progress, over that encrypted peer connection.

This means file contents and transfer metadata exchanged between paired devices are encrypted in transit. It does not mean all metadata is invisible to every part of the network. DHT/bootstrap infrastructure can still observe discovery and routing metadata such as discovery keys, peer public keys, IP/port information, and timing/volume of discovery messages.

The join code is also a bearer secret: anyone who can see or scan it can attempt to join that transfer session. Treat it like a one-time secret link.

## Network Activity You May Notice

On desktop startup, users or firewall tools may see UDP sockets or HyperDHT-related traffic before selecting files. This is expected for the PearRuntime update/discovery layer and for preparing the P2P runtime. The actual transfer swarm topic for a file send/receive session is joined only after the user starts sending files or enters/scans a receive code.
