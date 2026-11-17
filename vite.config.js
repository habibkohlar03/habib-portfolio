import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// The avatar libraries are only imported from the lazily loaded TalkingAvatarStage,
// so they never block first paint.
export default defineConfig({
  plugins: [react()],
  build: {
    target: 'es2020',
    chunkSizeWarningLimit: 900,
    rollupOptions: {
      output: {
        // three.js (used by the Talking Avatar SDK) gets its own chunk. The function
        // form only chunks modules that are actually imported.
        manualChunks(id) {
          if (id.includes('node_modules/three/')) return 'three';
          return undefined;
        },
      },
    },
  },
});
