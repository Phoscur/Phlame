/// <reference types='vitest/config' />
import { defineConfig } from 'vite';

export default defineConfig({
  root: __dirname,
  cacheDir: '../node_modules/.vite/engine',

  // Pure library: no decorators, tests use relative imports, so no plugins needed.
  // (Type declarations for `build` are emitted via `npm run tsc` / tsconfig.lib.json,
  // not vite-plugin-dts anymore.)

  // Configuration for building your library.
  // See: https://vitejs.dev/guide/build.html#library-mode
  build: {
    outDir: '../dist/engine',
    reportCompressedSize: true,
    commonjsOptions: {
      transformMixedEsModules: true,
    },
    lib: {
      // Could also be a dictionary or array of multiple entry points.
      entry: 'src/index.ts',
      name: 'engine',
      fileName: 'index',
      // Change this to the formats you want to support.
      // Don't forget to update your package.json as well.
      formats: ['es', 'cjs'],
    },
    rollupOptions: {
      // External packages that should not be bundled into your library.
      external: [],
    },
  },

  test: {
    globals: true,
    environment: 'node',
    include: ['src/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'],

    reporters: ['default'],
    coverage: {
      reportsDirectory: '../coverage/engine',
      provider: 'v8',
    },
  },
});
