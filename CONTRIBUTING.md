# Contributing to AlterSend

Thanks for your interest in contributing! This guide covers everything from first-time setup to opening a PR. For a deep dive into how the system is wired, read [docs/architecture.md](docs/architecture.md).

## Prerequisites

- Node.js 22.13+
- pnpm 11+
- For iOS: Xcode 15+ (and CocoaPods, installed automatically by `pnpm run mobile:setup`)
- For Android: Android Studio + an SDK / emulator

## Setup

```sh
git clone https://github.com/denislupookov/altersend.git
cd altersend
pnpm install

# Optional — apps run without these in dev
cp apps/desktop/.env.example apps/desktop/.env
cp apps/mobile/.env.example apps/mobile/.env

# iOS only — installs Pods and builds the Bare worklet for the mobile app
pnpm run mobile:setup
```

## Architecture in one minute

Three layers: **App → Domain → Core worklet** (separate process).

- **App** (Electron renderer / React Native) — UI, reads Zustand state, dispatches commands.
- **Domain** (`packages/domain`) — Zustand store, pure reducer, page view-models. Bridges to the worklet via RPC.
- **Core worklet** (`packages/core`) — runs in a **Bare worklet**, a separate `bare-process` spawned by the host app. Owns all P2P networking (Hyperswarm peer discovery, Hyperdrive file transfer).

The worklet has **no DOM and no Node APIs** — only Bare-flavored modules (`bare-fs`, `bare-process`, etc.). Don't `import` Node built-ins from `packages/core`.

Full diagrams and inter-process boundaries: [docs/architecture.md](docs/architecture.md).

## Running in development

> **Build order matters.** Packages must be built in dependency order before apps can start:
> `core → domain → components → apps`. The scripts below handle this automatically. Don't run `pnpm --filter @altersend/desktop start` directly.

```sh
# Desktop
pnpm run dev

# Mobile (Metro bundler — Expo dev client)
pnpm run mobile:start

# Mobile (build packages + launch iOS simulator)
pnpm run mobile

# UI development in isolation
pnpm run components:storybook   # http://localhost:6100
```

### Multi-peer local testing

To exercise peer-to-peer transfer on a single machine, launch additional desktop instances with their own storage:

```sh
pnpm run desktop:dev:peer2      # second Electron instance
pnpm run desktop:dev:peer3      # third Electron instance
```

Each peer has an isolated identity and storage, so they can discover and transfer to each other as if they were separate devices.

## Project structure

```
apps/
  desktop/    Electron app — main + renderer + Bare worklet runtime
  mobile/     React Native / Expo app
packages/
  core/       P2P protocol — Hyperswarm, Hyperdrive, RPC (Bare worklet)
  domain/     State + business logic — Zustand store, reducer, page models
  components/ Cross-platform UI — React Strict DOM + Tailwind
docs/
  architecture.md   System overview, data flow, process boundaries
  SIGNING.md        Code-signing and notarization (release work)
```

## Design tokens

**Raw color literals are banned** in `apps/**` and `packages/components/**`. Use Tailwind utilities (`bg-success`, `border-info`), StyleX tokens (`tokens.colorXxx`), or `theme.colors.colorXxx` for React Native inline styles. For opacity, use `withAlpha(token, alpha)` (RN) or Tailwind opacity utilities (`bg-success/12`).

The only allowed exceptions are files under `packages/components/src/theme/` — that's the source of truth. `pnpm run check:tokens` enforces this in CI.

## Making changes

1. Fork the repo and create a branch from `main`
2. Make your changes
3. Run the full PR gate locally:
   ```sh
   pnpm run lint                  # ESLint, --max-warnings=0
   pnpm run check:tokens          # token-system enforcement
   pnpm run components:typecheck  # type-check the components package
   pnpm test                      # runs tests across all workspaces
   ```
4. Open a pull request — fill in the PR template

CI runs the same checks; a PR with any of them failing won't be merged.

## Code style

- TypeScript everywhere — `strict: true` across all packages
- Prettier for formatting (config in `.prettierrc` at the repo root)
- ESLint must pass with `--max-warnings=0` (`pnpm run lint`)
- Comments: default to none. Add one only when the _why_ is non-obvious (a hidden constraint, a subtle invariant, a workaround). Don't explain what well-named code already says.
- Avoid stray `console.log` in committed code — `console.warn` / `console.error` are fine for legitimate error paths

## Submitting issues

Use the GitHub issue tracker — pick **Bug report** or **Feature request**. For security issues, **do not open a public issue**; follow the disclosure process in [SECURITY.md](SECURITY.md).
