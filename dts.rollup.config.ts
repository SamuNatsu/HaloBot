/// Rollup config for dts
import { defineConfig } from 'rollup';
import { dts } from 'rollup-plugin-dts';

/* Export config */
export default defineConfig({
  input: 'dist/dts/main.d.ts',
  output: {
    file: 'dist/HaloBot.d.ts',
    format: 'esm'
  },
  plugins: [dts()]
});
