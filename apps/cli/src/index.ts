#!/usr/bin/env node

import { command, flag, arg, description, summary, sloppy } from 'paparam'
import { send } from './commands/send'
import { receive } from './commands/receive'
import { status } from './commands/status'
import { cancel } from './commands/cancel'
import { disconnect } from './commands/disconnect'
import { peek } from './commands/peek'
import { checkUpdate } from './commands/check-update'
import { update } from './commands/update'

const noUpdates = flag('--no-updates', 'skip OTA update checks')

const sendCmd = command(
  'send',
  summary('Share files'),
  flag('--qr', 'show QR code for receiver'),
  flag('--temp', 'delete files after transfer'),
  flag('--storage <path>', 'custom storage path'),
  noUpdates,
  sloppy({ flags: true, args: true })
)

const receiveCmd = command(
  'receive',
  summary('Receive files'),
  arg('<join-code>'),
  flag('--output <dir>', 'download directory'),
  flag('--storage <path>', 'custom storage path'),
  noUpdates
)

const statusCmd = command('status', summary('Show transfer status'), flag('--storage <path>', 'custom storage path'), noUpdates)
const cancelCmd = command('cancel', summary('Abort in-progress transfer'), flag('--storage <path>', 'custom storage path'), noUpdates)
const disconnectCmd = command('disconnect', summary('End session gracefully'), flag('--storage <path>', 'custom storage path'), noUpdates)

const peekCmd = command(
  'peek',
  summary('Preview files without downloading'),
  arg('<join-code>'),
  flag('--storage <path>', 'custom storage path'),
  noUpdates
)

const checkUpdateCmd = command(
  'check-update',
  summary('Check for available updates'),
  flag('--storage <path>', 'custom storage path'),
  noUpdates
)

const updateCmd = command(
  'update',
  summary('Apply a staged update'),
  flag('--storage <path>', 'custom storage path'),
  noUpdates
)

const cli = command(
  'altersend',
  description('P2P file transfer CLI'),
  flag('--storage <path>', 'custom storage path'),
  noUpdates,
  sloppy({ flags: true, args: true }),
  sendCmd,
  receiveCmd,
  statusCmd,
  cancelCmd,
  disconnectCmd,
  peekCmd,
  checkUpdateCmd,
  updateCmd
)

const result = cli.parse()

if (!result) process.exit(0)

const name = result.name
const flags = result.flags
const restItems = result.rest || []
const positionals = result.positionals

function extractFilesFromRest(items: string[]): string[] {
  const files: string[] = []
  let i = 0
  while (i < items.length) {
    const item = items[i]
    if (item.startsWith('--')) {
      const flagName = item.includes('=') ? item.split('=')[0] : item
      if (flagName === '--qr' || flagName === '--temp' || flagName === '--no-qr' || flagName === '--no-temp') {
        i++
        continue
      }
      if (item.includes('=')) {
        i++
        continue
      }
      i += 2
      continue
    }
    files.push(item)
    i++
  }
  return files
}

const updates = flags.updates !== false

if (name === 'send') {
  const files = extractFilesFromRest(restItems)
  send(files, { qr: !!flags.qr, temp: !!flags.temp, storage: flags.storage as string | undefined, updates })
} else if (name === 'receive') {
  receive(positionals[0] || restItems[0], { output: flags.output as string | undefined, storage: flags.storage as string | undefined, updates })
} else if (name === 'status') {
  status({ storage: flags.storage as string | undefined, updates })
} else if (name === 'cancel') {
  cancel({ storage: flags.storage as string | undefined, updates })
} else if (name === 'disconnect') {
  disconnect({ storage: flags.storage as string | undefined, updates })
} else if (name === 'peek') {
  peek(positionals[0] || restItems[0], { storage: flags.storage as string | undefined, updates })
} else if (name === 'check-update') {
  checkUpdate({ storage: flags.storage as string | undefined, updates })
} else if (name === 'update') {
  update({ storage: flags.storage as string | undefined, updates })
}
