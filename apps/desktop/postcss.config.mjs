export default {
  plugins: {
    'react-strict-dom/postcss-plugin': {
      include: [
        'src/renderer/**/*.{js,jsx,mjs,ts,tsx}',
        '../../packages/components/src/**/*.{js,jsx,mjs,ts,tsx}',
      ],
      exclude: ['../../packages/components/src/**/*.native.{js,jsx,mjs,ts,tsx}'],
      babelConfig: (await import('./babel.config.cjs')).default,
      useLayers: true,
    },
  },
};
