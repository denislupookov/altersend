import { describe, it, expect, afterEach } from 'vitest'
import os from 'os'
import path from 'path'
import fs from 'fs'
import { RememberedPeerStore } from './store'
import type { RememberedPeer } from './remembered-peer'

const KEY_A = 'a'.repeat(64)
const KEY_B = 'b'.repeat(64)

function makePeer(overrides: Partial<RememberedPeer> = {}): RememberedPeer {
  return {
    remoteDevicePubkey: KEY_A,
    rendezvousTopic: 'c'.repeat(64),
    displayName: 'My Laptop',
    deviceType: 'laptop',
    isMine: false,
    autoAccept: false,
    blocked: false,
    pairedAt: 1,
    lastSeenAt: 2,
    ...overrides
  }
}

const dirs: string[] = []
function tmpStore(): RememberedPeerStore {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'rps-'))
  dirs.push(dir)
  return new RememberedPeerStore(dir)
}

afterEach(() => {
  for (const dir of dirs.splice(0)) fs.rmSync(dir, { recursive: true, force: true })
})

describe('RememberedPeerStore (hyperdb)', () => {
  it('remembers, gets, and lists a peer', async () => {
    const store = tmpStore()
    await store.remember(makePeer())
    expect((await store.get(KEY_A))?.displayName).toBe('My Laptop')
    expect(await store.list()).toHaveLength(1)
    await store.close()
  })

  it('upserts by pubkey, preserving flags while refreshing topic/lastSeen', async () => {
    const store = tmpStore()
    await store.remember(makePeer({ blocked: true, pairedAt: 100 }))
    const merged = await store.remember(
      makePeer({ rendezvousTopic: 'd'.repeat(64), lastSeenAt: 999, blocked: false })
    )
    expect(merged.blocked).toBe(true)
    expect(merged.pairedAt).toBe(100)
    expect(merged.rendezvousTopic).toBe('d'.repeat(64))
    expect(merged.lastSeenAt).toBe(999)
    expect(await store.list()).toHaveLength(1)
    await store.close()
  })

  it('patches an existing peer and returns null for a missing one', async () => {
    const store = tmpStore()
    await store.remember(makePeer())
    expect((await store.rename(KEY_A, 'New Name'))?.displayName).toBe('New Name')
    expect((await store.setBlocked(KEY_A, true))?.blocked).toBe(true)
    expect(await store.rename(KEY_B, 'Nope')).toBeNull()
    await store.close()
  })

  it('forgets one peer and clears all', async () => {
    const store = tmpStore()
    await store.remember(makePeer({ remoteDevicePubkey: KEY_A }))
    await store.remember(makePeer({ remoteDevicePubkey: KEY_B }))
    await store.forget(KEY_A)
    expect(await store.list()).toHaveLength(1)
    await store.clear()
    expect(await store.list()).toHaveLength(0)
    await store.close()
  })

  it('keys are case-insensitive', async () => {
    const store = tmpStore()
    await store.remember(makePeer({ remoteDevicePubkey: 'AB'.repeat(32) }))
    expect(await store.get('ab'.repeat(32))).not.toBeNull()
    await store.close()
  })
})
