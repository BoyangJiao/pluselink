import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import dts from 'vite-plugin-dts';
import path from 'path';

export default defineConfig({
  resolve: {
    alias: {
      'pulselink-core': path.resolve(__dirname, '../core/src/index.ts'),
    },
  },
  build: {
    lib: {
      entry: './src/index.ts',
      name: 'Pulselink',
      fileName: 'index',
      formats: ['es'],
    },
    rollupOptions: {
      external: ['react', 'react-dom', 'react/jsx-runtime'],
      output: {
        globals: {
          react: 'React',
          'react-dom': 'ReactDOM',
        },
      },
    },
    sourcemap: true,
  },
  plugins: [
    react(),
    dts({
      insertTypesEntry: true,
    }),
  ],
});
