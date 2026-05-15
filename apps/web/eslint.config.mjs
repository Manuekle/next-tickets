import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const nextConfig = require('eslint-config-next/core-web-vitals');
export default [...nextConfig];
