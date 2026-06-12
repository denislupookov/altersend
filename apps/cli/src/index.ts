#!/usr/bin/env node

import { command, flag, arg, rest as restArg, description, summary, sloppy } from 'paparam'
import { send } from './commands/send'
import { receive } from './commands/receive'
import { status } from './commands/status'
import { cancel } from './commands/cancel'
import { disconnect } from './commands/disconnect'
import { peek } from './commands/peek'
import { checkUpdate } from './commands/check-update'
import { update } from './commands/update'

const sendCmd = command(
  'send',
  summary('Share files'),
  restArg('<files>'),
  flag('--qr', 'display QR code'),
  flag('--temp', 'delete files after transfer')
)

const receiveCmd = command(
  'receive',
  summary('Receive files'),
  arg('<join-code>'),
  flag('--output <dir>', 'download directory')
)

const statusCmd = command('status', summary('Show transfer status'))
const cancelCmd = command('cancel', summary('Abort in-progress transfer'))
const disconnectCmd = command('disconnect', summary('End session gracefully'))

const peekCmd = command(
  'peek',
  summary('Preview files without downloading'),
  arg('<join-code>')
)

const checkUpdateCmd = command(
  'check-update',
  summary('Check for available updates')
)

const updateCmd = command(
  'update',
  summary('Apply a staged update')
)

const cli = command(
  'altersend',
  description('P2P file transfer CLI'),
  flag('--storage <path>', 'custom storage path'),
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
const restFiles = result.rest
const positionals = result.positionals

if (name === 'send') {
  send(restFiles, { qr: !!flags.qr, temp: !!flags.temp, storage: flags.storage as string | undefined })
} else if (name === 'receive') {
  receive(positionals[0] || restFiles[0], { output: flags.output as string | undefined, storage: flags.storage as string | undefined })
} else if (name === 'status') {
  status({ storage: flags.storage as string | undefined })
} else if (name === 'cancel') {
  cancel({ storage: flags.storage as string | undefined })
} else if (name === 'disconnect') {
  disconnect({ storage: flags.storage as string | undefined })
} else if (name === 'peek') {
  peek(positionals[0] || restFiles[0], { storage: flags.storage as string | undefined })
} else if (name === 'check-update') {
  checkUpdate({ storage: flags.storage as string | undefined })
} else if (name === 'update') {
  update({ storage: flags.storage as string | undefined })
}