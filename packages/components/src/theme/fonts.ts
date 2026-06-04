export type FontFamilyKey =
  | 'latin'
  | 'japanese'
  | 'korean'
  | 'simplifiedChinese'
  | 'traditionalChinese'

export interface BundledFontFamily {
  cssFamily: string
  assetFileName: string
}

export const DEFAULT_FONT_FAMILY_KEY: FontFamilyKey = 'latin'

export const BUNDLED_FONT_FAMILIES: Record<FontFamilyKey, BundledFontFamily> = {
  latin: {
    cssFamily: 'AlterSend Sans',
    assetFileName: 'NotoSans-Latin.ttf'
  },
  japanese: {
    cssFamily: 'AlterSend Sans JP',
    assetFileName: 'NotoSans-JP.ttf'
  },
  korean: {
    cssFamily: 'AlterSend Sans KR',
    assetFileName: 'NotoSans-KR.ttf'
  },
  simplifiedChinese: {
    cssFamily: 'AlterSend Sans SC',
    assetFileName: 'NotoSans-SC.ttf'
  },
  traditionalChinese: {
    cssFamily: 'AlterSend Sans TC',
    assetFileName: 'NotoSans-TC.ttf'
  }
} as const
