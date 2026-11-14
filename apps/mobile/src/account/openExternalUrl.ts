import { Linking } from 'react-native'

export function openExternalUrl(url: string) {
  Linking.openURL(url).catch((err) => console.warn('[account] could not open url', err))
}
