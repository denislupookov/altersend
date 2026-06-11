const { getDefaultConfig } = require('expo/metro-config')
const path = require('path')

const projectRoot = __dirname
const monorepoRoot = path.resolve(projectRoot, '../..')

const config = getDefaultConfig(projectRoot)
const workspaceSourceAliases = new Map([
  ['@altersend/core', path.resolve(monorepoRoot, 'packages/core/src/index.ts')],
  ['@altersend/domain', path.resolve(monorepoRoot, 'packages/domain/src/index.ts')],
  ['@altersend/components', path.resolve(monorepoRoot, 'packages/components/src/index.ts')],
  [
    '@altersend/components/icons',
    path.resolve(monorepoRoot, 'packages/components/src/icons/index.ts')
  ],
  [
    '@altersend/components/theme',
    path.resolve(monorepoRoot, 'packages/components/src/theme/index.ts')
  ],
  [
    '@altersend/components/theme/raw',
    path.resolve(monorepoRoot, 'packages/components/src/theme/tokens.raw.ts')
  ],
  ['@altersend/locales', path.resolve(monorepoRoot, 'packages/locales/src/index.ts')]
])

config.watchFolders = [monorepoRoot]
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, 'node_modules'),
  path.resolve(monorepoRoot, 'node_modules')
]

const { transformer, resolver } = config
config.transformer = {
  ...transformer,
  babelTransformerPath: require.resolve('react-native-svg-transformer')
}
config.resolver = {
  ...resolver,
  assetExts: resolver.assetExts.filter((ext) => ext !== 'svg'),
  sourceExts: [...resolver.sourceExts, 'svg'],
  resolveRequest(context, moduleName, platform) {
    return context.resolveRequest(
      context,
      workspaceSourceAliases.get(moduleName) ?? moduleName,
      platform
    )
  }
}

module.exports = config
