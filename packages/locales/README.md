# @altersend/locales

Shared internationalization infrastructure for AlterSend desktop and mobile.

## Contracts

- Locale codes are concrete BCP 47-style codes such as `en-US`, `pt-BR`, and `ja-JP`.
- Saved locale state is app-owned and uses `LocalePreference = 'system' | SupportedLocaleCode`.
- `resolveActiveLocalePreference(preference, systemLocales)` converts saved preference plus system locales into the active concrete locale.
- When `isMultiLangEnabled` is false, the active locale resolves to `en-US` and language picker UI stays hidden.
- `packages/domain` stays runtime-agnostic and does not import i18next.

## Catalogs

Resources live in `src/locales/<locale>/` and are split by namespace:

- `common`
- `send`
- `receive`
- `settings`
- `onboarding`
- `feedback`
- `errors`
- `native`

Every locale must keep the same namespace and key set as `en-US`. Resource tests reject missing keys, empty strings, missing plural forms, and untranslated English leftovers outside the explicit allowlist.

## Usage

```tsx
import { useTranslation } from '@altersend/locales'

function Header() {
  const { t } = useTranslation(['send'])
  return <h1>{t('send:page.select.title')}</h1>
}
```

Outside React, use `i18nextInstance` or the package helpers:

```ts
import { changeI18nLanguage, initI18n, resolveActiveLocalePreference } from '@altersend/locales'

await initI18n(resolveActiveLocalePreference(savedPreference, systemLocales))
await changeI18nLanguage('en-US')
```

## Adding A Locale

1. Add the locale to `SUPPORTED_LOCALES` in `src/locale.ts`.
2. Add translated namespace files under `src/locales/<locale>/`.
3. Register the resources in `src/resources.ts`.
4. Add native metadata in the `native` namespace when needed.
5. Run the locale tests before exposing the language.
