# AlterSend Mobile

React Native / Expo app for peer-to-peer file transfer on iOS and Android.

## Development

```sh
# From repo root
pnpm install

# Start Metro bundler
pnpm run mobile:start

# iOS (requires Xcode on macOS)
pnpm --filter @altersend/mobile ios

# Android (requires Android Studio)
pnpm --filter @altersend/mobile android
```

## Architecture

The mobile app embeds a **Bare worklet** via `react-native-bare-kit`. The worklet runs the same `packages/core` P2P code that the desktop app uses — Hyperswarm discovery and Hyperdrive transfers. React Native communicates with the worklet over RPC.

```
React Native UI ─── RPC ─── Bare worklet
                          (Hyperswarm / Hyperdrive)
```

The shared `packages/domain` layer manages state (Zustand) and business logic identically across desktop and mobile.

## Release

Native builds are produced by [EAS Build](https://docs.expo.dev/build/introduction/). Profiles are defined in `eas.json`.

```sh
# From apps/mobile
eas build --profile production --platform ios
eas build --profile production --platform android   # AAB for Play Store

# Local APK for QA (no Sentry source-map upload)
SENTRY_DISABLE_AUTO_UPLOAD=true pnpm run build:apk:local
```

### Required secrets

Set these before running production builds:

- `EXPO_PUBLIC_SENTRY_DSN` — Sentry DSN (read at runtime)
- `SENTRY_AUTH_TOKEN` — for source-map upload during build

### First-time signing setup

#### iOS

Apple Developer credentials — provisioning profile and distribution certificate. The easiest path:

```sh
cd apps/mobile
eas credentials
# Choose iOS → production → "Set up a new Apple Developer account"
# Follow the prompts; EAS stores the cert + profile and uses them on every build
```

#### Android (Play App Signing)

Google Play requires release builds to be signed with a cryptographic **upload key**. (Google then re-signs with the actual app signing key they keep in escrow — this is "Play App Signing".) If you lose the upload key, you can recover; if you used your own app signing key and lost it, you can never update the app again. So always use Play App Signing for a new app.

You don't need to manage the keystore yourself. EAS Build can generate and store the upload keystore for you:

```sh
cd apps/mobile
eas credentials
# Choose Android → production → "Generate new keystore"
# EAS stores it and uses it for every `eas build --platform android` from now on
```

After the first build, upload the AAB to Play Console. Play will prompt you to enroll in Play App Signing — accept. The "app signing key" Google generates is what end users actually see; the upload key you generated above is just how YOU authenticate to Play.

Local Gradle builds (`./gradlew assembleRelease`) still use the debug keystore from `apps/mobile/android/app/build.gradle` — fine for QA/install testing, **not** acceptable for Play submission. Use `eas build` for anything that goes to Play.

### Regenerating native projects

`ios/` and `android/` are not tracked — they are generated from `app.json`. After changing `app.json`, `Info.plist`-relevant plugin config, or upgrading Expo SDK:

```sh
pnpm exec expo prebuild --clean
```
