const { copyFileSync, mkdirSync } = require('node:fs')
const { dirname, resolve } = require('node:path')

const source = resolve(__dirname, '../src/electron/preload.cjs')
const destination = resolve(__dirname, '../dist/electron/preload.cjs')

mkdirSync(dirname(destination), { recursive: true })
copyFileSync(source, destination)
