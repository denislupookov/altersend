const fs = require('fs')
const path = require('path')
require('dotenv').config({ path: path.join(__dirname, '../.env') })

const outDir = path.join(__dirname, '../src/electron')
const GENERATED = [
  { name: 'SENTRY_DSN', file: 'sentry-dsn.gen.ts' },
  { name: 'RELAY_CONF_PUBKEY_HEX', file: 'relay-conf-pubkey.gen.ts' }
]

for (const { name, file } of GENERATED) {
  const value = process.env[name] ?? ''
  fs.writeFileSync(path.join(outDir, file), `export const ${name} = ${JSON.stringify(value)};\n`)
}
