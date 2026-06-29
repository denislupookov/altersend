# @altersend/components

Cross-platform UI components for AlterSend's desktop and mobile apps. Components are written once using [React Strict DOM](https://github.com/facebook/react-strict-dom) and render natively on web (DOM) and React Native (RN primitives).

## Why

The desktop renderer is React + Vite, the mobile app is React Native / Expo. Without this package, every shared visual element (file rows, drop zones, theme tokens, error banners) would be duplicated in each app and drift over time. With React Strict DOM, the same component file works on both platforms — write it here, import from both apps.

## What's included

### Components

| Component                                        | Use                                                                                                               |
| ------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------- |
| `Button`                                         | Action button — `size`, `variant` (primary / secondary / ghost / danger / success), `loading`, `iconOnly`, `pill` |
| `Input`                                          | Form text input with optional label, secure mode, trailing slot                                                   |
| `Badge`                                          | Inline status pill                                                                                                |
| `Card`                                           | Bordered surface container                                                                                        |
| `ActionRow`                                      | List-item / menu row (icon + title + optional subtitle); `tone='danger'` for destructive actions                  |
| `LinkRow`, `LinkCard`                            | Tappable rows grouped in a bordered card — settings & device lists                                                |
| `Tabs`, `TabsList`, `TabsTrigger`, `TabsContent` | Tab pattern with keyboard support                                                                                 |
| `Disclosure`                                     | Collapsible section with header + body                                                                            |
| `ToggleSwitch`                                   | On / off switch                                                                                                   |
| `FileDropZone`                                   | Drag-and-drop / click-to-pick area (web has drag overlay; native is tap-only)                                     |
| `WaitingRadar`                                   | Pulsing radar indicator (e.g. "waiting for someone to join")                                                      |
| `Spinner`                                        | Inline loading spinner                                                                                            |
| `PaginationDots`                                 | Step / carousel dots                                                                                              |
| `PeerListCard`                                   | Connected-peers summary card                                                                                      |
| `KeepAppOpenHint`                                | Banner reminding the user to keep the app open during a transfer                                                  |
| `ErrorBanner`                                    | Inline transient error                                                                                            |
| `ErrorBoundary`                                  | React error boundary class component (renders a `fallback` on caught errors)                                      |
| `CrashScreen`                                    | Full-screen fallback for a fatal error                                                                            |
| `ExternalLink`                                   | Opens a URL in the OS browser                                                                                     |
| `FeedbackTypeSelector`                           | Category picker for the feedback form                                                                             |

### Theme

- `ThemeProvider`, `useTheme`, `ThemeType.Dark` / `ThemeType.Light` — context-driven theme.
- Theme tokens live in `src/theme/tokens.css.ts` and are referenced via `tokens.colorTextPrimary`, `tokens.colorBackgroundSubtle`, etc.

### Icons

`@altersend/components/icons` re-exports a curated set of [Lucide](https://lucide.dev/) icons (e.g. `LockIcon`, `FolderIcon`, `MailIcon`, `GlobeIcon`). Each is wrapped via `adaptLucide` so it works on both web and native with a unified API:

```tsx
import { LockIcon } from '@altersend/components/icons'
;<LockIcon size={16} color='#888' label='Privacy' />
```

### Utilities

- `formatFileSize(bytes)` — single source of truth for "0 B" / "1.5 KB" / "2.3 MB" formatting; matches the version exported from `@altersend/domain`.
- `usePressState` — hook for unified press / hover state.

## Install

```sh
npm install @altersend/components
```

Peer dependencies you must install in your app:

```sh
npm install react react-dom lucide-react        # web
npm install react react-native lucide-react-native  # native
```

## Quick start

Wrap your app in `ThemeProvider`:

```tsx
import { ThemeProvider, ThemeType } from '@altersend/components'
;<ThemeProvider theme={ThemeType.Dark}>
  <App />
</ThemeProvider>
```

Use components like any React component:

```tsx
import { Button, Card, Input } from '@altersend/components'
;<Card>
  <Input label='Connection code' value={code} onChange={setCode} />
  <Button onClick={join}>Connect</Button>
</Card>
```

## Design rules (for contributors)

This package is a **shared primitives library**, not an app-logic layer. Things that belong elsewhere:

- App logic, data normalization, clipboard / file-system behavior — keep these in the host app or in `@altersend/domain`.
- Components whose only job is to preset another primitive (e.g. `PrimaryTransferButton`, `SendButton`). Use the primitive directly with the right props instead.
- Wrapper components that only rename props.

Rules for new components in this package:

- No raw `style` prop on opinionated components — expose semantic props instead.
- Primitives use native DOM-style events (`onClick`, not `onPress`) — React Strict DOM normalizes for us.
- Accessibility is required, not optional. Interactive components must support keyboard. Disabled / read-only states must be explicit. Related controls and panels must be linked with ARIA.
- Must work on both desktop and mobile without changing the public API.

## Storybook

Local component development:

```sh
npm run storybook
```

## License

Apache-2.0
