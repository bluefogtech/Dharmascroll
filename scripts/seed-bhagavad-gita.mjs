#!/usr/bin/env node
/**
 * Seed Bhagavad Gita verses into Supabase.
 * Fetches full Gita from public JSON (praneshp1org/Bhagavad-Gita-JSON-data, gita/gita),
 * then inserts into bhagavad_gita_verses and optionally into quotes.
 *
 * Usage:
 *   Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY (or .env), then:
 *   node scripts/seed-bhagavad-gita.mjs
 *   node scripts/seed-bhagavad-gita.mjs --into-quotes   # also insert into quotes table
 */

import { createClient } from '@supabase/supabase-js';
import { readFileSync, existsSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');

// Load .env if present
function loadEnv() {
  try {
    const envPath = join(root, '.env');
    if (existsSync(envPath)) {
      const env = readFileSync(envPath, 'utf8');
      env.split('\n').forEach((line) => {
        const m = line.match(/^([^#=]+)=(.*)$/);
        if (m) {
          const val = m[2].trim().replace(/^["']|["']$/g, '');
          process.env[m[1].trim()] = val;
        }
      });
    }
  } catch (_) {}
}
loadEnv();

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const INTO_QUOTES = process.argv.includes('--into-quotes');

const VERSE_JSON =
  'https://raw.githubusercontent.com/praneshp1org/Bhagavad-Gita-JSON-data/main/verse.json';
const TRANSLATION_JSON =
  'https://raw.githubusercontent.com/praneshp1org/Bhagavad-Gita-JSON-data/main/translation.json';
const CHAPTERS_JSON =
  'https://raw.githubusercontent.com/gita/gita/main/data/chapters.json';
// Tamil: add a TAMIL_JSON URL here when you have a verse_id/keyed Tamil translation source; script already fills tamil when lang === 'tamil' in translation.json

async function fetchJson(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to fetch ${url}: ${res.status}`);
  return res.json();
}

function pickTranslation(translations, verseId, lang, preferredAuthor) {
  const byVerse = translations.filter((t) => t.verse_id === verseId && t.lang === lang);
  const byAuthor = preferredAuthor
    ? byVerse.find((t) => t.author_id === preferredAuthor)
    : null;
  return byAuthor || byVerse[0] || null;
}

async function main() {
  if (!SUPABASE_URL || !SUPABASE_KEY) {
    console.error('Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY (or add to .env)');
    process.exit(1);
  }

  console.log('Fetching Bhagavad Gita data...');
  const [verses, translations, chapters] = await Promise.all([
    fetchJson(VERSE_JSON),
    fetchJson(TRANSLATION_JSON),
    fetchJson(CHAPTERS_JSON),
  ]);

  const chapterMap = new Map();
  for (const ch of chapters) {
    chapterMap.set(ch.chapter_number, ch.name_meaning || ch.name_translation || `Chapter ${ch.chapter_number}`);
  }

  // Prefer one English and one Hindi author for consistency
  const ENGLISH_AUTHOR = 16; // Swami Sivananda
  const HINDI_AUTHOR = 1;    // Swami Ramsukhdas

  const rows = [];
  for (const v of verses) {
    const verseId = v.verse_id ?? v.id;
    const chapterNum = v.chapter_number ?? v.chapter_id;
    const verseNum = v.verse_number;
    const en = pickTranslation(translations, verseId, 'english', ENGLISH_AUTHOR);
    const hi = pickTranslation(translations, verseId, 'hindi', HINDI_AUTHOR);
    const ta = pickTranslation(translations, verseId, 'tamil');
    const reference = `Chapter ${chapterNum}, Verse ${verseNum}`;
    const chapterName = chapterMap.get(chapterNum) || '';

    rows.push({
      chapter_number: chapterNum,
      verse_number: verseNum,
      reference,
      sanskrit: (v.text || '').trim().replace(/\n/g, ' '),
      transliteration: (v.transliteration || '').trim().replace(/\n/g, ' ') || null,
      english: (en?.description || '').trim().replace(/\n/g, ' ').slice(0, 5000) || '(No English translation)',
      hindi: (hi?.description || '').trim().replace(/\n/g, ' ').slice(0, 5000) || null,
      tamil: (ta?.description || '').trim().replace(/\n/g, ' ').slice(0, 5000) || null,
      chapter_name: chapterName || null,
    });
  }

  console.log(`Prepared ${rows.length} verses. Inserting into Supabase...`);
  const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

  const BATCH = 100;
  for (let i = 0; i < rows.length; i += BATCH) {
    const batch = rows.slice(i, i + BATCH);
    const { error } = await supabase
      .from('bhagavad_gita_verses')
      .upsert(batch, { onConflict: 'chapter_number,verse_number' });
    if (error) {
      const { error: insertError } = await supabase.from('bhagavad_gita_verses').insert(batch);
      if (insertError) {
        console.error('Insert error:', insertError);
        throw insertError;
      }
    }
    process.stdout.write(`\rInserted ${Math.min(i + BATCH, rows.length)} / ${rows.length}`);
  }
  console.log('\nDone: bhagavad_gita_verses populated.');

  if (INTO_QUOTES) {
    console.log('Inserting into quotes table for webapp display...');
    const quoteRows = rows.map((r) => ({
      book: 'Bhagavad Gita',
      reference: r.reference,
      english: r.english,
      hindi: r.hindi || '',
      tamil: r.tamil || '',
      sanskrit: r.sanskrit,
      context: r.chapter_name || '',
      tags: [],
    }));
    for (let i = 0; i < quoteRows.length; i += BATCH) {
      const batch = quoteRows.slice(i, i + BATCH);
      const { error } = await supabase.from('quotes').insert(batch);
      if (error) {
        console.error('Quotes insert error (table schema may differ):', error.message);
        break;
      }
      process.stdout.write(`\rQuotes: ${Math.min(i + BATCH, quoteRows.length)} / ${quoteRows.length}`);
    }
    console.log('\nDone: quotes table updated.');
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
