import { Appearance, useColorScheme } from 'react-native'
import { ThemeType } from './types'

export function getSystemTheme(): ThemeType {
  return Appearance.getColorScheme() === 'light' ? ThemeType.Light : ThemeType.Dark
}

export function useSystemTheme(): ThemeType {
  return useColorScheme() === 'light' ? ThemeType.Light : ThemeType.Dark
}
