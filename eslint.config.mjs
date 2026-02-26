import { defineConfig, globalIgnores } from 'eslint/config';
import nextCoreWebVitals from 'eslint-config-next/core-web-vitals';

export default defineConfig([
  ...nextCoreWebVitals,
  {
    rules: {
      'react-hooks/set-state-in-effect': 'off',
      'react-hooks/static-components': 'off',
      'react-hooks/immutability': 'off',
      'react-hooks/use-memo': 'off',
      'react-hooks/incompatible-library': 'off',
      'react-hooks/purity': 'off',
      'react-hooks/preserve-manual-memoization': 'off',
      'react-hooks/exhaustive-deps': 'off',
      '@next/next/no-img-element': 'off',
    },
  },
  {
    files: ['__tests__/**/*.{ts,tsx}'],
    rules: {
      'react/display-name': 'off',
    },
  },
  globalIgnores(['.next/**', 'out/**', 'build/**', 'next-env.d.ts']),
]);
