import Corestore from 'corestore'
import fs from 'bare-fs'
import Hyperdrive from 'hyperdrive'
import type { PeerSocket } from 'hyperswarm'
import { TransferSender } from './sender'
import { TransferReceiver } from './receiver'

async function tryAsync(label: string, op: () => Promise<unknown>): Promise<void> {
  try {
    await op()
  } catch (err) {
    console.warn(`TransferStorage: ${label} failed`, err)
  }
}

export class TransferStorage {
  private readonly root: string
  private coreStore!: Corestore
  private drive!: Hyperdrive
  private readyPromise!: Promise<void>
  private _sender!: TransferSender
  private _receiver!: TransferReceiver

  constructor(root: string) {
    this.root = root
    this.init()
  }

  get sender(): TransferSender {
    return this._sender
  }

  get receiver(): TransferReceiver {
    return this._receiver
  }

  ready(): Promise<void> {
    return this.readyPromise
  }

  replicate(socket: PeerSocket): void {
    this.coreStore.replicate(socket, { live: true })
  }

  async wipeAndReinit(): Promise<void> {
    await this.wipe()
    this.init()
  }

  async destroy(): Promise<void> {
    await tryAsync('receiver.destroy', () => this._receiver.destroy())
    await this.wipe()
  }

  private init(): void {
    this.coreStore = new Corestore(this.root)
    this.drive = new Hyperdrive(this.coreStore.namespace('outgoing-drive'))
    this.readyPromise = this.drive.ready()
    this._sender = new TransferSender(this.drive)
    this._receiver = new TransferReceiver(this.coreStore.namespace('incoming-drives'))
  }

  private async wipe(): Promise<void> {
    await tryAsync('drive.close', () => this.drive.close())
    await tryAsync('coreStore.close', () => this.coreStore.close())
    await tryAsync('storage rm', () => fs.promises.rm(this.root, { recursive: true, force: true }))
  }
}
