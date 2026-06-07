import { describe, expect, it } from 'vitest'
import {
  assertAuthorizedTransferInvocation,
  createPickedPathRegistry,
  recordPickedPath
} from '../src/electron/pathAuthorization'
import type { DownloadFileRequest } from '@altersend/core'

const senderId = 7
const driveKey = 'a'.repeat(64)

function downloadRequest(target: { targetPath?: string; targetDir?: string }): DownloadFileRequest {
  return {
    transferId: 'transfer-1',
    fileId: 'file-1',
    driveKey,
    path: '/photo.jpg',
    name: 'photo.jpg',
    size: 5,
    ...target
  }
}

describe('assertAuthorizedTransferInvocation', () => {
  it('allows picked share paths', () => {
    const registry = createPickedPathRegistry()
    recordPickedPath(registry, senderId, 'C:\\Users\\alice\\Desktop\\photo.jpg', 'file', 'share')

    expect(() =>
      assertAuthorizedTransferInvocation(registry, senderId, 'shareFiles', [
        ['C:\\Users\\alice\\Desktop\\photo.jpg']
      ])
    ).not.toThrow()
  })

  it('rejects unpicked share paths before the worker can read them', () => {
    const registry = createPickedPathRegistry()

    expect(() =>
      assertAuthorizedTransferInvocation(registry, senderId, 'shareFiles', [
        ['C:\\Users\\alice\\Secrets\\token.txt']
      ])
    ).toThrow('Refused: shareFiles path not from a user-approved dialog')
  })

  it('allows picked download destinations', () => {
    const registry = createPickedPathRegistry()
    recordPickedPath(registry, senderId, 'C:\\Users\\alice\\Downloads\\photo.jpg', 'file', 'download')
    recordPickedPath(registry, senderId, 'C:\\Users\\alice\\Downloads', 'directory', 'download')

    expect(() =>
      assertAuthorizedTransferInvocation(registry, senderId, 'downloadFiles', [
        [downloadRequest({ targetPath: 'C:\\Users\\alice\\Downloads\\photo.jpg' })]
      ])
    ).not.toThrow()

    expect(() =>
      assertAuthorizedTransferInvocation(registry, senderId, 'downloadFiles', [
        [downloadRequest({ targetDir: 'C:\\Users\\alice\\Downloads' })]
      ])
    ).not.toThrow()
  })

  it('rejects unpicked download destinations before the worker can write to them', () => {
    const registry = createPickedPathRegistry()
    recordPickedPath(registry, senderId, 'C:\\Users\\alice\\Downloads', 'directory', 'download')

    expect(() =>
      assertAuthorizedTransferInvocation(registry, senderId, 'downloadFiles', [
        [downloadRequest({ targetPath: 'C:\\Users\\alice\\Startup\\payload.exe' })]
      ])
    ).toThrow('Refused: downloadFiles target not from a user-approved dialog')
  })

  it('rejects child paths under picked files and save targets', () => {
    const registry = createPickedPathRegistry()
    recordPickedPath(registry, senderId, 'C:\\Users\\alice\\Downloads\\photo.jpg', 'file', 'download')

    expect(() =>
      assertAuthorizedTransferInvocation(registry, senderId, 'downloadFiles', [
        [downloadRequest({ targetPath: 'C:\\Users\\alice\\Downloads\\photo.jpg\\payload.exe' })]
      ])
    ).toThrow('Refused: downloadFiles target not from a user-approved dialog')
  })

  it('allows child paths under picked directories', () => {
    const registry = createPickedPathRegistry()
    recordPickedPath(registry, senderId, 'C:\\Users\\alice\\Downloads', 'directory', 'download')

    expect(() =>
      assertAuthorizedTransferInvocation(registry, senderId, 'downloadFiles', [
        [downloadRequest({ targetPath: 'C:\\Users\\alice\\Downloads\\photo.jpg' })]
      ])
    ).not.toThrow()
  })

  it('rejects sharing descendants of download-only directories', () => {
    const registry = createPickedPathRegistry()
    recordPickedPath(registry, senderId, 'C:\\Users\\alice\\Downloads', 'directory', 'download')

    expect(() =>
      assertAuthorizedTransferInvocation(registry, senderId, 'shareFiles', [
        ['C:\\Users\\alice\\Downloads\\secret.txt']
      ])
    ).toThrow('Refused: shareFiles path not from a user-approved dialog')
  })

  it('rejects downloading to share-only file paths', () => {
    const registry = createPickedPathRegistry()
    recordPickedPath(registry, senderId, 'C:\\Users\\alice\\Desktop\\photo.jpg', 'file', 'share')

    expect(() =>
      assertAuthorizedTransferInvocation(registry, senderId, 'downloadFiles', [
        [downloadRequest({ targetPath: 'C:\\Users\\alice\\Desktop\\photo.jpg' })]
      ])
    ).toThrow('Refused: downloadFiles target not from a user-approved dialog')
  })
})
