import tseslint from 'typescript-eslint';
import unusedImports from 'eslint-plugin-unused-imports';
import reactHooks from 'eslint-plugin-react-hooks';

const NO_RAW_COLORS = {
  'no-restricted-syntax': [
    'error',
    {
      selector: "Literal[value=/^#[0-9a-fA-F]{3,8}$/]",
      message:
        'Color literals are banned. Use a token from @altersend/components/theme (tokens.colorXxx, theme.colors.colorXxx, or Tailwind utility e.g. bg-success).',
    },
    {
      selector: "Literal[value=/^rgba?\\(/]",
      message:
        'rgb()/rgba() literals are banned. Use a token, or compose alpha with withAlpha(token, alpha) at runtime.',
    },
    {
      selector: "TemplateElement[value.raw=/#[0-9a-fA-F]{3,8}/]",
      message:
        'Color literals (hex) inside template strings are banned. Compose with tokens via interpolation.',
    },
    {
      selector: "TemplateElement[value.raw=/rgba?\\(/]",
      message:
        'rgb()/rgba() inside template strings are banned. Use tokens / withAlpha.',
    },
  ],
};

export default tseslint.config(
  {
    ignores: [
      '**/node_modules/**',
      '**/dist/**',
      '**/build/**',
      '**/.next/**',
      '**/.expo/**',
      '**/coverage/**',
      '**/*.bundle.js',
      'apps/mobile/bundles/**',
      'apps/mobile/ios/**',
      'apps/mobile/android/**',
      'apps/desktop/out/**',
      'packages/components/storybook-static/**',
      'packages/components/.storybook/**',
      'packages/components/src/theme/tailwind-theme.css',
    ],
  },

  ...tseslint.configs.recommended,

  {
    files: ['apps/**/*.{ts,tsx}', 'packages/**/*.{ts,tsx}'],
    languageOptions: {
      parser: tseslint.parser,
      parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module',
        ecmaFeatures: { jsx: true },
      },
    },
    plugins: {
      '@typescript-eslint': tseslint.plugin,
      'unused-imports': unusedImports,
      'react-hooks': reactHooks,
    },
    rules: {
      ...NO_RAW_COLORS,
      'unused-imports/no-unused-imports': 'error',
      'unused-imports/no-unused-vars': [
        'warn',
        { vars: 'all', varsIgnorePattern: '^_', args: 'after-used', argsIgnorePattern: '^_' },
      ],
      '@typescript-eslint/no-unused-vars': 'off',
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'warn',
    },
  },

  {
    files: ['**/*.d.ts'],
    rules: {
      'unused-imports/no-unused-vars': 'off',
      '@typescript-eslint/no-explicit-any': 'off',
      'no-var': 'off',
    },
  },

  {
    files: ['**/*.cjs', '**/metro.config.js'],
    rules: { '@typescript-eslint/no-require-imports': 'off' },
  },

  {
    files: [
      'packages/components/src/theme/tokens.raw.ts',
      'packages/components/src/theme/tokens.css.ts',
      'packages/components/src/theme/tokens.css.native.ts',
      'packages/components/src/theme/withAlpha.ts',
      'packages/components/src/theme/fileTypeColors.ts',
      'packages/components/src/theme/themes/*.ts',
      'packages/components/src/theme/themes/*.css.ts',
    ],
    rules: { 'no-restricted-syntax': 'off' },
  },

  {
    files: ['packages/components/src/components/SendFileListRow/styles.ts'],
    rules: { 'no-restricted-syntax': 'off' },
  },
);
