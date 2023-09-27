/// Rollup config for dts
import { defineConfig } from 'rollup';
import { dts } from 'rollup-plugin-dts';

/* Export config */
export default defineConfig({
  input: 'dist/dts/export.d.ts',
  output: {
    file: 'dist/HaloBotPlugin.d.ts',
    format: 'esm'
  },
  plugins: [dts()]
});
