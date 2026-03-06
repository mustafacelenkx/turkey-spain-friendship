/**
 * build.js — Vercel deploy sırasında otomatik çalışır.
 *
 * Vercel Dashboard → Settings → Environment Variables'a ekle:
 *   SUPABASE_URL       → https://xxxx.supabase.co
 *   SUPABASE_ANON_KEY  → eyJhbGci...
 *
 * Bu script iki şey yapar:
 *  1. index.html içindeki null placeholder'ı gerçek değerlerle değiştirir.
 *  2. config.js dosyasını oluşturur (belt & suspenders).
 */

const fs  = require('fs');
const url = process.env.SUPABASE_URL;
const key = process.env.SUPABASE_ANON_KEY;

if (!url || !key) {
  console.error('');
  console.error('❌  HATA: Environment variables eksik!');
  console.error('    SUPABASE_URL ve SUPABASE_ANON_KEY tanımlanmamış.');
  console.error('    Vercel → Settings → Environment Variables bölümüne ekle.');
  console.error('');
  process.exit(1);
}

// 1. index.html içine değerleri göm
const htmlPath    = 'index.html';
const htmlContent = fs.readFileSync(htmlPath, 'utf8');

const injected = `window.SUPABASE_CONFIG = { url: '${url}', key: '${key}' };`;

if (!htmlContent.includes('window.SUPABASE_CONFIG = null;')) {
  console.error('❌  index.html içinde placeholder bulunamadı.');
  process.exit(1);
}

const updatedHtml = htmlContent.replace('window.SUPABASE_CONFIG = null;', injected);
fs.writeFileSync(htmlPath, updatedHtml, 'utf8');
console.log('✅  index.html güncellendi (SUPABASE_CONFIG enjekte edildi).');

// 2. config.js oluştur (yerel geliştirme + fallback)
const configContent = `// Otomatik oluşturuldu — build.js tarafından.\nwindow.SUPABASE_CONFIG = { url: '${url}', key: '${key}' };\n`;
fs.writeFileSync('config.js', configContent, 'utf8');
console.log('✅  config.js oluşturuldu.');
