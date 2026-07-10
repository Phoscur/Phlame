/// <reference types='vitest/config' />
import { defineConfig, type Plugin } from 'vite';
import tailwindcss from '@tailwindcss/vite';
import devServer from '@hono/vite-dev-server';
import { transform } from 'esbuild';
import path from 'node:path';

// Vite 8 / Vitest 4 transpile with Oxc, which deliberately does not (yet) transform the
// standard (2023-05) decorators @joist/di relies on — deferred until the spec stabilizes
// (https://github.com/oxc-project/oxc/issues/9170); it leaves `@decorator` in the output.
// esbuild does transform them (at a target below esnext) and ships with the toolchain
// anyway (tsx bundles it), so we pre-transform with esbuild — but ONLY files that
// actually contain decorator syntax. Everything else stays on the fast Oxc default path.
// Delete this plugin (and the explicit esbuild dep) once oxc lands ecma decorators.
const DECORATOR_SYNTAX = /(^|\n)\s*@[A-Za-z_$]/; // line-leading @identifier (not jsdoc/emails)
function esbuildDecorators(): Plugin {
  return {
    name: 'esbuild-standard-decorators',
    enforce: 'pre',
    async transform(code, id) {
      const [file] = id.split('?');
      if (!/\.tsx?$/.test(file) || file.includes('/node_modules/')) return null;
      if (!DECORATOR_SYNTAX.test(code)) return null; // leave it to Oxc
      const result = await transform(code, {
        loader: file.endsWith('.tsx') ? 'tsx' : 'ts',
        target: 'es2022',
        jsx: 'automatic',
        jsxImportSource: 'hono/jsx',
        sourcemap: true,
        sourcefile: id,
      });
      return { code: result.code, map: result.map };
    },
  };
}

export default defineConfig({
  root: 'src/app',
  publicDir: path.resolve('public'),
  cacheDir: './node_modules/.vite/.',

  // Resolve the pure engine library from source (was vite-tsconfig-paths).
  resolve: {
    alias: {
      '@phlame/engine': path.resolve('engine/src/index.ts'),
    },
  },


  server: {
    port: 4200,
    host: 'localhost', // the containerized runner overrides via `--host 0.0.0.0` (compose.test.yml)
    // 'phlame' is the compose service name the playwright runner targets (not 'app' —
    // the .app TLD is HSTS-preloaded, Chromium would force https).
    allowedHosts: ['phlame'],
    watch: {
      ignored: [path.resolve('playwright-report') + '/**', '.vscode/**', '.github/**'],
    },
  },

  preview: {
    // this is still pretty useless, as it's missing a (mockup or hono) server
    port: 4300,
    host: 'localhost',
  },

  plugins: [
    esbuildDecorators(),
    tailwindcss(),
    devServer({
      entry: path.resolve('src/server.ts'),
      exclude: [
        /.*\.tsx?($|\?)/,
        /.*\.(s?css|less)($|\?)/,
        /.*\.(svg|png)($|\?)/,
        /^\/@.+$/,
        /^\/favicon\.ico$/,
        /^\/(public|assets|static)\/.+/,
        /^\/node_modules\/.*/,
        /^\/playwright-report\/.*/,
        /^\/data\/.*/,
        /^\/\.vscode\/.*/,
        /^\/\.github\/.*/,
      ],
      injectClientScript: true,
    }),
  ],

  build: {
    outDir: './dist/phlame',
    target: 'es2022',
    reportCompressedSize: true,
    commonjsOptions: {
      transformMixedEsModules: true,
    },
  },

  test: {
    globals: true,
    environment: 'jsdom',
    // scan src + tools (vite root is src/app, which would miss e.g. src/actions.spec.ts);
    // the engine library keeps its own node-environment suite in engine/
    dir: path.resolve('.'),
    include: [
      'src/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}',
      'tools/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}',
    ],

    reporters: ['default'],
    coverage: {
      reportsDirectory: './coverage/phlame',
      provider: 'v8',
    },
  },
});
