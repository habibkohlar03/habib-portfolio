import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Heavy 3D libraries are split into their own chunks. They are only imported
// from the lazily loaded AvatarScene, so they never block first paint.
export default defineConfig({
  plugins: [react()],
  build: {
    target: 'es2020',
    chunkSizeWarningLimit: 900,
    rollupOptions: {
      output: {
        manualChunks: {
          three: ['three'],
          r3f: ['@react-three/fiber', '@react-three/drei'],
        },
      },
    },
  },
});
