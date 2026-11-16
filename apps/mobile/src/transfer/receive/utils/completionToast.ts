import { Linking, Platform } from 'react-native'
import type { SaveDestination } from '@altersend/domain'
import { i18nextInstance } from '@altersend/locales'
import { openDownloadsFolder, openGallery } from '@/modules/media-store'
import type { ShowToastInput } from '@/src/components/Toast'

interface BuildCompletionToastInput {
  destinations: SaveDestination[]
}

function logOpenFailure(err: unknown) {
  console.warn('completionToast: open failed', err)
}

function openPhotos() {
  if (Platform.OS === 'android') {
    openGallery().catch(logOpenFailure)
    return
  }
  Linking.openURL('photos-redirect://').catch(logOpenFailure)
}

function openIosFiles() {
  Linking.openURL('shareddocuments://').catch(logOpenFailure)
}

function openAndroidDownloads() {
  openDownloadsFolder().catch(logOpenFailure)
}

function filesToastAction(hasDownloads: boolean): (() => void) | undefined {
  if (Platform.OS === 'ios') return openIosFiles
  if (hasDownloads) return openAndroidDownloads
  return undefined
}

const LONG_DURATION_MS = 6000

export function buildCompletionToast({
  destinations
}: BuildCompletionToastInput): ShowToastInput | null {
  const count = destinations.length
  if (count === 0) return null

  const photosCount = destinations.filter((d) => d === 'photos').length
  const nonPhotosCount = count - photosCount
  const hasDownloads = destinations.some((d) => d === 'downloads')

  if (photosCount > 0 && nonPhotosCount > 0) {
    return {
      title: i18nextInstance.t('receive:summary.filesSaved', { count }),
      hint:
        Platform.OS === 'ios' ? i18nextInstance.t('common:files.photosAndAlterSend') : undefined,
      actionLabel:
        Platform.OS === 'android' ? i18nextInstance.t('receive:actions.viewPhotos') : undefined,
      onPress: openPhotos,
      durationMs: LONG_DURATION_MS
    }
  }

  if (photosCount > 0) {
    return {
      title: i18nextInstance.t('receive:summary.savedToPhotos', { count }),
      hint: Platform.OS === 'ios' ? i18nextInstance.t('receive:summary.tapToView') : undefined,
      actionLabel:
        Platform.OS === 'android' ? i18nextInstance.t('receive:actions.view') : undefined,
      onPress: openPhotos,
      durationMs: LONG_DURATION_MS
    }
  }

  const showDownloadsAction = Platform.OS === 'android' && hasDownloads

  return {
    title: i18nextInstance.t('receive:summary.savedInFiles', { count }),
    hint: Platform.OS === 'ios' ? i18nextInstance.t('common:files.alterSendFolder') : undefined,
    actionLabel: showDownloadsAction ? i18nextInstance.t('receive:actions.open') : undefined,
    onPress: filesToastAction(hasDownloads),
    durationMs: LONG_DURATION_MS
  }
}
