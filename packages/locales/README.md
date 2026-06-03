# @altersend/locales

This package centralizes the internationalization (i18n) infrastructure for the AlterSend application, allowing translations to be shared seamlessly between the React Native (mobile) and Electron (desktop) clients.

## Architecture Guidelines

To maintain a clean separation of concerns and avoid unnecessary dependencies, this package adheres to the following principles:

1. **Shared JSON Dictionaries**: All language strings are stored as JSON files split by context/feature (e.g., `common`, `send`, `receive`). These are located in `src/locales/<code>/`.
2. **Framework-Agnostic Core**: Initialization uses vanilla `i18next` (`src/config.ts`).
3. **Thin React Bindings**: We re-export `useTranslation` from `react-i18next` — the standard, concurrent-safe React binding — rather than maintaining a bespoke hook.
4. **Lean on Intl**: For formatting numbers, dates, and file sizes, we lean on the platform's built-in `Intl` APIs rather than pulling in large formatting libraries (like moment or date-fns).

## Production-ready gating

Each language ships a `src/locales/<code>/meta.json`:

```json
{ "label": "English", "productionReady": true, "dir": "ltr" }
```

`src/languages.ts` aggregates these into a registry. Only **production-ready** languages are surfaced to users:

- `LANGUAGES` — every registered language (ready or not).
- `PICKABLE_LANGUAGES` — production-ready only; this is what the Settings picker renders.

This is how the app stays English-only while the full pipeline is wired: `en` is ready, everything else (`pt-BR`, future RTL languages, …) stays hidden until its `productionReady` flag is flipped. `resolveSupportedLocale()` also resolves only to pickable languages, so system detection or a stale persisted value can never land on a not-yet-ready locale.

## Usage

### In components (reactive)

Scope the hook to the namespace you need; keys are then checked at compile time:

```tsx
import { useTranslation } from '@altersend/locales'

function SendHeader() {
  const { t } = useTranslation('send')
  // `t('steps.nope')` would be a TypeScript error.
  return <h1>{t('steps.selecting.title')}</h1>
}
```

### Outside React

Use the initialized instance directly. Namespaced keys use the `ns:key` form:

```ts
import { i18nextInstance } from '@altersend/locales'

i18nextInstance.t('buttons.cancel') // default `common` namespace
i18nextInstance.t('send:steps.selecting.title') // explicit namespace
```

### Switching language

Locale state lives in the domain settings store (`@altersend/domain`), not here. Call `changeLocale(code)` from the domain package — it normalizes the input, updates the store, and calls `i18next.changeLanguage`.

## Adding a new language

To add a language (e.g., Brazilian Portuguese — `pt-BR`):

1. Create `src/locales/pt-BR/` with a `meta.json` (`productionReady: false` until complete) and a translated copy of each namespace file (`common.json`, `send.json`, …).
2. Register it in the `REGISTRY` in `src/languages.ts` and add its resources to `src/config.ts`.
3. Translate and review the strings.
4. Flip `productionReady` to `true` in its `meta.json` — it now appears in the picker.
