import { defineConfig } from 'vitest/config'

export default defineConfig({
  resolve: {
    alias: {
      'bare-fs': 'node:fs'
    }
  }
})
