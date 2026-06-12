#!/usr/bin/env node

import { command, flag, sloppy } from 'paparam'
import { send } from './commands/send.js'
import { receive } from './commands/receive.js'
import { status } from './commands/status.js'
import { cancel } from './commands/cancel.js'
import { disconnect } from './commands/disconnect.js'
import { peek } from './commands/peek.js'

const cli = command('altersend').fullDescription('P2P file transfer CLI').add(
  flag('--storage <path>', 'custom storage path'),
  flag('--help', 'show help'),
  flag('--version', 'show version')
)

cli.command('send').description('Share files').argument('<files>...').add(flag('--qr', 'display QR code'), flag('--temp', 'delete files after transfer')).action(send)

cli.command('receive').description('Receive files').argument('<join-code>').add(flag('--output <dir>', 'download directory')).action(receive)

cli.command('status').description('Show transfer status').action(status)

cli.command('cancel').description('Abort in-progress transfer').action(cancel)

cli.command('disconnect').description('End session gracefully').action(disconnect)

cli.command('peek').description('Preview files without downloading').argument('<join-code>').action(peek)

sloppy({ flags: true, args: true })(cli)

const args = process.argv.slice(2)
cli.parse(args)