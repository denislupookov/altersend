#!/usr/bin/env node

import { command, flag, arg, description, summary, sloppy } from 'paparam'
import { send } from './commands/send'
import { receive } from './commands/receive'
import { status } from './commands/status'
import { cancel } from './commands/cancel'
import { disconnect } from './commands/disconnect'
import { peek } from './commands/peek'

const sendCmd = command(
  'send',
  summary('Share files'),
  arg('<files>...'),
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
  peekCmd
)

const args = process.argv.slice(2)
const result = cli.parse(args)

if (!result) process.exit(0)

const name = result.name
const argv = result.argv

if (name === 'send') {
  send(argv.positionals.slice(1), { qr: !!argv.flags.qr, temp: !!argv.flags.temp, storage: argv.flags.storage as string | undefined })
} else if (name === 'receive') {
  receive(argv.positionals[1], { output: argv.flags.output as string | undefined, storage: argv.flags.storage as string | undefined })
} else if (name === 'status') {
  status({ storage: argv.flags.storage as string | undefined })
} else if (name === 'cancel') {
  cancel({ storage: argv.flags.storage as string | undefined })
} else if (name === 'disconnect') {
  disconnect({ storage: argv.flags.storage as string | undefined })
} else if (name === 'peek') {
  peek(argv.positionals[1], { storage: argv.flags.storage as string | undefined })
}