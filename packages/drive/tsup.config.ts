import { defineConfig } from 'tsup'

export default defineConfig({
  entry: {
    index: 'src/index.ts',
    native: 'src/native.ts',
    transport: 'src/transport.ts'
  },
  format: ['esm'],
  dts: true,
  target: 'esnext',
  outDir: 'dist',
  clean: true,
  bundle: true,
  splitting: true,
  sourcemap: false,
  external: ['#fs', '#path'],
  esbuildOptions(options) {
    options.packages = 'external'
  }
})
