import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');

const sourcePath = join(root, 'src', 'theme', 'tokens.json');
const tokens = JSON.parse(readFileSync(sourcePath, 'utf8'));
const { colors, space, radius, fontSize, fontWeight, lineHeight, fontFamily, fontFamilyNative } = tokens;

function toCssValue(value) {
  return typeof value === 'number' ? `${value}px` : value;
}

function toJsValue(value) {
  return typeof value === 'number' ? String(value) : JSON.stringify(value);
}

function kebab(key) {
  return key.replace(/[A-Z]/g, (m) => `-${m.toLowerCase()}`);
}

const header = `// AUTO-GENERATED — do not edit directly.\n// Source: src/theme/tokens.json  |  Generator: scripts/generate-tokens.mjs\n// Run \`npm run generate-tokens\` to update.\n`;
const darkColorEntries = Object.entries(colors.dark);
const lightColorEntries = Object.entries(colors.light);
const spaceEntries = Object.entries(space);
const radiusEntries = Object.entries(radius);
const fontSizeEntries = Object.entries(fontSize);
const fontWeightEntries = Object.entries(fontWeight);
const lineHeightEntries = Object.entries(lineHeight);
const fontFamilyEntries = Object.entries(fontFamily);

const scaleEntriesAsCss = [
  ...spaceEntries,
  ...radiusEntries,
  ...fontSizeEntries,
];
const scaleEntriesAsString = [
  ...fontWeightEntries,
  ...lineHeightEntries,
  ...fontFamilyEntries,
];

const tokensCssTs = `${header}
import { css } from 'react-strict-dom';

export const tokens = css.defineVars({
${darkColorEntries.map(([key, value]) => `  ${key}: '${toCssValue(value)}',`).join('\n')}
${scaleEntriesAsCss.map(([key, value]) => `  ${key}: '${toCssValue(value)}',`).join('\n')}
${scaleEntriesAsString.map(([key, value]) => `  ${key}: ${JSON.stringify(value)},`).join('\n')}
});

export type Tokens = typeof tokens;
`;

const tokensCssNativeTs = `${header}
import { Platform } from 'react-native';
import { css } from 'react-strict-dom';

export interface NativeFontFamilyStack {
  fontFamilySans: string;
  fontFamilyDisplay: string;
  fontFamilyMono: string;
}

export const nativeFontFamilies = ${JSON.stringify(fontFamilyNative, null, 2)} as Record<
  'ios' | 'android' | 'default',
  NativeFontFamilyStack
>;

const nativeFontFamily =
  Platform.select<NativeFontFamilyStack>(nativeFontFamilies) ?? nativeFontFamilies.default;

export const tokens = css.defineVars({
${darkColorEntries.map(([key, value]) => `  ${key}: '${toCssValue(value)}',`).join('\n')}
${scaleEntriesAsCss.map(([key, value]) => `  ${key}: '${toCssValue(value)}',`).join('\n')}
${fontWeightEntries.map(([key, value]) => `  ${key}: ${JSON.stringify(value)},`).join('\n')}
${lineHeightEntries.map(([key, value]) => `  ${key}: ${JSON.stringify(value)},`).join('\n')}
  fontFamilySans: nativeFontFamily.fontFamilySans,
  fontFamilyDisplay: nativeFontFamily.fontFamilyDisplay,
  fontFamilyMono: nativeFontFamily.fontFamilyMono,
});

export type Tokens = typeof tokens;
`;

const tokensRawTs = `${header}
export const rawTokens = {
  colors: {
    dark: {
${darkColorEntries.map(([key, value]) => `      ${key}: ${JSON.stringify(value)},`).join('\n')}
    },
    light: {
${lightColorEntries.map(([key, value]) => `      ${key}: ${JSON.stringify(value)},`).join('\n')}
    },
  },
  space: {
${spaceEntries.map(([key, value]) => `    ${key}: ${toJsValue(value)},`).join('\n')}
  },
  radius: {
${radiusEntries.map(([key, value]) => `    ${key}: ${toJsValue(value)},`).join('\n')}
  },
  fontSize: {
${fontSizeEntries.map(([key, value]) => `    ${key}: ${toJsValue(value)},`).join('\n')}
  },
  fontWeight: {
${fontWeightEntries.map(([key, value]) => `    ${key}: ${JSON.stringify(value)},`).join('\n')}
  },
  lineHeight: {
${lineHeightEntries.map(([key, value]) => `    ${key}: ${JSON.stringify(value)},`).join('\n')}
  },
  fontFamily: {
${fontFamilyEntries.map(([key, value]) => `    ${key}: ${JSON.stringify(value)},`).join('\n')}
  },
} as const;

export type RawTokens = typeof rawTokens;
`;

const darkThemeTs = `${header}
import type { Theme } from '../types';

export const darkTheme: Theme = {
  colors: {
${darkColorEntries.map(([key, value]) => `    ${key}: '${value}',`).join('\n')}
  },
};
`;

const lightThemeTs = `${header}
import type { Theme } from '../types';

export const lightTheme: Theme = {
  colors: {
${lightColorEntries.map(([key, value]) => `    ${key}: '${value}',`).join('\n')}
  },
};
`;

const darkThemeCssTs = `${header}
import { css } from 'react-strict-dom';
import { tokens } from '../tokens.css';

export const darkThemeStyle = css.createTheme(tokens, {
${darkColorEntries.map(([key, value]) => `  ${key}: '${toCssValue(value)}',`).join('\n')}
});
`;

const lightThemeCssTs = `${header}
import { css } from 'react-strict-dom';
import { tokens } from '../tokens.css';

export const lightThemeStyle = css.createTheme(tokens, {
${lightColorEntries.map(([key, value]) => `  ${key}: '${toCssValue(value)}',`).join('\n')}
});
`;

const tailwindThemeCss = `/* AUTO-GENERATED — do not edit directly. */
/* Source: src/theme/tokens.json  |  Generator: scripts/generate-tokens.mjs */
/* Run \`npm run generate-tokens\` to update. */

:root,
[data-theme='dark'] {
${darkColorEntries.map(([key, value]) => `  --as-${kebab(key)}: ${value};`).join('\n')}
${spaceEntries.map(([key, value]) => `  --as-${kebab(key)}: ${typeof value === 'number' ? `${value}px` : value};`).join('\n')}
${radiusEntries.map(([key, value]) => `  --as-${kebab(key)}: ${typeof value === 'number' ? `${value}px` : value};`).join('\n')}
${fontSizeEntries.map(([key, value]) => `  --as-${kebab(key)}: ${typeof value === 'number' ? `${value}px` : value};`).join('\n')}
${fontWeightEntries.map(([key, value]) => `  --as-${kebab(key)}: ${value};`).join('\n')}
${lineHeightEntries.map(([key, value]) => `  --as-${kebab(key)}: ${value};`).join('\n')}
${fontFamilyEntries.map(([key, value]) => `  --as-${kebab(key)}: ${value};`).join('\n')}
}

[data-theme='light'] {
${lightColorEntries.map(([key, value]) => `  --as-${kebab(key)}: ${value};`).join('\n')}
}
`;

const files = [
  ['src/theme/tokens.css.ts', tokensCssTs],
  ['src/theme/tokens.css.native.ts', tokensCssNativeTs],
  ['src/theme/tokens.raw.ts', tokensRawTs],
  ['src/theme/themes/dark.ts', darkThemeTs],
  ['src/theme/themes/light.ts', lightThemeTs],
  ['src/theme/themes/dark.css.ts', darkThemeCssTs],
  ['src/theme/themes/light.css.ts', lightThemeCssTs],
  ['src/theme/tailwind-theme.css', tailwindThemeCss],
];

for (const [relativePath, content] of files) {
  writeFileSync(join(root, relativePath), content, 'utf8');
}
