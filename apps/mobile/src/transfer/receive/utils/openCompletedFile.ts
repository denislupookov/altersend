import { Linking, Platform } from 'react-native'
import * as Sharing from 'expo-sharing'
import { transferStore } from '@altersend/domain'
import { openContentUri } from '@/modules/media-store'
import { guessMimeType } from './downloadHandlers'

function openIosPhotos(): void {
  Linking.openURL('photos-redirect://').catch((err) =>
    console.error('openCompletedFile: open Photos failed', err)
  )
}

function openSavedContent(contentUri: string, fileName: string): void {
  openContentUri(contentUri, guessMimeType(fileName)).catch((err) =>
    console.error('openCompletedFile: openContentUri failed', err)
  )
}

function toFileUri(savedTo: string): string {
  const path = savedTo.replace(/^file:\/\//, '')
  let decoded = path
  try {
    decoded = decodeURI(path)
  } catch {}
  return `file://${encodeURI(decoded)}`
}

function shareFile(savedTo: string): void {
  void Sharing.isAvailableAsync()
    .then((available) => (available ? Sharing.shareAsync(toFileUri(savedTo)) : undefined))
    .catch((err) => console.error('openCompletedFile: shareAsync failed', err))
}

function openInFiles(savedTo: string): void {
  const url = toFileUri(savedTo).replace(/^file:\/\//, 'shareddocuments://')
  void Linking.openURL(url).catch(() => shareFile(savedTo))
}

export function openCompletedFile(offerKey: string): void {
  const state = transferStore.getState()
  const item = state.receiveDownloadStates[offerKey]
  if (!item || item.status !== 'completed' || !item.savedTo) return

  const offer = state.incomingFileOffers.find((f) => f.id === offerKey)
  const name = offer?.kind === 'file' ? offer.name : ''

  if (item.destination === 'photos' && Platform.OS === 'ios') {
    openIosPhotos()
    return
  }

  if (item.destination === 'photos' || item.destination === 'downloads') {
    openSavedContent(item.savedTo, name)
    return
  }

  if (Platform.OS === 'ios') {
    openInFiles(item.savedTo)
    return
  }

  shareFile(item.savedTo)
}
