import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

// Dev API target. Defaults to the local backend (localhost:5000) so the
// web client reads from the same database the admin panel writes to.
// To test against production, set VITE_PROXY_TARGET in a .env file.
const PROXY_TARGET = process.env.VITE_PROXY_TARGET || 'http://localhost:5000';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: { '@': path.resolve(__dirname, 'src') },
  },
  server: {
    port: 3001,
    proxy: {
      '/api': {
        target: PROXY_TARGET,
        changeOrigin: true,
      },
      '/socket.io': {
        target: PROXY_TARGET,
        changeOrigin: true,
        ws: true,
      },
    },
  },
});