/// Rollup config
import { defineConfig } from 'rollup';
import terser from '@rollup/plugin-terser';
import typescript from '@rollup/plugin-typescript';

/* Export config */
export default defineConfig({
  input: 'src/main.ts',
  output: {
    file: 'dist/HaloBot.min.mjs',
    format: 'esm'
  },
  external: ['worker_threads', 'path', 'chalk', 'moment', 'util', 'url'],
  plugins: [terser(), typescript()]
});
