import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { viteSingleFile } from 'vite-plugin-singlefile';

const SINGLE_FILE = process.env.VITE_SINGLE_FILE === '1';

export default defineConfig({
  plugins: [react(), ...(SINGLE_FILE ? [viteSingleFile()] : [])],
  base: process.env.VITE_BASE ?? '/',
  server: {
    port: 5173,
    strictPort: false,
  },
  build: {
    target: 'es2022',
    sourcemap: !SINGLE_FILE,
    ...(SINGLE_FILE
      ? {
          assetsInlineLimit: 100_000_000,
          chunkSizeWarningLimit: 100_000,
          cssCodeSplit: false,
          rollupOptions: { output: { inlineDynamicImports: true } },
        }
      : {}),
  },
});
