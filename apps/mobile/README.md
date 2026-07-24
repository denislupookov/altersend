# AlterSend Mobile

React Native / Expo app for peer-to-peer file transfer on iOS and Android.

## Development

```sh
npm install

npm run mobile:start

# iOS (requires Xcode on macOS)
npm run ios -w apps/mobile

# Android (requires Android Studio)
cd apps/mobile && npm run android
```

## Architecture

The mobile app embeds a **Bare worklet** via `react-native-bare-kit`. The worklet runs the same `packages/core` P2P code that the desktop app uses — Hyperswarm discovery and chunked file transfer via `@altersend/drive` (with Hyperdrive as the fallback for older peers). React Native communicates with the worklet over RPC.

```
React Native UI ─── RPC ─── Bare worklet
                          (Hyperswarm / drive)
```

The shared `packages/domain` layer manages state (Zustand) and business logic identically across desktop and mobile.

### Regenerating native projects

`ios/` and `android/` are not tracked — they are generated from `app.json`. After changing `app.json`, `Info.plist`-relevant plugin config, or upgrading Expo SDK:

```sh
npx expo prebuild --clean
```
