import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  define: {
    // Vite explicitly replaces these during the build
    'process.env.API_KEY': JSON.stringify(process.env.API_KEY || ""),
    'process.env': '({})',
  },
  build: {
    outDir: 'dist',
    rollupOptions: {
      input: './index.html',
    },
  },
  server: {
    port: 3000,
    open: true
  }
});