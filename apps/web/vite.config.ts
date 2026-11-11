import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Supports configurable base path (e.g. /assistant/ or /)
const basePath = process.env.VITE_BASE_PATH || '/';

export default defineConfig({
  plugins: [react()],
  base: basePath,
  server: {
    port: 3000,
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      },
    },
  },
});
