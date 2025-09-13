/// <reference types='vitest' />
import { defineConfig } from 'vite';
import tailwindcss from '@tailwindcss/vite';
import babel from 'vite-plugin-babel';
import devServer from '@hono/vite-dev-server';
import tsconfigPaths from 'vite-tsconfig-paths';
import path from 'node:path';

export default defineConfig({
  root: 'src/app',
  publicDir: path.resolve('public'),
  cacheDir: './node_modules/.vite/.',

  server: {
    port: 4200,
    host: 'localhost',
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
    tsconfigPaths(),
    tailwindcss(),
    devServer({
      entry: 'src/server.ts',
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
    babel({
      babelConfig: {
        presets: [['@babel/preset-typescript', { allowDeclareFields: true }]],
        plugins: [
          [
            '@babel/plugin-proposal-decorators',
            { version: '2023-05', decoratorsBeforeExport: true },
          ],
        ],
      },
      filter: /\.tsx?$/,
    }),
  ],

  build: {
    outDir: './dist/phlame',
    reportCompressedSize: true,
    commonjsOptions: {
      transformMixedEsModules: true,
    },
  },

  test: {
    globals: true,
    environment: 'jsdom',
    include: ['src/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'],

    reporters: ['default'],
    coverage: {
      reportsDirectory: './coverage/phlame',
      provider: 'v8',
    },
  },
});
