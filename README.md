<div align="center">
  <img src="assets/altersend-logo.png" alt="AlterSend" width="380" />

### File transfer without the cloud storage.

Files go directly between your devices — end-to-end encrypted, no accounts, no servers, no limits.

[![License](https://img.shields.io/badge/license-Apache--2.0-blue.svg)](LICENSE)
[![Platforms](https://img.shields.io/badge/platforms-macOS%20%7C%20Windows%20%7C%20Linux%20%7C%20iOS%20%7C%20Android-lightgrey)](#download)

[Website](https://altersend.com) · [Download](https://altersend.com/download) · [Discord](https://discord.gg/R6tmrk85Vx)

  <br/>

  <img src="assets/desktop-example.png" alt="AlterSend desktop" width="520" align="middle" />
  &nbsp;
  <img src="assets/mobile-example.png" alt="AlterSend mobile" width="240" align="middle" />

</div>

---

## Contents

- [About](#about)
- [Features](#features)
- [Download](#download)
  - [macOS Homebrew](#macos-homebrew)
- [How it works](#how-it-works)
  - [Under the hood](#under-the-hood)
- [For developers](#for-developers)
  - [Prerequisites](#prerequisites)
  - [Setup](#setup)
  - [Run](#run)
  - [Build](#build)
  - [Project structure](#project-structure)
  - [Internationalization](#internationalization)
  - [Tech stack](#tech-stack)
  - [Crash reporting](#crash-reporting)
- [Contributors](#contributors)
- [Contributing](#contributing)
- [Security](#security)
- [License](#license)

## About

AlterSend is a free, open-source app for sending files directly between your devices — no cloud, no uploads, no size limits. Files transfer peer-to-peer and are end-to-end encrypted; nothing is ever stored on a server.

Why use WeTransfer, Dropbox, or Google Drive when you can send files directly — instantly, privately, with no upload costs and no limits?

## Features

- **No accounts** — no signup, no login, no email address required
- **No servers** — files transfer directly device-to-device, nothing stored in the cloud
- **End-to-end encrypted** — only your devices can read your files, always
- **No file size limit** — send a 100 MB photo or 500 GB video archive, same experience
- **Pair your devices** — pair a device once, then send to it without scanning or typing a code each time
- **Cross-platform** — macOS, Windows, Linux, iOS, Android
- **Works everywhere** — local network or across continents, same code path
- **Multi-language** — fully translated UI, available in 12 languages
- **Open source** — Apache-2.0, audit every line yourself

## Download

Get the latest release from [altersend.com/download](https://altersend.com/download) or directly from the table below.

| Platform    | Download                                                                                                                                                                                    |
| ----------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Windows** | [Microsoft Store](https://apps.microsoft.com/detail/9NHLK9GLVDLW) (signed) · [EXE installer](https://github.com/denislupookov/altersend/releases/latest)                                    |
| **macOS**   | [DMG — Apple Silicon](https://github.com/denislupookov/altersend/releases/latest) · [DMG — Intel](https://github.com/denislupookov/altersend/releases/latest) · [Homebrew](#macos-homebrew) |
| **Linux**   | [AppImage](https://github.com/denislupookov/altersend/releases/latest)                                                                                                                      |
| **Android** | [Google Play](https://play.google.com/store/apps/details?id=com.altersend.mobile) · [APK](https://github.com/denislupookov/altersend/releases/latest)                                       |
| **iOS**     | [App Store](https://apps.apple.com/us/app/altersend-file-transfer/id6772496271)                                                                                                             |

> **Windows `.exe`** — not yet signed, so Windows will show "Windows protected your PC" on first run. Click **More info → Run anyway** to install. The Microsoft Store version is signed and avoids this warning.

### macOS Homebrew

You can also install AlterSend on macOS using [Homebrew](https://brew.sh):

```sh
brew install --cask altersend
```

## How it works

1. Open AlterSend on both devices
2. One device shows a **join code** (or QR)
3. The other scans or types it
4. Files transfer directly — peer to peer

```
   ┌─────────┐          encrypted P2P          ┌─────────┐
   │ Device  │ ◄──────────────────────────────► │ Device  │
   │   A     │     direct, no middleman         │   B     │
   └─────────┘                                  └─────────┘
        ▲                                            ▲
        │       peer discovery via Hyperswarm        │
        └────────────────────────────────────────────┘
                   (DHT, no central server)
```

### Under the hood

AlterSend is built on [Hyperswarm](https://github.com/holepunchto/hyperswarm), a Kademlia DHT at its core. Behind those four steps:

1. **A random 32-byte key is generated** for each transfer (`crypto.randomBytes(32)`). That 64-char hex string _is_ the join code you share.
2. **Peers rendezvous on a hash of that key, not the key itself.** Both sides compute the same discovery key — a BLAKE2b hash derived from the join code — and join the DHT on that. The raw key never leaves your device, only its hash is published.
3. **Public bootstrap nodes are the only entry point.** A handful of them get peers onto the DHT. After that, no central server is involved — and there's no relay fallback, so if direct hole-punching fails, the connection fails.
4. **The connection is direct and end-to-end encrypted.** Peers connect over a Noise-encrypted socket, and the sender shares its [Hyperdrive](https://github.com/holepunchto/hyperdrive) key over that channel. Files are imported into the sender's local Hyperdrive, replicated to the receiver's, then written out to disk — so in v1 each side needs roughly **2× the transfer size** in free space while a transfer runs. _(Working to improve this.)_

**Pair once, skip the code.** You can pair devices you own so future transfers go straight through — no code to scan or type. Pairing only stores a public device key, the secret stays in your OS keychain, and a paired device is recognized without exposing your identity to anyone else. See [docs/architecture.md](docs/architecture.md#remembered-devices--pairing) for the full design.

---

## For developers

### Prerequisites

- Node.js 20+
- npm 10+
- Xcode (iOS) or Android Studio (Android)

### Setup

```sh
git clone https://github.com/denislupookov/altersend.git
cd altersend
npm install

cp apps/desktop/.env.example apps/desktop/.env
cp apps/mobile/.env.example apps/mobile/.env
# All env vars are optional in dev — the app runs without them.
```

### Run

```sh
npm run dev            # desktop (Electron)
npm run mobile:start   # mobile (Expo)
```

### Build

```sh
npm run desktop:build  # packages + desktop app
```

Platform installers (`.dmg`, `.exe`, `.AppImage`) are produced by the release CI workflow — trigger manually from the Actions tab.

### Project structure

```
apps/
  desktop/    Electron app — main + renderer + Bare worklet
  mobile/     React Native / Expo app
packages/
  core/       P2P protocol — Hyperswarm, Hyperdrive, RPC
  domain/     State management — Zustand store, business logic
  components/ Cross-platform UI — React Strict DOM + Tailwind
  locales/   Shared locale metadata, i18next setup, and catalogs
docs/
  architecture.md   Full system overview
  i18n.md           Translation workflow and locale coverage
```

See [docs/architecture.md](docs/architecture.md) for data flow and inter-process boundaries.

### Internationalization

Desktop and mobile share translation catalogs through `@altersend/locales`, currently covering 12 locales. See [docs/i18n.md](docs/i18n.md) for the translation workflow.

### Tech stack

[Electron](https://electronjs.org) · [React Native](https://reactnative.dev) · [Expo](https://expo.dev) · [Bare](https://bare.pears.com) · [Hyperswarm](https://github.com/holepunchto/hyperswarm) · [Hyperdrive](https://github.com/holepunchto/hyperdrive) · [React Strict DOM](https://github.com/facebook/react-strict-dom) · [Tailwind](https://tailwindcss.com) · [Zustand](https://github.com/pmndrs/zustand)

### Crash reporting

Crash reporting via [Sentry](https://sentry.io) is opt-in and off by default.

---

## Contributors

[![Contributors](https://contrib.rocks/image?repo=denislupookov/altersend)](https://github.com/denislupookov/altersend/graphs/contributors)

## Contributing

Pull requests welcome. See [CONTRIBUTING.md](CONTRIBUTING.md) for setup, code style, and the PR process.

## Security

Found a vulnerability? Follow the disclosure process in [SECURITY.md](SECURITY.md) — please don't open a public issue.

## License

[Apache-2.0](LICENSE) © AlterSend
