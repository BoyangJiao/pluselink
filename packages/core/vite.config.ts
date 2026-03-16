import { defineConfig } from 'vite';
import dts from 'vite-plugin-dts';

export default defineConfig({
  build: {
    lib: {
      entry: './src/index.ts',
      name: 'PulselinkCore',
      fileName: 'index',
      formats: ['es'],
    },
    rollupOptions: {
      external: [],
    },
    sourcemap: true,
  },
  plugins: [
    dts({
      insertTypesEntry: true,
    }),
  ],
});
