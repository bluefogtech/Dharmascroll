import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import process from 'node:process';

export default defineConfig(({ mode }) => {
  // Load env file based on `mode`. The third parameter '' loads all variables.
  const env = loadEnv(mode, process.cwd(), '');

  const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || "";
  const supabaseKey = env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
  const apiKey = env.API_KEY || process.env.API_KEY || "";
  // Vercel injects env at runtime; loadEnv only reads .env files — so use process.env for donate link
  const stripeDonateLink = process.env.VITE_STRIPE_DONATE_LINK || env.VITE_STRIPE_DONATE_LINK || "";

  return {
    plugins: [react()],
    envPrefix: ['VITE_', 'NEXT_PUBLIC_', 'API_'],
    define: {
      'import.meta.env.VITE_STRIPE_DONATE_LINK': JSON.stringify(stripeDonateLink),
      'process.env.API_KEY': JSON.stringify(apiKey),
      'process.env.NEXT_PUBLIC_SUPABASE_URL': JSON.stringify(supabaseUrl),
      'process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY': JSON.stringify(supabaseKey),
      'process.env.NODE_ENV': JSON.stringify(mode),
      'process.env': JSON.stringify({
        API_KEY: apiKey,
        NEXT_PUBLIC_SUPABASE_URL: supabaseUrl,
        NEXT_PUBLIC_SUPABASE_ANON_KEY: supabaseKey,
        NODE_ENV: mode
      })
    },
    build: {
      outDir: 'dist',
      rollupOptions: {
        input: './index.html',
      },
    },
    server: {
      port: 4000,
      open: true
    }
  };
});