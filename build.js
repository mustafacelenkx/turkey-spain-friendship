/**
 * build.js — Vercel deploy sırasında çalışır
 *
 * Vercel dashboard'da şu environment variables'ları tanımla:
 *   SUPABASE_URL       → https://xxxx.supabase.co
 *   SUPABASE_ANON_KEY  → eyJhbGci...
 *
 * Vercel bu scripti çalıştırır ve config.js dosyasını oluşturur.
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

const content = `// Otomatik oluşturuldu — build.js tarafından. Düzenleme.
window.SUPABASE_CONFIG = {
  url: '${url}',
  key: '${key}'
};\n`;

fs.writeFileSync('config.js', content, 'utf8');
console.log('✅  config.js başarıyla oluşturuldu.');
