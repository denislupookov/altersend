import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import viteBabel from 'vite-plugin-babel'
import { nodePolyfills } from 'vite-plugin-node-polyfills'
import { join, resolve } from 'path'

// Mirrors apps/desktop's renderer build (react-strict-dom + stylex + tailwind v4)
// and adds node polyfills for the holepunch client stack (dht-relay / protomux /
// sodium). @altersend/core is stubbed — the web build never runs Bare code.
export default defineConfig(async ({ mode }) => {
  const workspaceRoot = resolve(__dirname, '../..')
  const dev = mode !== 'production'
  const babel = await import('@babel/core')
  const { default: styleXPlugin } = await import('@stylexjs/babel-plugin')

  const styleXOptions = {
    debug: dev,
    dev,
    importSources: [{ from: 'react-strict-dom', as: 'css' }],
    runtimeInjection: false,
    styleResolution: 'property-specificity' as const,
    unstable_moduleResolution: {
      rootDir: join(__dirname, '..', '..'),
      themeFileExtension: '.css',
      type: 'commonJS' as const
    }
  }

  const rsdRuntimePlugin = {
    name: 'react-strict-dom-runtime-transform',
    enforce: 'pre' as const,
    async transform(code: string, id: string) {
      if (!id.includes('react-strict-dom') || !id.includes('runtime')) return null
      if (!code.includes('stylex.create') && !code.includes('css.create')) return null

      const result = await babel.transformAsync(code, {
        filename: id,
        plugins: [[styleXPlugin, { ...styleXOptions, importSources: ['@stylexjs/stylex'] }]],
        configFile: false,
        babelrc: false,
        sourceMaps: true
      })
      if (!result?.code) return null
      return { code: result.code, map: result.map }
    }
  }

  return {
    plugins: [
      nodePolyfills({
        globals: { Buffer: true, process: true, global: true },
        protocolImports: true
      }),
      react({
        babel: { configFile: resolve(__dirname, 'babel.config.cjs') }
      }),
      rsdRuntimePlugin,
      viteBabel(),
      tailwindcss()
    ],
    root: join(__dirname, 'src'),
    // root is src/, so point publicDir at the app's own public/ folder.
    publicDir: join(__dirname, 'public'),
    envDir: __dirname,
    base: './',
    build: {
      outDir: join(__dirname, 'dist'),
      emptyOutDir: true
    },
    resolve: {
      alias: [
        { find: /^react$/, replacement: resolve(workspaceRoot, 'node_modules/react/index.js') },
        {
          find: /^react\/jsx-runtime$/,
          replacement: resolve(workspaceRoot, 'node_modules/react/jsx-runtime.js')
        },
        {
          find: /^react\/jsx-dev-runtime$/,
          replacement: resolve(workspaceRoot, 'node_modules/react/jsx-dev-runtime.js')
        },
        {
          find: /^react-dom$/,
          replacement: resolve(workspaceRoot, 'node_modules/react-dom/index.js')
        },
        {
          find: /^react-dom\/client$/,
          replacement: resolve(workspaceRoot, 'node_modules/react-dom/client.js')
        },
        {
          find: /^@altersend\/core$/,
          replacement: resolve(__dirname, 'src/stubs/altersend-core.ts')
        },
        {
          find: /^@altersend\/drive\/transport$/,
          replacement: resolve(__dirname, '../../packages/drive/src/transport.ts')
        },
        {
          find: /^@altersend\/drive$/,
          replacement: resolve(__dirname, '../../packages/drive/src/index.ts')
        },
        {
          find: /^@altersend\/components\/theme$/,
          replacement: resolve(__dirname, '../../packages/components/src/theme/index.ts')
        },
        {
          find: /^@altersend\/components\/icons$/,
          replacement: resolve(__dirname, '../../packages/components/src/icons/index.ts')
        },
        {
          find: /^@altersend\/components$/,
          replacement: resolve(__dirname, '../../packages/components/src/index.ts')
        },
        {
          find: /^@altersend\/domain$/,
          replacement: resolve(__dirname, '../../packages/domain/src/index.ts')
        },
        {
          find: /^@altersend\/locales$/,
          replacement: resolve(__dirname, '../../packages/locales/src/index.ts')
        }
      ],
      dedupe: ['react', 'react-dom'],
      extensions: [
        '.web.js',
        '.web.jsx',
        '.web.ts',
        '.web.tsx',
        '.mjs',
        '.js',
        '.mts',
        '.ts',
        '.jsx',
        '.tsx',
        '.json'
      ]
    },
    optimizeDeps: {
      exclude: ['react-strict-dom']
    },
    server: {
      fs: { allow: [resolve(__dirname, '../..')] },
      port: 3100
    }
  }
})
