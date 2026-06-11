const appJson = require('./app.json')
const releaseConfig = require('../../packages/locales/src/release.json')

const DEFAULT_LOCALE = 'en-US'

function clone(value) {
  return JSON.parse(JSON.stringify(value))
}

function getEnabledLocaleCodes(locales) {
  return releaseConfig.isMultiLangEnabled ? Object.keys(locales) : [DEFAULT_LOCALE]
}

function filterLocales(locales, enabledCodes) {
  return Object.fromEntries(enabledCodes.map((code) => [code, locales[code]]).filter(([, path]) => path))
}

function gateLocalizationPlugin(plugin, enabledCodes) {
  if (!Array.isArray(plugin) || plugin[0] !== 'expo-localization') return plugin

  const options = clone(plugin[1] ?? {})
  options.supportedLocales = {
    ios: enabledCodes,
    android: enabledCodes
  }

  return [plugin[0], options]
}

module.exports = ({ config }) => {
  const expo = clone(appJson.expo)
  const enabledLocaleCodes = getEnabledLocaleCodes(expo.locales ?? {})

  expo.locales = filterLocales(expo.locales ?? {}, enabledLocaleCodes)
  expo.plugins = (expo.plugins ?? []).map((plugin) =>
    gateLocalizationPlugin(plugin, enabledLocaleCodes)
  )

  return {
    ...config,
    ...expo
  }
}
