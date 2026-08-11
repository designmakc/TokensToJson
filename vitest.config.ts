import { resolve } from 'path';
import { defineConfig } from 'vitest/config';

// Mirrors the "paths" block in tsconfig.base.json so specs can import modules
// that use the @app/@common/@utils aliases at runtime, not just as types.
export default defineConfig({
  resolve: {
    alias: {
      '@app': resolve(__dirname, 'src/app'),
      '@common': resolve(__dirname, 'src/common'),
      '@utils': resolve(__dirname, 'src/utils'),
      '@cli': resolve(__dirname, 'src/cli'),
      '@root': resolve(__dirname),
    },
  },
});
