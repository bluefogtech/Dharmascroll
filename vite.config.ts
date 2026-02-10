import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import process from 'node:process';
import fs from 'node:fs';
import path from 'node:path';

// Write donate link so it's available in dev (from .env via loadEnv) and in build (from process.env on Vercel)
function generateEnvPlugin(donateLink: string) {
  return {
    name: 'generate-donate-env',
    buildStart() {
      const outPath = path.join(process.cwd(), 'services', 'generated-env.ts');
      const content = `// Auto-generated at build time. Do not edit.\nexport const VITE_STRIPE_DONATE_LINK: string = ${JSON.stringify(donateLink)};\n`;
      fs.writeFileSync(outPath, content);
    },
  };
}

export default defineConfig(({ mode }) => {
  // Load env file based on `mode`. The third parameter '' loads all variables.
  const env = loadEnv(mode, process.cwd(), '');

  const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || "";
  const supabaseKey = env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
  const apiKey = env.API_KEY || process.env.API_KEY || "";
  const donateLink = env.VITE_STRIPE_DONATE_LINK || process.env.VITE_STRIPE_DONATE_LINK || "";

  return {
    plugins: [generateEnvPlugin(donateLink), react()],
    envPrefix: ['VITE_', 'NEXT_PUBLIC_', 'API_'],
    define: {
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