# AlterSend Web

Browser-based, **receive-only** file receiver. Open a share link
(`https://app.altersend.com/r#<code>`) and download the files straight from the
sender — no app and no account.

## Development

```sh
npm run dev -w apps/web
```

## How it works

- Reaches the sender over a WebSocket→DHT relay in `transfer/relay.ts` — races the
  built-in relays and keeps the fastest. Files stream in via `@altersend/drive`.
- **Saving** (`transfer/storage/`): streams to a browser download where supported;
  bundles multiple files into a single streamed `.zip` on mobile (browsers can't
  reliably save many downloads at once). In-app browsers (Telegram, …) can't save
  downloads — detected in `inAppBrowser.ts`, the UI tells the user to open in Safari/Chrome.
- The per-transfer size limit comes live from the relay's `/limits.json`, not hardcoded.

## Relays

Defaults to `wss://relay.altersend.com` and `wss://relay-sg.altersend.com` (races
both, keeps the fastest). Override with `VITE_RELAY_URL` (comma-separated) to point
at your own relay in dev.
