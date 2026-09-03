import { defineConfig } from 'eslint/config';
// Next 16 ships `eslint-config-next` as a flat-config array, not a factory.
import next from 'eslint-config-next';

export default defineConfig([
  { ignores: ['.next/**', 'node_modules/**', 'next-env.d.ts'] },
  ...next,
]);
