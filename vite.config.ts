import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import process from 'node:process';
import fs from 'node:fs';
import path from 'node:path';

// Write donate link and Formspree form ID so they're available in dev (from .env via loadEnv) and in build (from process.env on Vercel).
// Also write public/donate-config.json here (not in the pre-build script) so Vercel's process.env is available.
function generateEnvPlugin(donateLink: string, formspreeFormId: string) {
  return {
    name: 'generate-donate-env',
    buildStart() {
      const cwd = process.cwd();
      const link = typeof donateLink === 'string' && donateLink.startsWith('https://') ? donateLink : '';
      const formId = typeof formspreeFormId === 'string' && formspreeFormId.trim() !== '' ? formspreeFormId.trim() : '';
      // generated-env.ts for bundle
      const envPath = path.join(cwd, 'services', 'generated-env.ts');
      fs.writeFileSync(envPath, `// Auto-generated at build time. Do not edit.\nexport const VITE_STRIPE_DONATE_LINK: string = ${JSON.stringify(donateLink)};\nexport const VITE_FORMSPREE_CONTACT_FORM_ID: string = ${JSON.stringify(formId)};\n`);
      // public/donate-config.json for runtime fetch (Vercel has process.env when Vite runs, not when the pre-build script runs)
      const publicDir = path.join(cwd, 'public');
      if (!fs.existsSync(publicDir)) fs.mkdirSync(publicDir, { recursive: true });
      const configPath = path.join(publicDir, 'donate-config.json');
      fs.writeFileSync(configPath, JSON.stringify({ donateLink: link }), 'utf8');
    },
  };
}

/** Build-time base URL for og:image etc. (WhatsApp/crawlers need absolute URLs in initial HTML.) */
function getSiteUrl(env: Record<string, string>): string {
  const explicit = env.VITE_SITE_URL || process.env.VITE_SITE_URL || '';
  if (explicit && (explicit.startsWith('https://') || explicit.startsWith('http://'))) {
    return explicit.replace(/\/$/, '');
  }
  const vercelUrl = env.VERCEL_URL || process.env.VERCEL_URL || '';
  if (vercelUrl) {
    return `https://${vercelUrl}`;
  }
  return '';
}

/** Replaces __SITE_URL__ in index.html with absolute base URL so WhatsApp/link previews get a valid og:image. */
function ogImagePlugin(env: Record<string, string>) {
  const siteUrl = getSiteUrl(env);
  return {
    name: 'og-image-url',
    transformIndexHtml: {
      order: 'pre' as const,
      handler(html: string) {
        if (!siteUrl) return html;
        return html.replace(/__SITE_URL__/g, siteUrl);
      },
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
  const formspreeFormId = env.VITE_FORMSPREE_CONTACT_FORM_ID || process.env.VITE_FORMSPREE_CONTACT_FORM_ID || "";

  return {
    plugins: [
      generateEnvPlugin(donateLink, formspreeFormId),
      ogImagePlugin(env),
      react(),
    ],
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