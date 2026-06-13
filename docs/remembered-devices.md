# Remembered Devices — Architecture & UX

Reference doc for v2.0 trusted-device feature. Read before touching the worklet / peers code.

## Goal

Let a user send to a previously-paired device without typing a join code again. Keep AlterSend's ephemeral, no-server, no-account properties intact.

## Non-goals (v2.0)

- Root identity / BIP39 mnemonic recovery. Skipped to reduce complexity and improve privacy. Device keypair lives in OS keychain; if it's lost, all remembered peers are lost. Revisit in v2.1 if recovery becomes a real complaint.
- Multi-device-as-same-user across devices. Each install is its own entity.
- Async transfers (sender offline / recipient picks up later). Phase 2 — needs blind-peer infra.
- Background receive on mobile (iOS kills the worklet on background). Receive only works while app is open. Desktop tray mode lands in v2.1.

## Locked decisions

1. **No identity layer.** Each install has one Ed25519 device keypair stored in OS keychain. That's the only persistent crypto material.
2. **Remembering is two-sided opt-in.** Auto-remembering after a transfer is a privacy bug. Both sides must explicitly tap "Remember" in a post-transfer prompt.
3. **No "Devices" tab.** The send flow stays as today (QR + join code); remembered devices appear as additional send-target buttons under the QR. Per-peer management via long-press on a button; global settings under Settings → Privacy.
4. **Receive defaults to modal every time.** Per-peer "auto-accept" is opt-in. Initial value set at remember-time via "Mine / Someone else's" radio.
5. **Foreground-only discovery announcement.** App in foreground → announce on all remembered rendezvous topics. App backgrounded or closed → stop announcing. No background activity, no presence leak when app is closed.
6. **No online/offline dots.** "Recent" cards show last-sent timestamp only. Tapping a card initiates a 60s discovery window — connects or shows "offline."
7. **Size/count guard overrides auto-accept.** Transfers > 5 GB or > 50 files force the modal even if auto-accept is on. Tunable.
8. **Connection codes are bidirectional.** Either side can show a code or scan/enter one. Pairing direction is a physical choice (which device has a usable camera), independent of who's sending. The dedicated pair flow offers both equally; the one-shot send screen defaults to sender-shows-QR with an opposite-mode fallback on each side.

## Connection direction (who shows the code)

Establishing a connection is a separate concern from both the transfer direction and the remember decision. Three independent layers:

1. **Connect** — one device shows a code, the other scans or enters it. Bidirectional: either side can take either part. No commitment. The same connection step is shared by one-shot transfers and device pairing.
2. **Remember** — opt-in trust decision, taken *after* the transfer (see vote protocol below). Never required just to connect.
3. **Repeat send** — once remembered, tap the device; no code, no camera.

Why bidirectional: "who shows / who scans" depends on which device has a working camera, not on who is sending. A webcam-less laptop must be able to *show* a code so a phone can scan it. Manual entry is not a real fallback — the join code is 64 hex chars.

- **One-shot send screen:** default stays sender-shows-QR to keep the common case simple. Each screen also offers the opposite mode — the send screen a "Scan a code instead" option, the receive screen a "Show a code instead" option — so a device that can't scan can flip roles. Connection succeeds as long as one side shows and the other captures.
- **Pair a device flow:** both options presented equally; pick whichever side has a camera.

Requires decoupling role from connection setup in the orchestrator: today `join()` forces the receiver role, which welds "who joined the topic" to "who receives." Role must instead come from intent (who chooses to send), so either side can host the topic / show the code. The swarm and wire protocol are already symmetric and need no changes.

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│ Renderer (Electron) / RN                                │
│   ┌──────────────────────────────────────────────┐      │
│   │ SendPage                                     │      │
│   │   • QR / join code (unchanged from v1)       │      │
│   │   • Remembered device buttons (below QR)     │      │
│   │ ReceivePage                                  │      │
│   │   • Accept modal / auto-accept notification  │      │
│   │ Settings → Privacy                           │      │
│   │   • Block list, per-peer overrides           │      │
│   └──────────────────────────────────────────────┘      │
│           ▲ RPC                                         │
└───────────┼─────────────────────────────────────────────┘
            │
┌───────────┼─────────────────────────────────────────────┐
│ Domain (Zustand)                                        │
│   • peers slice — RememberedPeer[]                      │
│   • pairing slice — pending vote state                  │
│   • receive slice — incoming TransferRequest queue      │
└───────────┼─────────────────────────────────────────────┘
            │ bindTransferApi → worker client
┌───────────┼─────────────────────────────────────────────┐
│ Worklet (Bare process)                                  │
│   identity/                                             │
│     keychain.ts   — OS keychain shim                    │
│     device-key.ts — load/generate device keypair        │
│   peers/                                                │
│     store.ts     — load/save remembered.json            │
│     topic.ts     — rendezvous topic derivation          │
│     discovery.ts — foreground announce/withdraw         │
│     handshake.ts — exchange PairingInfo, verify         │
│     vote.ts      — two-sided remember coordination      │
│   transfer/                                             │
│     orchestrator.ts (modified)                          │
│     swarm.ts (modified)                                 │
└─────────────────────────────────────────────────────────┘
```

## Device keypair

- One Ed25519 keypair per install. Generated on first launch.
- Privkey stored in OS keychain (`keytar` on desktop, `expo-secure-store` on mobile).
- Pubkey + display name + device type stored in `Paths.document/identity/device.json` (non-secret).
- Used for all Noise handshakes via Hyperswarm.
- If keychain item is wiped (reinstall on iOS/Android), a new keypair is generated. All previous remembered peers will reject the new pubkey on reconnect; user must re-pair.

## Pairing handshake

Happens during any normal one-shot transfer. Cost-free — piggybacks on the existing Noise handshake.

Phases:

1. **Connect** — both sides join Hyperswarm topic derived from the join code.
2. **Noise** — standard Hyperswarm Noise XX handshake. Mutual device-pubkey auth. Derives session shared secret via X25519.
3. **PairingInfo exchange** (new) — each side sends:
   ```ts
   type PairingInfo = {
     devicePubkey: Buffer       // 32 bytes (matches Noise pubkey)
     displayName: string        // auto from OS hostname, editable
     deviceType: 'desktop' | 'laptop' | 'phone' | 'tablet'
     capabilities: { canBackground: boolean }
   }
   ```
4. **Compute rendezvous topic** (both sides, independently):
   ```
   sorted = sort([devicePubkeyA, devicePubkeyB])
   rendezvousSecret = HKDF(noiseSharedSecret, "altersend-rendezvous-v1", 32)
   rendezvousTopic  = blake2b(sorted[0] || sorted[1] || rendezvousSecret)
   ```
   Held in memory pending remember decision.
5. **Transfer** — files flow as today.
6. **Remember vote** (new, after transfer completes):
   ```ts
   type RememberVote = { vote: 'remember' | 'no', isMine: boolean }
   ```
   - Both sides prompt user; send vote over Noise channel.
   - Wait up to 60s for the other side's vote.
   - If both `remember` → persist `RememberedPeer` to disk. The `isMine` flag from the *receiver's* side becomes `autoAccept = true` for the receiver storing that record.
   - Anything else → discard rendezvous topic + secret. Nothing persisted.

## Discovery on subsequent launches

```
worklet boot
  → load device keypair from keychain
  → load remembered.json
  → if app is in foreground: announce on every peer's rendezvousTopic

app moves to foreground
  → resume announcements

app moves to background / closes
  → withdraw all announcements

remembered peer connects on a known topic
  → Noise handshake
  → verify remote pubkey === stored peer.devicePubkey
    • match: emit peer.online, keep connection warm
    • mismatch: silent reject, emit peer.identity-mismatch (UI may prompt re-pair)

remembered peer's pubkey rotated (e.g. they reinstalled)
  → mismatch detected on reconnect
  → record stays on disk; user is shown a single "X looks different. Re-pair?" prompt
```

## Sending to a remembered peer

```
user taps Recent card
  → orchestrator.sendToPeer({ devicePubkey, files })
  → worklet joins rendezvousTopic, announces, listens (≤ 60s)
  → if connection established within window:
       Noise handshake (mutual auth against stored pubkey)
       send TransferRequest { files: [{name, size, hash}], totalBytes }
       wait for TransferAccept or TransferDecline
       if accepted: stream Hyperdrive content
       if declined: surface "X declined the transfer"
  → if timeout: surface "Device offline. Try again later."
```

## Receiving from a remembered peer

```
TransferRequest received over Noise channel
  → look up peer.autoAccept (per-peer flag from remembered.json)
  → look up size/count guard:
        if totalBytes > 5 GB OR files.length > 50:
          force modal (override auto-accept)

  if auto-accept and within guard:
     respond TransferAccept immediately
     start receiving into ~/AlterSend/from <peer name>/
     show passive notification with progress + Cancel
  else:
     show accept modal:
       • peer name + device type
       • file list + sizes + total
       • Decline | Accept
       • "Always accept from this device" checkbox
     on accept: respond TransferAccept, behave as above
     on decline: respond TransferDecline, no bytes flow
```

## UX flows

### First send (one-shot, code-based)

Same as today by default — sender shows the QR, receiver scans. Added: each screen offers the opposite mode. The send screen gets a "Scan a code instead" option and the receive screen a "Show a code instead" option, so when a device can't scan (e.g. a webcam-less laptop) the other side scans it instead. Connection succeeds as long as one side shows and the other captures.

### Pair a device (no transfer)

Entry point in Settings → Devices ("Connect a device"). Establishes a connection and runs the pairing handshake without sending files, then shows the Remember prompt directly. Both "Show a code" and "Scan / enter a code" are presented equally — reuses the same bidirectional connection step as the one-shot flow. For setting up trusted devices up front.

### Post-transfer "Remember?" prompt

Shown on **both** sides after a successful transfer. Identical UI:

```
   ✓ Transfer complete

   Remember Denis's MacBook?
   ○  Mine — accept files automatically
   ●  Someone else's — ask each time
   [ Not now ]                       [ Remember ]
```

- Default focus: "Not now."
- Default radio: "Someone else's."
- If user closes app or doesn't choose → treated as "Not now."
- If only one side taps Remember → the other never confirms → both discard. No leak.

### Send to remembered peer

The send flow does **not** branch. After file selection the existing QR / join-code screen renders as today; remembered devices appear as an additional row of buttons below it. The user can either share the QR with a new recipient or tap a remembered device to send directly.

```
   ┌─────────────────────────┐
   │                         │
   │      [ QR code ]        │     ← unchanged from v1
   │                         │
   │       4 8 9 2           │
   └─────────────────────────┘

   Or send to a remembered device:
   [ 💻 Denis's MacBook ]
   [ 📱 Denis's iPhone   ]
   [ 🖥️  Alice's PC      ]
```

- Cards show only the device name (and a small type icon). No "Mine" chip, no last-sent timestamp, no presence dot.
- Tapping a device button → "Connecting…" → progress / "Device offline" after 60s timeout.
- The QR code stays live the whole time; a new recipient typing the code still works in parallel.
- Long-press / right-click on a button → Rename / Toggle "Mine" / Forget / Block.

### Receive from remembered peer (auto-accept off)

Modal blocks until user decides:

```
   📥  Denis's MacBook wants to send
   • presentation.pdf       12 MB
   • photos.zip            847 MB
   Total: 859 MB
   [ Decline ]              [ Accept ]
   ☐ Always accept from this device
```

### Receive from remembered peer (auto-accept on)

Non-blocking notification:

```
   📥  Receiving from Denis's MacBook
   ▓▓▓▓▓▓▓▓░░░  57% • 3 files • 487/859 MB
                                  [ Cancel ]
```

### Settings → Privacy

```
   Auto-accept transfers from remembered devices ……  default per peer
   Block list                                        [ manage ]
   Forget all remembered devices                     [ ]
   Rotate device key (re-pair required everywhere)   [ ]
```

## Storage layout

```
Paths.document/
├── identity/
│   └── device.json
│       { devicePublicKey: hex, displayName: str, deviceType: str, createdAt: ts }
└── peers/
    └── remembered.json
        [
          {
            remoteDevicePubkey: hex,
            rendezvousTopic: hex,
            displayName: str,
            deviceType: str,
            isMine: bool,           // receiver-side classification; drives autoAccept default
            autoAccept: bool,       // initial = isMine
            blocked: bool,
            pairedAt: ts,
            lastSeenAt: ts          // updated silently on rediscovery; not surfaced in UI
          }
        ]

OS Keychain:
└── altersend.device.privkey   (Ed25519 32 bytes)
```

Atomic writes: temp file + rename for both JSON files.

## RPC additions

Commands (renderer → worklet):

| Command | Args | Returns |
|---|---|---|
| `device.status` | — | `{ devicePubkey, displayName, deviceType }` |
| `device.setName` | `{ name }` | `{ ok }` |
| `device.rotate` | — | `{ newDevicePubkey }` (wipes remembered.json) |
| `peers.list` | — | `RememberedPeer[]` |
| `peers.forget` | `{ devicePubkey }` | `{ ok }` |
| `peers.block` | `{ devicePubkey }` | `{ ok }` |
| `peers.rename` | `{ devicePubkey, name }` | `{ ok }` |
| `peers.setMine` | `{ devicePubkey, isMine }` | `{ ok }` |
| `peers.setAutoAccept` | `{ devicePubkey, enabled }` | `{ ok }` |
| `transfer.sendToPeer` | `{ devicePubkey, files }` | `{ transferId }` |
| `transfer.respond` | `{ transferId, decision: 'accept' \| 'decline' }` | `{ ok }` |
| `remember.vote` | `{ transferId, vote, isMine }` | `{ ok }` |

Events (worklet → renderer):

| Event | Payload | Meaning |
|---|---|---|
| `peer.online` | `RememberedPeer` | Remembered peer connected |
| `peer.offline` | `{ devicePubkey }` | Disconnected |
| `peer.identity-mismatch` | `{ devicePubkey, oldPubkey, newPubkey }` | Stored peer presents different key |
| `transfer.incoming-request` | `{ transferId, peer, files, totalBytes }` | Show accept modal |
| `remember.prompt` | `{ transferId, peerName, peerDeviceType }` | Show post-transfer prompt |
| `remember.confirmed` | `{ peer }` | Both sides agreed; peer persisted |
| `remember.declined` | `{ transferId }` | Vote failed; nothing persisted |

## Security guarantees

| Threat | Mitigation |
|---|---|
| Always-on presence broadcast leaks usage | Foreground-only announcing; closing app = invisible |
| One-shot send creates permanent tether | Two-sided opt-in; default radio = "Someone else's"; default focus = "Not now" |
| Coercion to remember | "Forget" is silent + complete; no notification to the other side |
| Surprise unwanted files from remembered peer | Modal default; auto-accept opt-in per peer; size/count guard always overrides |
| Compromised peer pushes large/many files | Size guard (5 GB / 50 files) forces modal even when auto-accept is on |
| Spoofed accept by network attacker | Accept message travels over Noise; impossible without device privkey |
| Remembered peer reinstalls and gets new key | Identity-mismatch event; user explicitly chooses to re-pair |
| Files auto-executed | Quarantined directory + xattrs (`com.apple.quarantine` on macOS, ADS zone on Windows) |
| Files overwrite existing | Auto-rename on collision (`file (1).pdf`) |

## Build order

Each step independently shippable behind a feature flag.

1. **Keychain shim** — `identity/keychain.ts` for desktop (`keytar`) and mobile (`expo-secure-store`).
2. **Device keypair** — generate once on first launch, persist privkey to keychain, pubkey + metadata to `Paths.document/identity/device.json`. Refactor existing `PeerIdentityStore` to load from keychain.
3. **Modify wipe-on-disconnect scope** — preserve `Paths.document/identity/` and `Paths.document/peers/`; only the worklet Corestore is wiped. Update CLAUDE.md note.
4. **Orchestrator role decoupling** — role comes from intent (who sends), not from `join()`; either side can host the topic / show the code. Pure worklet refactor, no identity needed. Foundation for bidirectional connect and `sendToPeer`.
5. **Bidirectional connection UI** — "show a code" / "scan or enter a code" on both send and receive screens; default stays sender-shows-QR with opposite-mode fallback. Ships independently of the rest.
6. **PairingInfo exchange + rendezvous topic derivation** during Noise handshake. No persistence yet — just compute and hold in memory.
7. **Remembered peer storage** — `peers/store.ts`, atomic writes.
8. **Remember vote protocol** — `peers/vote.ts`, post-transfer prompt event, persistence on both-yes.
9. **Discovery loop** — `peers/discovery.ts`, foreground announce/withdraw, identity-match verification on reconnect.
10. **TransferRequest / Accept / Decline protocol** — gate file flow on explicit accept.
11. **Auto-accept + size guard** — per-peer flag, override threshold.
12. **`sendToPeer` command path** — bypass join-code flow for remembered peers.
13. **Pair a device flow** — connect + handshake + remember prompt without sending files; reuses the bidirectional connection UI.
14. **Forget / block / rename / setMine / setAutoAccept** commands.
15. **`Recent` section in `SelectFilesView`** + long-press menu.
16. **Settings → Privacy panel.**
17. **Receive modal + auto-accept notification UI.**
18. **Identity-mismatch handling** (silent reject + UI prompt for re-pair).

## Open polish items (not blockers)

- Pre-transfer "Remember this device" checkbox on send screen (alt entry point).
- Per-peer "Hide my presence from this device" (announce-but-don't-respond mode).
- Migration plan for existing v1 installs (no remembered peers exist → just initialize empty state).
