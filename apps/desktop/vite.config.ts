import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import viteBabel from 'vite-plugin-babel'
import { join, resolve } from 'path'

function originOf(url: string | undefined): string | null {
  if (!url) return null

  try {
    return new URL(url).origin
  } catch {
    throw new Error(`VITE_PRO_API_URL is not a valid url: ${url}`)
  }
}

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
      if (!id.includes('react-strict-dom') || !id.includes('runtime')) {
        return null
      }

      if (!code.includes('stylex.create') && !code.includes('css.create')) {
        return null
      }

      const result = await babel.transformAsync(code, {
        filename: id,
        plugins: [
          [
            styleXPlugin,
            {
              ...styleXOptions,
              importSources: ['@stylexjs/stylex']
            }
          ]
        ],
        configFile: false,
        babelrc: false,
        sourceMaps: true
      })

      if (!result?.code) {
        return null
      }

      return { code: result.code, map: result.map }
    }
  }

  const apiOrigin = originOf(loadEnv(mode, __dirname, 'VITE_').VITE_PRO_API_URL)

  const cspPlugin = {
    name: 'csp-api-origin',
    transformIndexHtml(html: string) {
      if (!apiOrigin) return html
      return html.replace('connect-src ', `connect-src ${apiOrigin} `)
    }
  }

  return {
    plugins: [
      cspPlugin,
      react({
        babel: {
          configFile: resolve(__dirname, 'babel.config.cjs')
        }
      }),
      rsdRuntimePlugin,
      viteBabel(),
      tailwindcss()
    ],
    root: join(__dirname, 'src/renderer'),
    envDir: __dirname,
    base: './',
    build: {
      outDir: join(__dirname, 'dist/renderer'),
      emptyOutDir: true
    },
    resolve: {
      alias: [
        {
          find: /^react$/,
          replacement: resolve(workspaceRoot, 'node_modules/react/index.js')
        },
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
      fs: {
        allow: [resolve(__dirname, '../..')]
      },
      port: 3000
    }
  }
})
