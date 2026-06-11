import type { Resources } from './i18n-augmentation'
import type { SupportedLocaleCode } from './locale'
import en_US from './locales/en-US'
import ko_KR from './locales/ko-KR'
import zh_CN from './locales/zh-CN'
import zh_TW from './locales/zh-TW'
import fr_FR from './locales/fr-FR'
import de_DE from './locales/de-DE'
import it_IT from './locales/it-IT'
import pt_BR from './locales/pt-BR'
import es_419 from './locales/es-419'
import es_ES from './locales/es-ES'
import en_GB from './locales/en-GB'
import ja_JP from './locales/ja-JP'

export const RESOURCES: Record<SupportedLocaleCode, Resources> = {
  'en-US': en_US,
  'ko-KR': ko_KR,
  'zh-CN': zh_CN,
  'zh-TW': zh_TW,
  'fr-FR': fr_FR,
  'de-DE': de_DE,
  'it-IT': it_IT,
  'pt-BR': pt_BR,
  'es-419': es_419,
  'es-ES': es_ES,
  'en-GB': en_GB,
  'ja-JP': ja_JP
}
