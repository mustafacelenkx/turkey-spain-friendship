/* ===================================================
   Turkey – Spain Friendship Wall  |  script.js
   =================================================== */

// ============================================================
//  ⚙️  SUPABASE YAPILANDIRMASI
//  Değerler config.js dosyasından okunur (gitignore'da).
//  Yerel geliştirme : cp config.example.js config.js → değerleri gir
//  Vercel deploy    : build.js environment variables'tan otomatik üretir
// ============================================================
if (!window.SUPABASE_CONFIG?.url || window.SUPABASE_CONFIG.url.includes('YOUR_PROJECT')) {
  document.body.innerHTML = `
    <div style="display:flex;align-items:center;justify-content:center;min-height:100vh;
                font-family:sans-serif;background:#0d0d1a;color:#ff2d55;text-align:center;padding:2rem;">
      <div>
        <div style="font-size:3rem;margin-bottom:1rem">⚙️</div>
        <h2 style="margin-bottom:.5rem">config.js bulunamadı veya yapılandırılmamış</h2>
        <p style="color:#a0a0b8;margin-top:1rem;line-height:1.6">
          Terminalde şunu çalıştır:<br>
          <code style="background:#1a1a2e;padding:.3rem .7rem;border-radius:6px">
            cp config.example.js config.js
          </code><br><br>
          Sonra <strong>config.js</strong> içine Supabase bilgilerini gir.
        </p>
      </div>
    </div>`;
  throw new Error('config.js eksik veya yapılandırılmamış');
}

const SUPABASE_URL  = window.SUPABASE_CONFIG.url;
const SUPABASE_ANON = window.SUPABASE_CONFIG.key;

const { createClient } = supabase;
const db = createClient(SUPABASE_URL, SUPABASE_ANON);

const DAILY_LIMIT = 2;

// ---- State ----
let userLang    = null;   // 'tr' | 'es'
let currentUser = null;   // { id, username, country }
let quizAnswers = [];
let currentQIdx = 0;
let resultPct   = 0;
let realtimeSub = null;

// ---- DOM helpers ----
const $       = id => document.getElementById(id);
const show    = id => {
  document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));
  $(id).classList.add('active');
  window.scrollTo({ top: 0, behavior: 'smooth' });
};
const showErr = (id, msg) => { const el = $(id); el.textContent = msg; el.classList.remove('hidden'); };
const hideErr = id => $(id).classList.add('hidden');

// ============================================================
//  ÇEVİRİ METİNLERİ
// ============================================================
const T = {
  tr: {
    quiz_title:      '🇪🇸 Ne Kadar İspanyolsun?',
    q_label:         (n, t) => `Soru ${n} / ${t}`,
    result_title:    pct => `Sen %${pct} İspanyolsun! 🇪🇸`,
    result_high:     '🥳 ¡Vamos! İçinde gerçek bir İspanyol ruhu var!',
    result_mid:      '😄 Biraz İspanyol, biraz Türksün — mükemmel bir karışım!',
    result_low:      '🇹🇷 Saf Türksün kardeşim! İspanya sana çok uzak.',
    result_flag:     '🇪🇸',
    bar_color:       'linear-gradient(90deg, #AA151B, #F1BF00)',
    share_btn:       "X'te Paylaş 🚀",
    share_text:      pct => `"Ne Kadar İspanyolsun?" testinde %${pct} İspanyol çıktım! 🇪🇸 Sen de dene 👇 https://turkishamigo.vercel.app/`,
    enter_auth:      'Kayıt Ol ve Duvara Yaz 🏛️',
    auth_hint:       '✨ Sonucunu kaydet, Dostluk Duvarı\'na mesaj at!',
    tab_register:    'Kayıt Ol',
    tab_login:       'Giriş Yap',
    ph_username:     'Kullanıcı adı (3–20 karakter)...',
    ph_password:     'Şifre (en az 6 karakter)...',
    ph_confirm:      'Şifreyi tekrar gir...',
    btn_register:    'Hesap Oluştur 🚀',
    btn_login:       'Giriş Yap →',
    btn_logout:      'Çıkış',
    err_uname_short: '❌ Kullanıcı adı en az 3 karakter olmalı',
    err_uname_chars: '❌ Sadece harf, rakam ve _ kullanabilirsin',
    err_uname_taken: '❌ Bu kullanıcı adı zaten alınmış!',
    err_pass_short:  '❌ Şifre en az 6 karakter olmalı',
    err_pass_match:  '❌ Şifreler eşleşmiyor',
    err_wrong_creds: '❌ Kullanıcı adı veya şifre hatalı',
    err_generic:     '❌ Bir hata oluştu, tekrar dene',
    registering:     '⏳ Kayıt olunuyor…',
    logging_in:      '⏳ Giriş yapılıyor…',
    wall_title:      '🏛️ Dostluk Duvarı',
    posting_as:      name => `🇹🇷 ${name} olarak mesaj gönderiyorsun`,
    msg_ph:          'Karşı tarafa mesajın ❤️ (Ctrl+Enter ile gönder)',
    post_btn:        'Gönder 📮',
    btn_logout:      'Çıkış',
    daily_left:      n => `Bugün ${n} mesaj hakkın kaldı`,
    daily_done:      '⛔ Bugünlük limit doldu (2/2)',
    no_msg:          'Lütfen bir mesaj yaz ✍️',
    spam:            '⛔ Günlük 2 mesaj limitine ulaştın! Yarın görüşürüz 😊',
    posted:          'Mesaj gönderildi! ❤️',
    no_msgs:         'Henüz mesaj yok. İlk sen ol! ❤️',
    loading:         '⏳ Mesajlar yükleniyor…',
    db_error:        '❌ Bağlantı hatası. Supabase ayarlarını kontrol et.',
    welcome_back:    name => `Hoş geldin, ${name}! 👋`,
    translate_btn:   '🌐 Çevir',
    hide_btn:        '🔼 Gizle',
    translating:     '⏳ Çevriliyor…',
    trans_fail:      '⚠️ Çeviri başarısız',
    trans_label:     '🇪🇸 İspanyolca çeviri',
  },
  es: {
    quiz_title:      '🇹🇷 ¿Qué tan turco/a eres?',
    q_label:         (n, t) => `Pregunta ${n} / ${t}`,
    result_title:    pct => `¡Eres ${pct}% turco/a! 🇹🇷`,
    result_high:     '🥳 ¡Maşallah! ¡Tienes alma turca de verdad!',
    result_mid:      '😄 ¡Un poco turco y un poco español — la mezcla perfecta!',
    result_low:      '🇪🇸 ¡Eres español/a de pura cepa! Turquía te queda muy lejos.',
    result_flag:     '🇹🇷',
    bar_color:       'linear-gradient(90deg, #E30A17, #ff6b81)',
    share_btn:       'Compartir en X 🚀',
    share_text:      pct => `¡Soy ${pct}% turco/a en el test de amistad! 🇹🇷 ¡Pruébalo 👇 https://turkishamigo.vercel.app/`,
    enter_auth:      'Regístrate y escribe en el Muro 🏛️',
    auth_hint:       '✨ ¡Guarda tu resultado y escribe en el Muro de Amistad!',
    tab_register:    'Registrarse',
    tab_login:       'Iniciar sesión',
    ph_username:     'Nombre de usuario (3–20 caract.)...',
    ph_password:     'Contraseña (mín. 6 caracteres)...',
    ph_confirm:      'Repite la contraseña...',
    btn_register:    'Crear cuenta 🚀',
    btn_login:       'Iniciar sesión →',
    btn_logout:      'Salir',
    err_uname_short: '❌ El nombre debe tener mínimo 3 caracteres',
    err_uname_chars: '❌ Solo letras, números y _ están permitidos',
    err_uname_taken: '❌ ¡Este nombre de usuario ya está en uso!',
    err_pass_short:  '❌ La contraseña debe tener mínimo 6 caracteres',
    err_pass_match:  '❌ Las contraseñas no coinciden',
    err_wrong_creds: '❌ Nombre de usuario o contraseña incorrectos',
    err_generic:     '❌ Ha ocurrido un error, inténtalo de nuevo',
    registering:     '⏳ Creando cuenta…',
    logging_in:      '⏳ Iniciando sesión…',
    wall_title:      '🏛️ Muro de Amistad',
    posting_as:      name => `🇪🇸 Publicando como ${name}`,
    msg_ph:          'Tu mensaje para el otro lado ❤️ (Ctrl+Enter para enviar)',
    post_btn:        'Enviar 📮',
    btn_logout:      'Salir',
    daily_left:      n => `Te quedan ${n} mensaje${n !== 1 ? 's' : ''} hoy`,
    daily_done:      '⛔ Límite diario alcanzado (2/2)',
    no_msg:          'Por favor escribe un mensaje ✍️',
    spam:            '⛔ ¡Límite de 2 mensajes diarios alcanzado! Vuelve mañana 😊',
    posted:          '¡Mensaje publicado! ❤️',
    no_msgs:         'Aún no hay mensajes. ¡Sé el primero! ❤️',
    loading:         '⏳ Cargando mensajes…',
    db_error:        '❌ Error de conexión. Comprueba la configuración de Supabase.',
    welcome_back:    name => `¡Bienvenido/a de nuevo, ${name}! 👋`,
    translate_btn:   '🌐 Traducir',
    hide_btn:        '🔼 Ocultar',
    translating:     '⏳ Traduciendo…',
    trans_fail:      '⚠️ Error al traducir',
    trans_label:     '🇹🇷 Traducción al turco',
  }
};

// ============================================================
//  QUIZ SORULARI
// ============================================================
const QUESTIONS = {
  tr: [
    { text: '🍳 Kahvaltıda ne tercih edersin?',
      opts: [{ label: '🥐 Churros & Café', val: 'es' }, { label: '🧀 Peynir & Zeytin', val: 'tr' }] },
    { text: '⚽ Favori futbol ligin hangisi?',
      opts: [{ label: '🔴 La Liga (İspanya)', val: 'es' }, { label: '🟡 Süper Lig (Türkiye)', val: 'tr' }] },
    { text: '🏖️ Tatilde nereye gidersin?',
      opts: [{ label: '🌊 İbiza, İspanya', val: 'es' }, { label: '🏔️ Kapadokya, Türkiye', val: 'tr' }] },
    { text: '☕ İçecek tercihin nedir?',
      opts: [{ label: '☕ Café con leche', val: 'es' }, { label: '🍵 Çay', val: 'tr' }] },
    { text: '🎵 Müzik zevkin nasıl?',
      opts: [{ label: '💃 Flamenco', val: 'es' }, { label: '🎤 Türkü / Arabesk', val: 'tr' }] },
    { text: '🌆 Favori şehrin hangisi?',
      opts: [{ label: '🏟️ Madrid', val: 'es' }, { label: '🕌 İstanbul', val: 'tr' }] },
    { text: '🍽️ Akşam yemeği saatin ne zaman?',
      opts: [{ label: '🌙 22:00 — Geç yemek çok şık!', val: 'es' }, { label: '🌅 19:00 — Erken yemek en güzeli', val: 'tr' }] },
    { text: '😴 Öğle uykusu (siesta) hakkında ne düşünürsün?',
      opts: [{ label: '😍 Muhteşem bir gelenek!', val: 'es' }, { label: '😅 Kim uyuyor o saatte!', val: 'tr' }] },
    { text: '🍕 Yemek tercihinde ne yer?',
      opts: [{ label: '🥘 Paella', val: 'es' }, { label: '🥙 Kebap', val: 'tr' }] },
    { text: '💃 Dans eder misin?',
      opts: [{ label: '🕺 Her zaman, ¡vamos!', val: 'es' }, { label: '😄 Biraz zeybek oynarım', val: 'tr' }] },
  ],
  es: [
    { text: '🍳 ¿Qué prefieres para desayunar?',
      opts: [{ label: '🧀 Queso y aceitunas (turco)', val: 'tr' }, { label: '🥐 Churros y café', val: 'es' }] },
    { text: '⚽ ¿Tu liga de fútbol favorita?',
      opts: [{ label: '🟡 Süper Lig (Turquía)', val: 'tr' }, { label: '🔴 La Liga (España)', val: 'es' }] },
    { text: '🏖️ ¿A dónde irías de vacaciones?',
      opts: [{ label: '🏔️ Capadocia, Turquía', val: 'tr' }, { label: '🌊 Ibiza, España', val: 'es' }] },
    { text: '☕ ¿Tu bebida favorita?',
      opts: [{ label: '🍵 Té turco (çay)', val: 'tr' }, { label: '☕ Café con leche', val: 'es' }] },
    { text: '🎵 ¿Tu música preferida?',
      opts: [{ label: '🎤 Música turca (türkü)', val: 'tr' }, { label: '💃 Flamenco', val: 'es' }] },
    { text: '🌆 ¿Tu ciudad favorita?',
      opts: [{ label: '🕌 Estambul', val: 'tr' }, { label: '🏟️ Madrid', val: 'es' }] },
    { text: '🍽️ ¿A qué hora cenas?',
      opts: [{ label: '🌅 19:00 — temprano y saludable', val: 'tr' }, { label: '🌙 22:00 — ¡a la española!', val: 'es' }] },
    { text: '😴 ¿Qué opinas de la siesta?',
      opts: [{ label: '😅 ¡¿Quién duerme a esa hora?!', val: 'tr' }, { label: '😍 ¡Una tradición genial!', val: 'es' }] },
    { text: '🍕 ¿Qué prefieres comer?',
      opts: [{ label: '🥙 Kebap turco', val: 'tr' }, { label: '🥘 Paella española', val: 'es' }] },
    { text: '💃 ¿Bailas?',
      opts: [{ label: '😄 Un poco de zeybek turco', val: 'tr' }, { label: '🕺 ¡Siempre, vamos!', val: 'es' }] },
  ]
};

// ============================================================
//  FLOATING FLAGS
// ============================================================
function spawnFloatingFlags() {
  const container = $('floatingFlags');
  const flags = ['🇹🇷', '🇪🇸', '❤️', '🤝'];
  for (let i = 0; i < 18; i++) {
    const el = document.createElement('span');
    el.className = 'float-flag';
    el.textContent = flags[Math.floor(Math.random() * flags.length)];
    el.style.left = Math.random() * 100 + 'vw';
    el.style.fontSize = (1.5 + Math.random() * 2) + 'rem';
    const dur = 12 + Math.random() * 18;
    el.style.animationDuration = dur + 's';
    el.style.animationDelay    = -(Math.random() * dur) + 's';
    container.appendChild(el);
  }
}

// ============================================================
//  QUIZ
// ============================================================
function startQuiz(lang) {
  userLang    = lang;
  quizAnswers = [];
  currentQIdx = 0;
  $('quizTitle').textContent = T[lang].quiz_title;
  renderQuestion(0);
  show('quiz');
}

function renderQuestion(idx) {
  const questions = QUESTIONS[userLang];
  const total     = questions.length;
  const q         = questions[idx];
  const t         = T[userLang];

  $('progressFill').style.width  = Math.round((idx / total) * 100) + '%';
  $('questionLabel').textContent = t.q_label(idx + 1, total);

  const block = $('questionBlock');
  block.innerHTML = `
    <p class="question-text">${q.text}</p>
    <div class="options-grid">
      ${q.opts.map(opt => `
        <button class="option-btn" data-val="${opt.val}" onclick="pickAnswer(this)">
          <span class="opt-flag">${opt.val === 'tr' ? '🇹🇷' : '🇪🇸'}</span>
          <span class="opt-label">${opt.label}</span>
        </button>
      `).join('')}
    </div>
  `;
  block.style.animation = 'none';
  block.offsetHeight;
  block.style.animation = 'fadeInUp 0.4s ease both';
}

function pickAnswer(btn) {
  btn.closest('.options-grid').querySelectorAll('.option-btn').forEach(b => b.classList.remove('selected'));
  btn.classList.add('selected');
  quizAnswers.push(btn.dataset.val);

  setTimeout(() => {
    currentQIdx++;
    if (currentQIdx < QUESTIONS[userLang].length) {
      renderQuestion(currentQIdx);
    } else {
      $('progressFill').style.width = '100%';
      setTimeout(computeResult, 350);
    }
  }, 400);
}

// ============================================================
//  SONUÇ
// ============================================================
async function computeResult() {
  const t         = T[userLang];
  const target    = userLang === 'tr' ? 'es' : 'tr';
  const score     = quizAnswers.filter(a => a === target).length;
  resultPct       = Math.round((score / QUESTIONS[userLang].length) * 100);

  // Ziyareti kaydet (sayaç)
  await recordVisit(userLang);
  await renderStats();

  $('resultFlag').textContent   = t.result_flag;
  $('resultTitle').textContent  = t.result_title(resultPct);
  $('resultSub').textContent    = resultPct >= 70 ? t.result_high
                                : resultPct >= 40 ? t.result_mid
                                :                   t.result_low;
  $('shareBtn').textContent     = t.share_btn;
  $('enterAuthBtn').textContent = t.enter_auth;

  show('result');
  setTimeout(() => {
    $('resultBar').style.width      = resultPct + '%';
    $('resultBar').style.background = t.bar_color;
  }, 300);

  $('shareBtn').onclick = () => {
    window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(t.share_text(resultPct))}`, '_blank');
  };
  $('enterAuthBtn').onclick = () => showAuthSection('register');
}

// ============================================================
//  AUTH SECTION — UI
// ============================================================
function showAuthSection(mode = 'register') {
  const t = T[userLang];

  $('tabRegister').textContent = t.tab_register;
  $('tabLogin').textContent    = t.tab_login;

  $('authHint').innerHTML = `<span class="auth-hint-icon">${t.result_flag}</span> ${t.auth_hint}`;

  $('regUsername').placeholder = t.ph_username;
  $('regPassword').placeholder = t.ph_password;
  $('regConfirm').placeholder  = t.ph_confirm;
  $('registerBtn').textContent = t.btn_register;

  $('logUsername').placeholder = t.ph_username;
  $('logPassword').placeholder = t.ph_password;
  $('loginBtn').textContent    = t.btn_login;

  switchAuthTab(mode);
  show('auth');
}

function switchAuthTab(tab) {
  const isReg = tab === 'register';
  $('paneRegister').classList.toggle('hidden', !isReg);
  $('paneLogin').classList.toggle('hidden',    isReg);
  $('tabRegister').classList.toggle('active',  isReg);
  $('tabLogin').classList.toggle('active',    !isReg);
  hideErr('regError');
  hideErr('logError');
}

// ============================================================
//  AUTH — KAYIT OL
// ============================================================
async function handleRegister() {
  const t        = T[userLang];
  const btn      = $('registerBtn');
  const username = $('regUsername').value.trim();
  const password = $('regPassword').value;
  const confirm  = $('regConfirm').value;

  hideErr('regError');

  if (username.length < 3)               { showErr('regError', t.err_uname_short); return; }
  if (!/^[a-zA-Z0-9_]+$/.test(username)) { showErr('regError', t.err_uname_chars); return; }
  if (password.length < 6)               { showErr('regError', t.err_pass_short);  return; }
  if (password !== confirm)              { showErr('regError', t.err_pass_match);  return; }

  btn.disabled    = true;
  btn.textContent = t.registering;

  try {
    // Kullanıcı adı müsait mi?
    const { data: existing } = await db
      .from('profiles')
      .select('id')
      .eq('username', username)
      .maybeSingle();

    if (existing) { showErr('regError', t.err_uname_taken); return; }

    // Supabase Auth'ta kullanıcı oluştur
    const email = `${username.toLowerCase()}@ts-wall.app`;
    const { data: authData, error: authErr } = await db.auth.signUp({ email, password });

    if (authErr) throw authErr;
    if (!authData.user) throw new Error('no_user');

    // Profil oluştur
    const { error: profileErr } = await db.from('profiles').insert({
      id:      authData.user.id,
      username,
      country: userLang,
    });
    if (profileErr) throw profileErr;

    currentUser = { id: authData.user.id, username, country: userLang };
    toast(t.welcome_back(username));
    await prepareWall();
    show('wall');

  } catch (err) {
    console.error('register:', err);
    if (!$('regError').textContent) showErr('regError', t.err_generic);
  } finally {
    btn.disabled    = false;
    btn.textContent = t.btn_register;
  }
}

// ============================================================
//  AUTH — GİRİŞ YAP (auth section)
// ============================================================
async function handleLogin() {
  const t        = T[userLang];
  const btn      = $('loginBtn');
  const username = $('logUsername').value.trim();
  const password = $('logPassword').value;

  hideErr('logError');
  if (!username) { showErr('logError', t.err_uname_short); return; }
  if (!password) { showErr('logError', t.err_pass_short);  return; }

  btn.disabled    = true;
  btn.textContent = t.logging_in;

  try {
    await performLogin(username, password, 'logError');
  } finally {
    btn.disabled    = false;
    btn.textContent = t.btn_login;
  }
}

// ============================================================
//  AUTH — LOGIN MODAL (landing'den)
// ============================================================
function showLoginModal() {
  $('loginModal').classList.remove('hidden');
  setTimeout(() => $('modalUsername').focus(), 50);
}

function hideLoginModal() {
  $('loginModal').classList.add('hidden');
  $('modalUsername').value = '';
  $('modalPassword').value = '';
  hideErr('modalError');
}

async function handleModalLogin() {
  const btn      = $('modalLoginBtn');
  const username = $('modalUsername').value.trim();
  const password = $('modalPassword').value;

  hideErr('modalError');

  if (!username || !password) {
    showErr('modalError', 'Kullanıcı adı ve şifre gerekli / Se requieren usuario y contraseña ❌');
    return;
  }

  btn.disabled    = true;
  btn.textContent = '⏳';

  try {
    // Önce profili bul → dili belirle
    const { data: profile } = await db
      .from('profiles')
      .select('country, username')
      .eq('username', username)
      .maybeSingle();

    if (!profile) {
      showErr('modalError', 'Kullanıcı bulunamadı / Usuario no encontrado ❌');
      return;
    }

    userLang = profile.country;
    await performLogin(username, password, 'modalError');
    hideLoginModal();

  } finally {
    btn.disabled    = false;
    btn.textContent = 'Giriş Yap / Iniciar sesión →';
  }
}

// ============================================================
//  ORTAK GİRİŞ MANTIĞI
// ============================================================
async function performLogin(username, password, errorId) {
  const email = `${username.toLowerCase()}@ts-wall.app`;

  const { error: signInErr } = await db.auth.signInWithPassword({ email, password });

  if (signInErr) {
    const msg = userLang
      ? T[userLang].err_wrong_creds
      : 'Kullanıcı adı veya şifre hatalı / Usuario o contraseña incorrectos ❌';
    showErr(errorId, msg);
    throw signInErr;
  }

  const { data: { user } }  = await db.auth.getUser();
  const { data: profile }   = await db.from('profiles').select('*').eq('id', user.id).single();

  userLang    = profile.country;
  currentUser = { id: user.id, username: profile.username, country: profile.country };

  toast(T[userLang].welcome_back(profile.username));
  await prepareWall();
  show('wall');
}

// ============================================================
//  ÇIKIŞ
// ============================================================
async function logout() {
  await db.auth.signOut();
  currentUser = null;
  userLang    = null;
  quizAnswers = [];
  if (realtimeSub) { realtimeSub.unsubscribe(); realtimeSub = null; }
  await renderStats();
  show('landing');
}

// ============================================================
//  DOSTLUK DUVARI
// ============================================================
async function prepareWall() {
  const t   = T[userLang];
  const isT = userLang === 'tr';

  $('wallTitle').textContent       = t.wall_title;
  $('formFlag').textContent        = isT ? '🇹🇷' : '🇪🇸';
  $('formNationality').textContent = t.posting_as(currentUser.username);
  $('msgInput').placeholder        = t.msg_ph;
  $('postBtn').textContent         = t.post_btn;
  $('logoutBtn').textContent       = t.btn_logout;
  $('userBadgeName').textContent   = `👤 ${currentUser.username}`;

  await Promise.all([updateDailyRemaining(), renderMessages(), renderStats()]);
  subscribeToMessages();
}

async function updateDailyRemaining() {
  if (!currentUser) return;
  const t    = T[userLang];
  const used = await getDailyCount(currentUser.id);
  const left = Math.max(0, DAILY_LIMIT - used);
  const el   = $('dailyRemaining');

  if (left === 0) {
    el.textContent = t.daily_done;
    el.className   = 'daily-remaining limit-reached';
    $('postBtn').disabled = true;
  } else {
    el.textContent = t.daily_left(left);
    el.className   = 'daily-remaining';
    $('postBtn').disabled = false;
  }
}

async function postMessage() {
  const msg = $('msgInput').value.trim();
  const t   = T[userLang];
  const btn = $('postBtn');

  if (!msg) { toast(t.no_msg); return; }

  const used = await getDailyCount(currentUser.id);
  if (used >= DAILY_LIMIT) {
    toast(t.spam);
    await updateDailyRemaining();
    return;
  }

  btn.disabled    = true;
  btn.textContent = '⏳';

  try {
    const { error } = await db.from('messages').insert({
      name:    currentUser.username,
      msg,
      country: currentUser.country,
      ts:      Date.now(),
      user_id: currentUser.id,
    });
    if (error) throw error;

    $('msgInput').value = '';
    await renderMessages();
    await updateDailyRemaining();
    toast(t.posted);

  } catch (err) {
    console.error('postMessage:', err);
    toast(t.db_error);
    btn.disabled    = false;
    btn.textContent = t.post_btn;
  }
}

// ============================================================
//  SUPABASE — VERİ
// ============================================================
async function fetchMessages() {
  const { data, error } = await db
    .from('messages')
    .select('*')
    .order('ts', { ascending: false })
    .limit(100);
  if (error) { console.error(error); return null; }
  return data;
}

async function fetchStats() {
  const { data, error } = await db.from('visits').select('country');
  if (error) return { tr: 0, es: 0 };
  return {
    tr: data.filter(r => r.country === 'tr').length,
    es: data.filter(r => r.country === 'es').length,
  };
}

async function recordVisit(country) {
  await db.from('visits').insert({ country });
}

async function getDailyCount(userId) {
  const start = new Date();
  start.setHours(0, 0, 0, 0);

  const { count } = await db
    .from('messages')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .gte('created_at', start.toISOString());

  return count || 0;
}

async function renderStats() {
  const s = await fetchStats();
  ['trCount', 'trCount2'].forEach(id => { if ($(id)) $(id).textContent = s.tr; });
  ['esCount', 'esCount2'].forEach(id => { if ($(id)) $(id).textContent = s.es; });
}

async function renderMessages() {
  const t    = T[userLang];
  const grid = $('messagesGrid');

  grid.innerHTML = `<p class="no-msgs">${t.loading}</p>`;

  const msgs = await fetchMessages();

  if (!msgs) { grid.innerHTML = `<p class="no-msgs db-error">${t.db_error}</p>`; return; }
  if (!msgs.length) { grid.innerHTML = `<p class="no-msgs">${t.no_msgs}</p>`; return; }

  grid.innerHTML = '';
  msgs.forEach((m, idx) => {
    const isForeign = m.country !== userLang;
    const cardId    = `card-${idx}`;
    const isMe      = currentUser && m.user_id === currentUser.id;

    const card = document.createElement('div');
    card.className = `msg-card${isMe ? ' msg-card-mine' : ''}`;
    card.innerHTML = `
      <div class="card-header">
        <span class="card-flag">${m.country === 'tr' ? '🇹🇷' : '🇪🇸'}</span>
        <span class="card-name">${escapeHtml(m.name)}${isMe ? ' <span class="me-badge">ben/yo</span>' : ''}</span>
        <span class="card-time">${formatTime(m.ts)}</span>
      </div>
      <p class="card-msg">${escapeHtml(m.msg)}</p>
      ${isForeign ? `
        <div class="translate-row" id="tr-row-${cardId}">
          <button class="btn-translate" onclick="translateCard('${cardId}','${escapeHtml(m.msg).replace(/'/g,"\\'")}','${m.country}')">
            ${t.translate_btn}
          </button>
        </div>
        <div class="translation-box hidden" id="tbox-${cardId}"></div>
      ` : ''}
    `;
    grid.appendChild(card);
  });
}

function subscribeToMessages() {
  if (realtimeSub) realtimeSub.unsubscribe();
  realtimeSub = db
    .channel('public:messages')
    .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' },
      async () => {
        if ($('wall').classList.contains('active')) {
          await renderMessages();
          await renderStats();
        }
      }
    )
    .subscribe();
}

// ============================================================
//  ÇEVİRİ (MyMemory API)
// ============================================================
const translationCache = {};

async function translateCard(cardId, originalText, fromCountry) {
  const t    = T[userLang];
  const btn  = document.querySelector(`#tr-row-${cardId} .btn-translate`);
  const tbox = $(`tbox-${cardId}`);

  if (tbox.dataset.done === '1') {
    tbox.classList.toggle('hidden');
    btn.textContent = tbox.classList.contains('hidden') ? t.translate_btn : t.hide_btn;
    return;
  }

  const cacheKey = `${fromCountry}|${userLang}|${originalText}`;
  if (translationCache[cacheKey]) { showTranslation(tbox, btn, translationCache[cacheKey]); return; }

  btn.textContent = t.translating;
  btn.disabled    = true;

  try {
    const url  = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(originalText)}&langpair=${fromCountry}|${userLang}`;
    const res  = await fetch(url);
    const data = await res.json();
    if (data.responseStatus !== 200) throw new Error('API error');
    translationCache[cacheKey] = data.responseData.translatedText;
    showTranslation(tbox, btn, translationCache[cacheKey]);
  } catch {
    btn.textContent = T[userLang].trans_fail;
    btn.disabled    = false;
    setTimeout(() => { btn.textContent = T[userLang].translate_btn; }, 2500);
  }
}

function showTranslation(tbox, btn, text) {
  const t = T[userLang];
  tbox.innerHTML = `
    <span class="tbox-label">${t.trans_label}</span>
    <span class="tbox-text">${escapeHtml(text)}</span>
  `;
  tbox.dataset.done          = '1';
  tbox.style.borderLeftColor = userLang === 'tr' ? 'var(--neon-tr)' : 'var(--neon-es)';
  tbox.classList.remove('hidden');
  btn.textContent = t.hide_btn;
  btn.disabled    = false;
}

// ============================================================
//  YARDIMCI FONKSİYONLAR
// ============================================================
function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;')
    .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function formatTime(ts) {
  return new Date(ts).toLocaleDateString('tr-TR', { day: '2-digit', month: 'short' });
}

function toast(msg) {
  let el = document.querySelector('.toast');
  if (!el) { el = document.createElement('div'); el.className = 'toast'; document.body.appendChild(el); }
  el.textContent = msg;
  el.classList.add('show');
  clearTimeout(el._timer);
  el._timer = setTimeout(() => el.classList.remove('show'), 3200);
}

// ============================================================
//  INIT
// ============================================================
document.addEventListener('DOMContentLoaded', async () => {
  spawnFloatingFlags();
  await renderStats();

  // Mevcut oturum kontrolü (otomatik giriş)
  const { data: { session } } = await db.auth.getSession();
  if (session?.user) {
    const { data: profile } = await db
      .from('profiles').select('*').eq('id', session.user.id).single();
    if (profile) {
      userLang    = profile.country;
      currentUser = { id: session.user.id, username: profile.username, country: profile.country };
      toast(T[userLang].welcome_back(profile.username));
      await prepareWall();
      show('wall');
    }
  }

  // Landing butonları
  $('selectTr').addEventListener('click', () => startQuiz('tr'));
  $('selectEs').addEventListener('click', () => startQuiz('es'));

  // Login modal
  $('showLoginModal').addEventListener('click', showLoginModal);
  $('modalClose').addEventListener('click', hideLoginModal);
  $('loginModal').addEventListener('click', e => { if (e.target === $('loginModal')) hideLoginModal(); });
  $('modalLoginBtn').addEventListener('click', handleModalLogin);
  $('modalPassword').addEventListener('keydown', e => { if (e.key === 'Enter') handleModalLogin(); });

  // Auth section
  $('registerBtn').addEventListener('click', handleRegister);
  $('loginBtn').addEventListener('click', handleLogin);
  $('regConfirm').addEventListener('keydown', e => { if (e.key === 'Enter') handleRegister(); });
  $('logPassword').addEventListener('keydown', e => { if (e.key === 'Enter') handleLogin(); });

  // Wall
  $('postBtn').addEventListener('click', postMessage);
  $('msgInput').addEventListener('keydown', e => { if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') postMessage(); });
  $('logoutBtn').addEventListener('click', logout);
});
