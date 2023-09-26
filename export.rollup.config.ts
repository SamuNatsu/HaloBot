/// Rollup config
import { defineConfig } from 'rollup';
import terser from '@rollup/plugin-terser';
import typescript from '@rollup/plugin-typescript';

/* Export config */
export default defineConfig({
  input: 'src/export.ts',
  output: {
    file: 'dist/HaloBotPlugin.min.mjs',
    format: 'esm'
  },
  plugins: [terser(), typescript()]
});
