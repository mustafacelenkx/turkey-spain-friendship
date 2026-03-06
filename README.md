# 🇹🇷🤝🇪🇸 Türkiye – İspanya İnternet Dostluk Duvarı

> **"Türkler ve İspanyollar internette buluşuyor."**  
> *"Turcos y españoles se encuentran en internet."*

---

## ✨ Özellikler

- 🌐 **Tam iki dilli arayüz** — Türkçe veya İspanyolca seçimine göre
- 🧑‍🤝‍🧑 **Milliyet seçimi** — Türk mü, İspanyol mu?
- 🎯 **10 soruluk kişilik testi** — Ne kadar karşı milletten sayılırsın?
- 🔐 **Kullanıcı hesabı** — Benzersiz kullanıcı adı + şifre ile kayıt
- ⛔ **Günlük 2 mesaj limiti** — Spam önleyici
- 🏛️ **Dostluk Duvarı** — Mesajlar Supabase'de, anlık güncelleniyor
- 🌐 **Otomatik çeviri** — MyMemory API (ücretsiz, key gerektirmez)
- 📱 **Tamamen mobil uyumlu**

---

## 🗄️ Supabase Kurulumu

### Adım 1 — Proje Oluştur

1. [supabase.com](https://supabase.com) → **New Project**
2. Proje adı, şifre, bölge seç → oluştur (~1 dk bekle)

---

### Adım 2 — E-posta Doğrulamasını Kapat

> ⚠️ Bu adımı atlarsan kayıt sistemi çalışmaz!

**Authentication → Settings → Email → "Confirm email" toggle'ını KAPAT**

---

### Adım 3 — Veritabanı Tablolarını Oluştur

Sol menüden **SQL Editor → New query** aç, aşağıdaki SQL'i yapıştır ve **Run** butonuna bas:

```sql
-- ─── Mesajlar tablosu ───────────────────────────────────────
CREATE TABLE messages (
  id         uuid    DEFAULT gen_random_uuid() PRIMARY KEY,
  name       TEXT    NOT NULL,
  msg        TEXT    NOT NULL,
  country    TEXT    NOT NULL CHECK (country IN ('tr', 'es')),
  ts         BIGINT  NOT NULL,
  user_id    uuid    REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─── Profiller tablosu (auth.users ile bağlı) ───────────────
CREATE TABLE profiles (
  id         uuid REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  username   TEXT UNIQUE NOT NULL,
  country    TEXT NOT NULL CHECK (country IN ('tr', 'es')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─── Ziyaretçi / sayaç tablosu ──────────────────────────────
CREATE TABLE visits (
  id         uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  country    TEXT NOT NULL CHECK (country IN ('tr', 'es')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─── Row Level Security (RLS) aç ────────────────────────────
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE visits   ENABLE ROW LEVEL SECURITY;

-- ─── Herkes okuyabilir ──────────────────────────────────────
CREATE POLICY "read_messages" ON messages FOR SELECT USING (true);
CREATE POLICY "read_profiles" ON profiles FOR SELECT USING (true);
CREATE POLICY "read_visits"   ON visits   FOR SELECT USING (true);

-- ─── Sadece giriş yapmış kullanıcılar mesaj ekleyebilir ─────
CREATE POLICY "insert_messages" ON messages
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL AND auth.uid() = user_id);

-- ─── Kullanıcı sadece kendi profilini oluşturabilir ─────────
CREATE POLICY "insert_own_profile" ON profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- ─── Herkes ziyaret kaydı ekleyebilir ───────────────────────
CREATE POLICY "insert_visits" ON visits FOR INSERT WITH CHECK (true);
```

---

### Adım 4 — Realtime Aktif Et

Sol menüden **Database → Replication** →  
**messages** tablosunun yanındaki toggle'ı **aç**

---

### Adım 5 — API Anahtarlarını Al

Sol menüden **Settings → API**:

| Bilgi | Nerede |
|---|---|
| **Project URL** | `https://xxxx.supabase.co` |
| **anon public** | `eyJhbGc…` ile başlayan uzun anahtar |

---

### Adım 6 — `script.js`'e Anahtarları Gir

Dosyanın en üstündeki iki satırı değiştir:

```js
const SUPABASE_URL  = 'https://SENIN_PROJE_ID.supabase.co';
const SUPABASE_ANON = 'SENIN_ANON_KEY';
```

---

## 🚀 Yerel Test

```bash
cd turkey-spain-friendship

# Seçenek A — npx serve
npx serve .
# → http://localhost:3000

# Seçenek B — Python
python3 -m http.server 8080
# → http://localhost:8080
```

> ⚠️ `index.html`'i doğrudan tarayıcıda açma. Mutlaka bir sunucu üzerinden aç.

---

## 📤 GitHub'a Yükle

```bash
git init
git add .
git commit -m "🇹🇷🤝🇪🇸 Turkey Spain Friendship Wall with Auth"
git branch -M main
git remote add origin https://github.com/KULLANICI_ADIN/turkey-spain-friendship.git
git push -u origin main
```

---

## ▲ Vercel'e Deploy

1. [vercel.com](https://vercel.com) → GitHub ile giriş
2. **Add New Project** → repo'nu seç
3. Framework: **Other** (değiştirme)
4. **Deploy** ✅

---

## 🗂️ Proje Yapısı

```
turkey-spain-friendship/
├── index.html    # Tüm bölümler: Landing, Quiz, Sonuç, Auth, Duvar
├── style.css     # Glassmorphism, animasyonlar, responsive, modal, auth
├── script.js     # Quiz, Supabase Auth, günlük limit, çeviri, realtime
└── README.md     # Bu dosya
```

---

## 🛠️ Teknoloji

| Teknoloji | Kullanım |
|---|---|
| HTML5 / CSS3 / Vanilla JS | Frontend |
| Supabase JS v2 | Auth + PostgreSQL DB + Realtime |
| MyMemory Translation API | Ücretsiz çeviri |
| Twitter Web Intent | Tek tık paylaşım |

---

## 🔐 Güvenlik Notları

- Şifreler **Supabase Auth** tarafından bcrypt ile hashlenir, frontend'e asla gelmez
- RLS (Row Level Security) sayesinde kullanıcılar yalnızca kendi mesajlarını ekleyebilir
- Günlük limit `created_at` sütunuyla **sunucu taraflı** kontrol edilir
- Benzersiz kullanıcı adı `UNIQUE` constraint ile veritabanı seviyesinde garanti altında

---

## 📄 Lisans

MIT — Özgürce kullan, fork'la, paylaş. ❤️
