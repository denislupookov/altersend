import { useFonts } from 'expo-font'

import { BUNDLED_FONT_FAMILIES } from '@altersend/components'
import latinFont from '../../../../assets/fonts/NotoSans-Latin.ttf'
import japaneseFont from '../../../../assets/fonts/NotoSans-JP.ttf'
import koreanFont from '../../../../assets/fonts/NotoSans-KR.ttf'
import simplifiedChineseFont from '../../../../assets/fonts/NotoSans-SC.ttf'
import traditionalChineseFont from '../../../../assets/fonts/NotoSans-TC.ttf'

export function useAlterSendFonts() {
  return useFonts({
    [BUNDLED_FONT_FAMILIES.latin.cssFamily]: latinFont,
    [BUNDLED_FONT_FAMILIES.japanese.cssFamily]: japaneseFont,
    [BUNDLED_FONT_FAMILIES.korean.cssFamily]: koreanFont,
    [BUNDLED_FONT_FAMILIES.simplifiedChinese.cssFamily]: simplifiedChineseFont,
    [BUNDLED_FONT_FAMILIES.traditionalChinese.cssFamily]: traditionalChineseFont
  })
}
