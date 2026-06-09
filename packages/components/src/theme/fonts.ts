export type FontFamilyKey =
  | 'latin'
  | 'japanese'
  | 'korean'
  | 'simplifiedChinese'
  | 'traditionalChinese'

export interface BundledFontFamily {
  cssFamily: string
  assetFileName: string
  boldAssetFileName?: string
}

export const DEFAULT_FONT_FAMILY_KEY: FontFamilyKey = 'latin'
export const MONO_FONT_FAMILY_CSS =
  'ui-monospace, "SFMono-Regular", "Menlo", "Monaco", "Consolas", "Liberation Mono", "Courier New", monospace'
export const MONO_FONT_FAMILY_NATIVE = {
  ios: 'Menlo',
  android: 'monospace',
  default: 'monospace'
} as const

export const BUNDLED_FONT_FAMILIES: Record<FontFamilyKey, BundledFontFamily> = {
  latin: {
    cssFamily: 'AlterSend Sans',
    assetFileName: 'NotoSans-Latin.ttf'
  },
  japanese: {
    cssFamily: 'AlterSend Sans JP',
    assetFileName: 'NotoSans-JP-Regular.ttf',
    boldAssetFileName: 'NotoSans-JP-Bold.ttf'
  },
  korean: {
    cssFamily: 'AlterSend Sans KR',
    assetFileName: 'NotoSans-KR-Regular.ttf',
    boldAssetFileName: 'NotoSans-KR-Bold.ttf'
  },
  simplifiedChinese: {
    cssFamily: 'AlterSend Sans SC',
    assetFileName: 'NotoSans-SC-Regular.ttf',
    boldAssetFileName: 'NotoSans-SC-Bold.ttf'
  },
  traditionalChinese: {
    cssFamily: 'AlterSend Sans TC',
    assetFileName: 'NotoSans-TC-Regular.ttf',
    boldAssetFileName: 'NotoSans-TC-Bold.ttf'
  }
} as const
