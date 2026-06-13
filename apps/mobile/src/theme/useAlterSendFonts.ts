import { useFonts } from 'expo-font'

import { BUNDLED_FONT_FAMILIES } from '@altersend/components'
import japaneseRegularFont from '../../../../assets/fonts/NotoSans-JP-Regular.ttf'
import japaneseBoldFont from '../../../../assets/fonts/NotoSans-JP-Bold.ttf'
import koreanRegularFont from '../../../../assets/fonts/NotoSans-KR-Regular.ttf'
import koreanBoldFont from '../../../../assets/fonts/NotoSans-KR-Bold.ttf'
import simplifiedChineseRegularFont from '../../../../assets/fonts/NotoSans-SC-Regular.ttf'
import simplifiedChineseBoldFont from '../../../../assets/fonts/NotoSans-SC-Bold.ttf'
import traditionalChineseRegularFont from '../../../../assets/fonts/NotoSans-TC-Regular.ttf'
import traditionalChineseBoldFont from '../../../../assets/fonts/NotoSans-TC-Bold.ttf'

export function useAlterSendFonts() {
  return useFonts({
    [BUNDLED_FONT_FAMILIES.japanese.cssFamily]: japaneseRegularFont,
    [`${BUNDLED_FONT_FAMILIES.japanese.cssFamily} Bold`]: japaneseBoldFont,
    [BUNDLED_FONT_FAMILIES.korean.cssFamily]: koreanRegularFont,
    [`${BUNDLED_FONT_FAMILIES.korean.cssFamily} Bold`]: koreanBoldFont,
    [BUNDLED_FONT_FAMILIES.simplifiedChinese.cssFamily]: simplifiedChineseRegularFont,
    [`${BUNDLED_FONT_FAMILIES.simplifiedChinese.cssFamily} Bold`]: simplifiedChineseBoldFont,
    [BUNDLED_FONT_FAMILIES.traditionalChinese.cssFamily]: traditionalChineseRegularFont,
    [`${BUNDLED_FONT_FAMILIES.traditionalChinese.cssFamily} Bold`]: traditionalChineseBoldFont
  })
}
