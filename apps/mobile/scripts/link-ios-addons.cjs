const { spawnSync } = require('node:child_process')
const path = require('node:path')

const appRoot = path.join(__dirname, '..')
const bareKitDir = path.dirname(require.resolve('react-native-bare-kit/package.json'))
const addonsOut = path.join(bareKitDir, 'ios', 'addons')

const result = spawnSync(
  process.execPath,
  [
    '--input-type=module',
    '-e',
    `
import link from 'bare-link';

for await (const resource of link(${JSON.stringify(appRoot)}, {
  hosts: ['ios-arm64', 'ios-arm64-simulator', 'ios-x64-simulator'],
  out: ${JSON.stringify(addonsOut)}
})) {
  console.log('Wrote', resource);
}
`
  ],
  { stdio: 'inherit' }
)

if (result.error) {
  throw result.error
}

if (typeof result.status === 'number' && result.status !== 0) {
  process.exit(result.status)
}
