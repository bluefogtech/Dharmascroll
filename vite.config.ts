import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  define: {
    // Vite explicitly replaces these during the build
    'process.env.API_KEY': JSON.stringify(process.env.API_KEY || ""),
    // Defining process.env as an empty object literal using JSON.stringify to ensure it is a valid JS literal.
    'process.env': JSON.stringify({}),
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