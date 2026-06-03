# @altersend/locales

This package centralizes the internationalization (i18n) infrastructure for the AlterSend application, allowing translations to be shared seamlessly between the React Native (mobile) and Electron (desktop) clients.

## Architecture Guidelines

To maintain a clean separation of concerns and avoid unnecessary dependencies, this package adheres to the following principles:

1. **Shared JSON Dictionaries**: All language strings are stored as JSON files split by context/feature (e.g., `common`, `send`, `receive`). These are located in `src/locales/`.
2. **Framework-Agnostic Core**: The core translation initialization uses vanilla `i18next`.
3. **Thin React Bindings**: We provide a minimal `useTranslate` React hook for UI components to consume translations reactively.
4. **Lean on Intl**: For formatting numbers, dates, and file sizes, we lean on the browser's built-in `Intl` APIs rather than pulling in large formatting libraries (like moment or date-fns) within this package.

## Usage

### Using Translations in Components

Import the `useTranslate` hook to access the reactive translation function `t`:

```tsx
import { useTranslate } from '@altersend/locales'

function MyComponent() {
  const { t } = useTranslate()

  return (
    <div>
      <h1>{t('send.steps.selecting.title', { defaultValue: 'Send files' })}</h1>
    </div>
  )
}
```

### Using Translations Outside React

For places outside of the React lifecycle (e.g., domain reducers, background effects), use the exported `t` function directly, or access the initialized `i18nextInstance`:

```ts
import { i18nextInstance } from '@altersend/locales'

const title = i18nextInstance.t('common.error', { defaultValue: 'An error occurred' })
```

## Adding a New Language

To add a new language (e.g., Brazilian Portuguese - `pt-BR`):

1. Create a new folder under `src/locales/` matching the language code (e.g., `src/locales/pt-BR/`).
2. Copy the structure of the English JSON files (`src/locales/en/*.json`) into your new folder and translate the values.
3. Update `src/config.ts` to import and include the new language resources.
4. Verify the UI fallback strings work correctly.
