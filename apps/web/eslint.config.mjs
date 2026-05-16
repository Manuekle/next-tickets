import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const nextConfig = require('eslint-config-next/core-web-vitals');
export default [
  ...nextConfig,
  {
    rules: {
      'react-hooks/set-state-in-effect': 'off',
      'react-hooks/incompatible-library': 'off',
      '@next/next/no-img-element': 'warn',
    },
  },
];
