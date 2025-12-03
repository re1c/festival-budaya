import { defineConfig } from 'vite';

export default defineConfig({
  base: './', // Ensures relative paths are used in build
  build: {
    assetsDir: 'assets', // Puts assets in dist/assets
    chunkSizeWarningLimit: 100000, // Increase limit to suppress warnings for large models
  }
});