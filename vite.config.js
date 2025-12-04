import { defineConfig } from 'vite';

export default defineConfig({
  base: './', // Ensures relative paths are used in build
  build: {
    assetsDir: 'assets', // Puts assets in dist/assets
    chunkSizeWarningLimit: 100000, // Increase limit to suppress warnings for large models
    rollupOptions: {
      output: {
        manualChunks(id) {
          // MICRO-OPTIMIZATION: Code Splitting (Vendor Chunking)
          // Memisahkan library pihak ketiga (node_modules) dari kode aplikasi utama.
          if (id.includes('node_modules')) {
            // Pisahkan Three.js Core agar bisa di-cache browser secara agresif
            if (id.includes('three') && !id.includes('three/examples')) {
              return 'vendor-three-core';
            }
            // Pisahkan Addons (Loaders, Controls, PostProcessing)
            if (id.includes('three/examples') || id.includes('three/addons')) {
              return 'vendor-three-addons';
            }
            // Sisa dependencies lainnya
            return 'vendor-utils';
          }
        }
      }
    }
  }
});