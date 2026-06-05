#!/usr/bin/env node
const { copyFileSync, mkdirSync } = require('fs')
const path = require('path')

const appRoot = path.join(__dirname, '..')
const source = path.join(appRoot, 'src', 'electron', 'preload.cjs')
const targetDir = path.join(appRoot, 'dist', 'electron')

mkdirSync(targetDir, { recursive: true })
copyFileSync(source, path.join(targetDir, 'preload.cjs'))
