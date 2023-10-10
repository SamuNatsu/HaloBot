/// Rollup config
import { defineConfig } from 'rollup';
import terser from '@rollup/plugin-terser';
import typescript from '@rollup/plugin-typescript';

/* Export config */
export default defineConfig({
  input: 'src/worker.ts',
  output: {
    file: 'dist/worker.min.mjs',
    format: 'esm'
  },
  external: [
    'worker_threads',
    'path',
    'fs',
    'yaml',
    'chalk',
    'moment',
    'util',
    'ws',
    'json-bigint',
    'url',
    'joi',
    'express',
    'knex',
    'commander'
  ],
  plugins: [terser(), typescript()]
});
