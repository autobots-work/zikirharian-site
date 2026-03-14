/**
 * ZikirHarian — Static Site Generator
 * ─────────────────────────────────────
 * Run:  node build.js
 *
 * What it does:
 *  1. Fetches published entries from zikir.json (GitHub)
 *  2. Copies index.html, assets/, _redirects into /dist
 *  3. Generates /dist/zikir/[slug]/index.html per entry
 *  4. Generates /dist/doa/[slug]/index.html per entry
 *  5. Generates /dist/kategori/[cat]/index.html per category
 *  6. Generates /dist/zikir/index.html listing
 *  7. Generates /dist/doa/index.html listing
 *  8. Generates /dist/sitemap.xml + robots.txt
 *
 * Language strategy: Single file, all 3 languages baked in
 *  MY (default): zikirharian.com/zikir/[slug]/
 *  ID:           zikirharian.com/zikir/[slug]/?lang=id

 *  hreflang tags on every page for Google
 */

const https = require('https');
const fs    = require('fs');
const path  = require('path');

const JSON_URL  = 'https://raw.githubusercontent.com/autobots-work/zikirharian-content/main/zikir.json';
const SITE_URL  = 'https://zikirharian.com';
const SITE_NAME = 'ZikirHarian';
const SRC       = __dirname;/**
 * ZikirHarian — Static Site Generator
 * ─────────────────────────────────────
 * Run:  node build.js
 *
 * What it does:
 *  1. Fetches published entries from zikir.json (GitHub)
 *  2. Copies index.html, assets/, _redirects into /dist
 *  3. Generates /dist/zikir/[slug]/index.html per entry
 *  4. Generates /dist/doa/[slug]/index.html per entry
 *  5. Generates /dist/kategori/[cat]/index.html per category
 *  6. Generates /dist/zikir/index.html listing
 *  7. Generates /dist/doa/index.html listing
 *  8. Generates /dist/sitemap.xml + robots.txt
 *
 * Language strategy: Single file, all 3 languages baked in
 *  MY (default): zikirharian.com/zikir/[slug]/
 *  ID:           zikirharian.com/zikir/[slug]/?lang=id

 *  hreflang tags on every page for Google
 */

const https = require('https');
const fs    = require('fs');
const path  = require('path');

const JSON_URL  = 'https://raw.githubusercontent.com/autobots-work/zikirharian-content/main/zikir.json';
const SITE_URL  = 'https://zikirharian.com';
const SITE_NAME = 'ZikirHarian';
const SRC       = __dirname;
const DIST      = path.join(SRC, 'dist');

const CAT_META = {
  'pagi':          { icon:'🌅', my:'Zikir Pagi',       id:'Zikir Pagi',          en:'Morning Dhikr' },
  'petang':        { icon:'🌇', my:'Zikir Petang',      id:'Zikir Petang',        en:'Evening Dhikr' },
  'selepas-solat': { icon:'🤲', my:'Selepas Solat',     id:'Setelah Sholat',      en:'After Prayer' },
  'tidur':         { icon:'😴', my:'Sebelum Tidur',     id:'Sebelum Tidur',       en:'Before Sleep' },
  'situasi':       { icon:'🌿', my:'Situasi Harian',    id:'Situasi Sehari-hari', en:'Daily Situations' },
  'doa-harian':    { icon:'🙏', my:'Doa Harian',        id:'Doa Sehari-hari',     en:'Daily Duas' },
  'asmaul-husna':  { icon:'✨', my:'Asmaul Husna',      id:'Asmaul Husna',        en:'Asmaul Husna' },
  'peristiwa':     { icon:'🕌', my:'Peristiwa Khas',    id:'Peristiwa Khusus',    en:'Special Events' },
};

// ── Inlined asset content (loaded at build time) ──────────────────────────────
let APP_JS = '';
let STYLE_CSS = '';
function fetchJSON(url) {
  return new Promise((resolve, reject) => {
    https.get(url, res => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => { try { resolve(JSON.parse(data)); } catch(e) { reject(e); } });
    }).on('error', reject);
  });
}

function mkdir(p) { fs.mkdirSync(p, { recursive: true }); }

function write(filePath, content) {
  mkdir(path.dirname(filePath));
  fs.writeFileSync(filePath, content, 'utf8');
}

function esc(str = '') {
  return String(str)
    .replace(/&/g,'&amp;').replace(/</g,'&lt;')
    .replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;');
}

function catLabel(cat, lang = 'my') {
  const m = CAT_META[cat];
  return m ? (lang === 'id' ? m.id : m.my) : cat;
}

function copyRecursive(src, dest) {
  if (!fs.existsSync(src)) return;
  const stat = fs.statSync(src);
  if (stat.isDirectory()) {
    mkdir(dest);
    fs.readdirSync(src).forEach(f => copyRecursive(path.join(src, f), path.join(dest, f)));
  } else {
    mkdir(path.dirname(dest));
    fs.copyFileSync(src, dest);
  }
}

// ── Shared Head ───────────────────────────────────────────────────────────────
function sharedHead({ title, desc, canonical, ogImage = '/assets/og-default.jpg', schema = null }) {
  return `
  <meta charset="UTF-8" />
  <meta name="google" content="notranslate" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${esc(title)}</title>
  <meta name="description" content="${esc(desc)}" />
  <meta name="robots" content="index, follow, max-snippet:-1, max-image-preview:large" />
  <meta name="author" content="Zikir Harian" />
  <link rel="canonical" href="${SITE_URL}${canonical}" />
  <link rel="alternate" hreflang="ms"        href="${SITE_URL}${canonical}" />
  <link rel="alternate" hreflang="id"        href="${SITE_URL}${canonical}?lang=id" />
  <link rel="alternate" hreflang="x-default" href="${SITE_URL}${canonical}" />
  <meta property="og:type" content="website" />
  <meta property="og:site_name" content="${SITE_NAME}" />
  <meta property="og:title" content="${esc(title)}" />
  <meta property="og:description" content="${esc(desc)}" />
  <meta property="og:url" content="${SITE_URL}${canonical}" />
  <meta property="og:image" content="${SITE_URL}${ogImage}" />
  <meta property="og:image:width" content="1200" />
  <meta property="og:image:height" content="630" />
  <meta property="og:locale" content="ms_MY" />
  <meta property="og:locale:alternate" content="id_ID" />
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content="${esc(title)}" />
  <meta name="twitter:description" content="${esc(desc)}" />
  <meta name="twitter:image" content="${SITE_URL}${ogImage}" />
  <link rel="icon" type="image/x-icon" href="/assets/favicon.ico" />
  <link rel="icon" type="image/png" sizes="32x32" href="/assets/favicon-32x32.png" />
  <link rel="icon" type="image/png" sizes="16x16" href="/assets/favicon-16x16.png" />
  <link rel="apple-touch-icon" sizes="180x180" href="/assets/apple-touch-icon.png" />
  <link rel="manifest" href="/assets/site.webmanifest" />
  <meta name="theme-color" content="#92400e" media="(prefers-color-scheme: light)" />
  <meta name="theme-color" content="#1f1e1c" media="(prefers-color-scheme: dark)" />
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link href="https://fonts.googleapis.com/css2?family=Amiri:ital,wght@0,400;0,700;1,400&display=swap" rel="stylesheet" />
  ${STYLE_CSS ? `<style>${STYLE_CSS}</style>` : '<link rel="stylesheet" href="/assets/style.css" />'}
  ${schema ? `<script type="application/ld+json">${JSON.stringify(schema)}<\/script>` : ''}`;
}

// ── Shared Nav ────────────────────────────────────────────────────────────────
const NAV = `
  <nav class="nav" role="navigation" aria-label="Navigasi utama">
    <div class="nav-inner">
      <a href="/" class="nav-logo" aria-label="ZikirHarian">ZikirHarian</a>
      <ul class="nav-links" role="list">
        <li><a href="/zikir/">Zikir</a></li>
        <li><a href="/doa/">Doa</a></li>
        <li><a href="/kategori/">Kategori</a></li>
        <li><a href="/tentang/">Tentang</a></li>
      </ul>
      <div class="nav-right">
        <div class="lang-toggle" role="group" aria-label="Pilih bahasa">
          <button class="lang-btn active" data-lang="my" aria-pressed="true">MY</button>
          <button class="lang-btn" data-lang="id" aria-pressed="false">ID</button>

        </div>
        <button class="theme-btn" id="themeToggle" aria-label="Tukar tema">☀️</button>
        <button class="hamburger" id="menuBtn" aria-label="Buka menu" aria-expanded="false">
          <span></span><span></span><span></span>
        </button>
      </div>
    </div>
  </nav>
  <div class="mobile-nav" id="mobileNav" role="dialog" aria-modal="true">
    <div class="mobile-nav-overlay" id="navOverlay"></div>
    <div class="mobile-nav-drawer">
      <button class="mobile-nav-close" id="navClose" aria-label="Tutup menu">✕</button>
      <a href="/zikir/">Zikir</a>
      <a href="/doa/">Doa</a>
      <a href="/kategori/">Kategori</a>
      <a href="/tentang/">Tentang</a>
    </div>
  </div>`;

// ── Shared Footer ─────────────────────────────────────────────────────────────
const year = new Date().getFullYear();
const FOOTER = `
  <footer role="contentinfo">
    <div class="footer-inner">
      <div class="footer-top">
        <div>
          <a href="/" class="footer-logo">ZikirHarian</a>
          <p class="footer-desc">Koleksi zikir, doa dan wirid harian terbaik untuk Muslim Malaysia dan Indonesia. Lengkap dengan bacaan Arab, rumi, terjemahan dan fadhilat.</p>
        </div>
        <div>
          <div class="footer-heading">Navigasi</div>
          <ul class="footer-links" role="list">
            <li><a href="/zikir/">Zikir</a></li>
            <li><a href="/doa/">Doa</a></li>
            <li><a href="/kategori/">Kategori</a></li>
            <li><a href="/tentang/">Tentang</a></li>
          </ul>
        </div>
        <div>
          <div class="footer-heading">Kategori Popular</div>
          <ul class="footer-links" role="list">
            <li><a href="/kategori/pagi/">Zikir Pagi</a></li>
            <li><a href="/kategori/petang/">Zikir Petang</a></li>
            <li><a href="/kategori/selepas-solat/">Selepas Solat</a></li>
            <li><a href="/kategori/doa-harian/">Doa Harian</a></li>
            <li><a href="/kategori/tidur/">Sebelum Tidur</a></li>
          </ul>
        </div>
      </div>
      <div class="footer-bottom">
        <p class="footer-copy">© ${year} ZikirHarian.com · Zikir Harian</p>
        <div class="footer-policy">
          <a href="/privasi/">Privasi</a>
          <a href="/syarat/">Syarat Guna</a>
        </div>
      </div>
    </div>
  </footer>`;

// ── Entry Page ────────────────────────────────────────────────────────────────
function buildEntryPage(item, allData) {
  const canon  = `/${item.type}/${item.slug}/`;
  const m      = CAT_META[item.category] || {};
  const title  = `${item.name_my} — Bacaan, Fadhilat & Terjemahan | ${SITE_NAME}`;
  const desc   = `${item.name_my}: ${(item.fadhilat_my||'').slice(0,140)}. Lengkap dengan bacaan Arab, rumi, terjemahan dan sumber hadis.`;

  const related = allData
    .filter(d => d.category === item.category && d.slug !== item.slug && d.status === 'published')
    .slice(0, 4);

  const schema = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Article",
        "headline": item.name_my,
        "description": desc,
        "url": `${SITE_URL}${canon}`,
        "inLanguage": ["ms","id"],
        "author": { "@type": "Organization", "name": "Zikir Harian" },
        "publisher": {
          "@type": "Organization", "name": "Zikir Harian",
          "logo": { "@type": "ImageObject", "url": `${SITE_URL}/assets/logo.png` }
        },
        "datePublished": item.publishedAt || item.createdAt,
        "dateModified":  item.publishedAt || item.createdAt,
        "keywords": (item.tags||[]).join(', ')
      },
      {
        "@type": "FAQPage",
        "mainEntity": [
          { "@type": "Question", "name": `Apakah maksud ${item.name_my}?`,
            "acceptedAnswer": { "@type": "Answer", "text": item.translation_my||'' } },
          { "@type": "Question", "name": `Berapa kali membaca ${item.name_my}?`,
            "acceptedAnswer": { "@type": "Answer",
              "text": item.bilangan ? `${item.name_my} dibaca sebanyak ${item.bilangan} kali.` : `Tiada bilangan tetap dinyatakan.` } },
          { "@type": "Question", "name": `Dari mana sumber ${item.name_my}?`,
            "acceptedAnswer": { "@type": "Answer", "text": item.sumber||'Sila rujuk kitab hadis yang muktamad.' } }
        ]
      },
      {
        "@type": "BreadcrumbList",
        "itemListElement": [
          { "@type": "ListItem", "position": 1, "name": "Utama",                              "item": SITE_URL },
          { "@type": "ListItem", "position": 2, "name": item.type==='zikir'?'Zikir':'Doa',   "item": `${SITE_URL}/${item.type}/` },
          { "@type": "ListItem", "position": 3, "name": catLabel(item.category),              "item": `${SITE_URL}/kategori/${item.category}/` },
          { "@type": "ListItem", "position": 4, "name": item.name_my,                        "item": `${SITE_URL}${canon}` }
        ]
      }
    ]
  };

  const relatedHTML = related.length ? `
    <section class="related-section" aria-labelledby="related-heading">
      <div class="section-header">
        <h2 class="section-title" id="related-heading">Amalan Berkaitan</h2>
        <div class="section-line"></div>
      </div>
      <div class="entry-list">
        ${related.map(r => `
        <a href="/${r.type}/${r.slug}/" class="entry-card">
          <div class="entry-arabic-preview" lang="ar">${esc((r.arabic||'').slice(0,8))}</div>
          <div class="entry-info">
            <div class="entry-name">${esc(r.name_my)}</div>
            <div class="entry-rumi">${esc(r.rumi||'')}</div>
          </div>
          <div class="entry-arrow" aria-hidden="true">›</div>
        </a>`).join('')}
      </div>
    </section>` : '';

  const tagsHTML = (item.tags||[]).length
    ? `<div class="tags-wrap">${(item.tags||[]).map(t=>`<a href="/tag/${esc(t)}/" class="tag">#${esc(t)}</a>`).join('')}</div>` : '';

  return `<!DOCTYPE html>
<html lang="ms" dir="ltr" translate="no">
<head>${sharedHead({ title, desc, canonical: canon, schema })}</head>
<body>
  ${NAV}
  <nav class="breadcrumb-bar" aria-label="Laluan navigasi">
    <div class="page-wrap">
      <ol class="breadcrumb" itemscope itemtype="https://schema.org/BreadcrumbList">
        <li itemprop="itemListElement" itemscope itemtype="https://schema.org/ListItem">
          <a href="/" itemprop="item"><span itemprop="name">Utama</span></a><meta itemprop="position" content="1" />
        </li>
        <li aria-hidden="true">›</li>
        <li itemprop="itemListElement" itemscope itemtype="https://schema.org/ListItem">
          <a href="/${item.type}/" itemprop="item"><span itemprop="name">${item.type==='zikir'?'Zikir':'Doa'}</span></a><meta itemprop="position" content="2" />
        </li>
        <li aria-hidden="true">›</li>
        <li itemprop="itemListElement" itemscope itemtype="https://schema.org/ListItem">
          <a href="/kategori/${esc(item.category)}/" itemprop="item"><span itemprop="name">${esc(catLabel(item.category))}</span></a><meta itemprop="position" content="3" />
        </li>
        <li aria-hidden="true">›</li>
        <li itemprop="itemListElement" itemscope itemtype="https://schema.org/ListItem">
          <span itemprop="name" aria-current="page" id="breadcrumb-title">${esc(item.name_my)}</span><meta itemprop="position" content="4" />
        </li>
      </ol>
    </div>
  </nav>

  <main class="page-wrap entry-main" id="main-content">
    <article itemscope itemtype="https://schema.org/Article">
      <header class="entry-header">
        <span class="entry-type-badge badge-${esc(item.type)}">${item.type==='zikir'?'Zikir':'Doa'}</span>
        <h1 class="entry-title" itemprop="headline" id="entryTitle">${esc(item.name_my)}</h1>
        <p class="entry-subtitle" id="entrySubtitle">${item.bilangan?`Dibaca ${item.bilangan} kali`:''}</p>
      </header>

      <div class="arabic-block" role="region" aria-label="Bacaan Arab">
        <div class="arabic-text" lang="ar" dir="rtl" id="arabicText">${esc(item.arabic||'')}</div>
        <div class="rumi-text" id="rumiText">${esc(item.rumi||'')}</div>
        <div class="translation-text" id="transText">${esc(item.translation_my||'')}</div>
        ${item.bilangan?`<span class="count-pill" id="countPill">× ${item.bilangan} kali</span>`:''}
      </div>

      <section class="answer-section" aria-labelledby="answer-heading">
        <h2 class="sr-only" id="answer-heading">Fadhilat dan Keterangan</h2>
        <div class="answer-block" itemscope itemtype="https://schema.org/Question">
          <div class="answer-q" itemprop="name">Apakah fadhilat ${esc(item.name_my)}?</div>
          <div class="answer-a" itemscope itemprop="acceptedAnswer" itemtype="https://schema.org/Answer">
            <span itemprop="text" id="fadhilatText">${esc(item.fadhilat_my||'')}</span>
          </div>
        </div>
        ${item.bilangan?`
        <div class="answer-block" itemscope itemtype="https://schema.org/Question">
          <div class="answer-q" itemprop="name">Berapa kali membaca ${esc(item.name_my)}?</div>
          <div class="answer-a" itemscope itemprop="acceptedAnswer" itemtype="https://schema.org/Answer">
            <span itemprop="text" id="countAnswer">${esc(item.name_my)} dibaca sebanyak <strong>${item.bilangan} kali</strong>${item.category==='selepas-solat'?' selepas setiap solat fardu':''}.</span>
          </div>
        </div>`:''}
        <div class="answer-block" itemscope itemtype="https://schema.org/Question">
          <div class="answer-q" itemprop="name">Dari mana sumber ${esc(item.name_my)}?</div>
          <div class="answer-a" itemscope itemprop="acceptedAnswer" itemtype="https://schema.org/Answer">
            <span itemprop="text" id="sumberAnswer">${esc(item.sumber||'')}</span>
          </div>
        </div>
      </section>

      ${item.sumber?`
      <div class="source-block">
        <span class="source-icon" aria-hidden="true">📖</span>
        <span id="sumberText">${esc(item.sumber)}</span>
      </div>`:''}

      ${tagsHTML}

      <div class="ornament" aria-hidden="true">
        <div class="ornament-line"></div><div class="ornament-diamond"></div><div class="ornament-line"></div>
      </div>

      ${relatedHTML}
    </article>
  </main>
  ${FOOTER}

  <script>
  const ENTRY_I18N = {
    my: {
      title:    ${JSON.stringify(item.name_my||'')},
      subtitle: ${JSON.stringify(item.bilangan?`Dibaca ${item.bilangan} kali`:'')},
      trans:    ${JSON.stringify(item.translation_my||'')},
      fadhilat: ${JSON.stringify(item.fadhilat_my||'')},
      sumber:   ${JSON.stringify(item.sumber||'')},
      count:    ${JSON.stringify(item.bilangan?`× ${item.bilangan} kali`:'')},
    },
    id: {
      title:    ${JSON.stringify(item.name_id||item.name_my||'')},
      subtitle: ${JSON.stringify(item.bilangan?`Dibaca ${item.bilangan} kali`:'')},
      trans:    ${JSON.stringify(item.translation_id||item.translation_my||'')},
      fadhilat: ${JSON.stringify(item.fadhilat_id||item.fadhilat_my||'')},
      sumber:   ${JSON.stringify(item.sumber||'')},
      count:    ${JSON.stringify(item.bilangan?`× ${item.bilangan} kali`:'')},
    },
    en: {
      title:    ${JSON.stringify(item.name_en||item.name_my||'')},
      subtitle: ${JSON.stringify(item.bilangan?`Recite ${item.bilangan} times`:'')},
      trans:    ${JSON.stringify(item.translation_en||item.translation_my||'')},
      fadhilat: ${JSON.stringify(item.fadhilat_en||item.fadhilat_my||'')},
      sumber:   ${JSON.stringify(item.sumber||'')},
      count:    ${JSON.stringify(item.bilangan?`× ${item.bilangan} times`:'')},
    }
  };
  <\/script>
  <script>${APP_JS}</script>
</body>
</html>`;
}

// ── Listing Page ──────────────────────────────────────────────────────────────
function buildListingPage(type, items) {
  const isZikir = type === 'zikir';
  const title   = isZikir ? `Semua Zikir Harian — Koleksi Lengkap | ${SITE_NAME}` : `Semua Doa Harian — Koleksi Lengkap | ${SITE_NAME}`;
  const desc    = `Koleksi lengkap ${items.length} ${isZikir?'zikir':'doa'} harian dengan bacaan Arab, rumi, terjemahan dan fadhilat. Panduan terbaik untuk Muslim Malaysia dan Indonesia.`;
  const canon   = `/${type}/`;
  const schema  = {
    "@context": "https://schema.org",
    "@graph": [
      { "@type": "CollectionPage", "name": title, "description": desc, "url": `${SITE_URL}${canon}`, "numberOfItems": items.length,
        "publisher": { "@type": "Organization", "name": "Zikir Harian" } },
      { "@type": "BreadcrumbList", "itemListElement": [
        { "@type": "ListItem", "position": 1, "name": "Utama", "item": SITE_URL },
        { "@type": "ListItem", "position": 2, "name": isZikir?"Zikir":"Doa", "item": `${SITE_URL}${canon}` }
      ]}
    ]
  };

  return `<!DOCTYPE html>
<html lang="ms" dir="ltr" translate="no">
<head>${sharedHead({ title, desc, canonical: canon, schema })}</head>
<body>
  ${NAV}
  <nav class="breadcrumb-bar" aria-label="Laluan navigasi">
    <div class="page-wrap">
      <ol class="breadcrumb">
        <li><a href="/">Utama</a></li><li aria-hidden="true">›</li>
        <li aria-current="page">${isZikir?'Zikir':'Doa'}</li>
      </ol>
    </div>
  </nav>
  <main class="page-wrap" id="main-content" style="padding-bottom:60px">
    <div class="section-header" style="padding-top:40px">
      <h1 class="section-title">${isZikir?'Semua Zikir':'Semua Doa'}</h1>
      <div class="section-line"></div>
      <span style="font-size:13px;color:var(--txm)">${items.length} amalan</span>
    </div>
    <div class="entry-list">
      ${items.map(item=>`
      <a href="/${item.type}/${item.slug}/" class="entry-card">
        <div class="entry-arabic-preview" lang="ar">${esc((item.arabic||'').slice(0,8))}</div>
        <div class="entry-info">
          <div class="entry-name">${esc(item.name_my)}</div>
          <div class="entry-rumi">${esc(item.rumi||'')}</div>
          <div class="entry-cat">${esc(catLabel(item.category))}</div>
        </div>
        <div class="entry-arrow" aria-hidden="true">›</div>
      </a>`).join('')}
    </div>
  </main>
  ${FOOTER}
  <script>${APP_JS}</script>
</body>
</html>`;
}

// ── Category Page ─────────────────────────────────────────────────────────────
function buildCategoryPage(cat, items) {
  const m      = CAT_META[cat] || { icon:'🌿', my:cat, id:cat, en:cat };
  const canon  = `/kategori/${cat}/`;
  const title  = `${m.my} — Zikir & Doa | ${SITE_NAME}`;
  const desc   = `Koleksi ${m.my.toLowerCase()} lengkap dengan bacaan Arab, rumi, terjemahan dan fadhilat. ${items.length} amalan tersedia di ZikirHarian.`;
  const schema = {
    "@context": "https://schema.org",
    "@graph": [
      { "@type": "CollectionPage", "name": title, "description": desc, "url": `${SITE_URL}${canon}`, "numberOfItems": items.length,
        "publisher": { "@type": "Organization", "name": "Zikir Harian" } },
      { "@type": "BreadcrumbList", "itemListElement": [
        { "@type": "ListItem", "position": 1, "name": "Utama",    "item": SITE_URL },
        { "@type": "ListItem", "position": 2, "name": "Kategori", "item": `${SITE_URL}/kategori/` },
        { "@type": "ListItem", "position": 3, "name": m.my,       "item": `${SITE_URL}${canon}` }
      ]}
    ]
  };

  return `<!DOCTYPE html>
<html lang="ms" dir="ltr" translate="no">
<head>${sharedHead({ title, desc, canonical: canon, schema })}</head>
<body>
  ${NAV}
  <nav class="breadcrumb-bar" aria-label="Laluan navigasi">
    <div class="page-wrap">
      <ol class="breadcrumb">
        <li><a href="/">Utama</a></li><li aria-hidden="true">›</li>
        <li><a href="/kategori/">Kategori</a></li><li aria-hidden="true">›</li>
        <li aria-current="page">${esc(m.my)}</li>
      </ol>
    </div>
  </nav>
  <main class="page-wrap" id="main-content" style="padding-bottom:60px">
    <div class="section-header" style="padding-top:40px">
      <h1 class="section-title">${m.icon} ${esc(m.my)}</h1>
      <div class="section-line"></div>
      <span style="font-size:13px;color:var(--txm)">${items.length} amalan</span>
    </div>
    <div class="entry-list">
      ${items.map(item=>`
      <a href="/${item.type}/${item.slug}/" class="entry-card">
        <div class="entry-arabic-preview" lang="ar">${esc((item.arabic||'').slice(0,8))}</div>
        <div class="entry-info">
          <span class="entry-type-badge badge-${esc(item.type)}">${item.type==='zikir'?'Zikir':'Doa'}</span>
          <div class="entry-name">${esc(item.name_my)}</div>
          <div class="entry-rumi">${esc(item.rumi||'')}</div>
        </div>
        <div class="entry-arrow" aria-hidden="true">›</div>
      </a>`).join('')}
    </div>
  </main>
  ${FOOTER}
  <script>${APP_JS}</script>
</body>
</html>`;
}

// ── Sitemap ───────────────────────────────────────────────────────────────────
function buildSitemap(data) {
  const today = new Date().toISOString().split('T')[0];
  const cats  = [...new Set(data.map(d => d.category))];
  const pages = [
    { loc:'/',          freq:'daily',   priority:'1.0', lastmod:today },
    { loc:'/zikir/',    freq:'weekly',  priority:'0.9', lastmod:today },
    { loc:'/doa/',      freq:'weekly',  priority:'0.9', lastmod:today },
    { loc:'/kategori/', freq:'weekly',  priority:'0.8', lastmod:today },
    { loc:'/tentang/',  freq:'monthly', priority:'0.4', lastmod:today },
    ...cats.map(cat => ({ loc:`/kategori/${cat}/`, freq:'weekly', priority:'0.7', lastmod:today })),
    ...data.map(item  => ({ loc:`/${item.type}/${item.slug}/`, freq:'monthly', priority:'0.8',
        lastmod:(item.publishedAt||today).split('T')[0] })),
  ];
  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${pages.map(p=>`  <url>\n    <loc>${SITE_URL}${p.loc}</loc>\n    <lastmod>${p.lastmod}</lastmod>\n    <changefreq>${p.freq}</changefreq>\n    <priority>${p.priority}</priority>\n  </url>`).join('\n')}
</urlset>`;
}

// ── Main ──────────────────────────────────────────────────────────────────────
async function main() {
  console.log('\n🕌 ZikirHarian — Static Build\n' + '─'.repeat(40));

  // Load assets to inline into generated pages
  const appJsPath = path.join(SRC, 'assets', 'app.js');
  const cssPath   = path.join(SRC, 'assets', 'style.css');
  if (fs.existsSync(appJsPath)) {
    APP_JS = fs.readFileSync(appJsPath, 'utf8');
    console.log('✅ app.js loaded for inlining');
  } else {
    console.warn('⚠️  app.js not found in repo root');
  }
  if (fs.existsSync(cssPath)) {
    STYLE_CSS = fs.readFileSync(cssPath, 'utf8');
    console.log('✅ style.css loaded for inlining');
  } else {
    console.warn('⚠️  assets/style.css not found');
  }
  console.log('');

  let raw;
  try {
    process.stdout.write('⏳ Fetching zikir.json...');
    raw = await fetchJSON(JSON_URL);
    console.log(` ✅ ${raw.length} entries`);
  } catch(e) {
    console.error('\n❌ Failed to fetch zikir.json:', e.message);
    process.exit(1);
  }

  const data = raw.filter(d => d.status === 'published');
  console.log(`📦 ${data.length} published entries\n`);

  // Clean dist
  if (fs.existsSync(DIST)) fs.rmSync(DIST, { recursive: true });
  mkdir(DIST);

  // Copy static files
  ['index.html', '_redirects', '_headers', 'robots.txt'].forEach(f => {
    if (fs.existsSync(path.join(SRC, f))) copyRecursive(path.join(SRC, f), path.join(DIST, f));
  });
  copyRecursive(path.join(SRC, 'assets'), path.join(DIST, 'assets'));
  console.log('📋 Static files copied\n');

  // Entry pages
  let built = 0;
  for (const item of data) {
    if (!item.slug || !item.type) continue;
    write(path.join(DIST, item.type, item.slug, 'index.html'), buildEntryPage(item, data));
    built++;
    process.stdout.write(`\r✍️  Entry pages: ${built}/${data.length}`);
  }
  console.log(`\n✅ ${built} entry pages\n`);

  // Listing pages
  write(path.join(DIST, 'zikir',   'index.html'), buildListingPage('zikir', data.filter(d=>d.type==='zikir')));
  write(path.join(DIST, 'doa',     'index.html'), buildListingPage('doa',   data.filter(d=>d.type==='doa')));
  console.log('✅ Listing pages: /zikir/ /doa/');

  // Category pages
  const cats = [...new Set(data.map(d => d.category))];
  cats.forEach(cat => {
    write(path.join(DIST, 'kategori', cat, 'index.html'), buildCategoryPage(cat, data.filter(d=>d.category===cat)));
  });
  console.log(`✅ ${cats.length} category pages`);

  // Sitemap
  write(path.join(DIST, 'sitemap.xml'), buildSitemap(data));
  console.log('✅ sitemap.xml');

  // robots.txt (if not in src)
  if (!fs.existsSync(path.join(SRC, 'robots.txt'))) {
    write(path.join(DIST, 'robots.txt'), `User-agent: *\nAllow: /\nSitemap: ${SITE_URL}/sitemap.xml\n`);
    console.log('✅ robots.txt');
  }

  const total = built + 2 + cats.length;
  console.log(`\n${'─'.repeat(40)}`);
  console.log(`🎉 Done — ${total} pages built in /dist`);
  console.log(`📁 Deploy /dist to Cloudflare Pages\n`);
}

main().catch(err => { console.error('\n❌ Build failed:', err); process.exit(1); });
const DIST      = path.join(SRC, 'dist');

const CAT_META = {
  'pagi':          { icon:'🌅', my:'Zikir Pagi',       id:'Zikir Pagi',          en:'Morning Dhikr' },
  'petang':        { icon:'🌇', my:'Zikir Petang',      id:'Zikir Petang',        en:'Evening Dhikr' },
  'selepas-solat': { icon:'🤲', my:'Selepas Solat',     id:'Setelah Sholat',      en:'After Prayer' },
  'tidur':         { icon:'😴', my:'Sebelum Tidur',     id:'Sebelum Tidur',       en:'Before Sleep' },
  'situasi':       { icon:'🌿', my:'Situasi Harian',    id:'Situasi Sehari-hari', en:'Daily Situations' },
  'doa-harian':    { icon:'🙏', my:'Doa Harian',        id:'Doa Sehari-hari',     en:'Daily Duas' },
  'asmaul-husna':  { icon:'✨', my:'Asmaul Husna',      id:'Asmaul Husna',        en:'Asmaul Husna' },
  'peristiwa':     { icon:'🕌', my:'Peristiwa Khas',    id:'Peristiwa Khusus',    en:'Special Events' },
};

// ── Inlined asset content (loaded at build time) ──────────────────────────────
let APP_JS = '';
let STYLE_CSS = '';
function fetchJSON(url) {
  return new Promise((resolve, reject) => {
    https.get(url, res => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => { try { resolve(JSON.parse(data)); } catch(e) { reject(e); } });
    }).on('error', reject);
  });
}

function mkdir(p) { fs.mkdirSync(p, { recursive: true }); }

function write(filePath, content) {
  mkdir(path.dirname(filePath));
  fs.writeFileSync(filePath, content, 'utf8');
}

function esc(str = '') {
  return String(str)
    .replace(/&/g,'&amp;').replace(/</g,'&lt;')
    .replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;');
}

function catLabel(cat, lang = 'my') {
  const m = CAT_META[cat];
  return m ? (lang === 'id' ? m.id : m.my) : cat;
}

function copyRecursive(src, dest) {
  if (!fs.existsSync(src)) return;
  const stat = fs.statSync(src);
  if (stat.isDirectory()) {
    mkdir(dest);
    fs.readdirSync(src).forEach(f => copyRecursive(path.join(src, f), path.join(dest, f)));
  } else {
    mkdir(path.dirname(dest));
    fs.copyFileSync(src, dest);
  }
}

// ── Shared Head ───────────────────────────────────────────────────────────────
function sharedHead({ title, desc, canonical, ogImage = '/assets/og-default.jpg', schema = null }) {
  return `
  <meta charset="UTF-8" />
  <meta name="google" content="notranslate" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${esc(title)}</title>
  <meta name="description" content="${esc(desc)}" />
  <meta name="robots" content="index, follow, max-snippet:-1, max-image-preview:large" />
  <meta name="author" content="Zikir Harian" />
  <link rel="canonical" href="${SITE_URL}${canonical}" />
  <link rel="alternate" hreflang="ms"        href="${SITE_URL}${canonical}" />
  <link rel="alternate" hreflang="id"        href="${SITE_URL}${canonical}?lang=id" />
  <link rel="alternate" hreflang="x-default" href="${SITE_URL}${canonical}" />
  <meta property="og:type" content="website" />
  <meta property="og:site_name" content="${SITE_NAME}" />
  <meta property="og:title" content="${esc(title)}" />
  <meta property="og:description" content="${esc(desc)}" />
  <meta property="og:url" content="${SITE_URL}${canonical}" />
  <meta property="og:image" content="${SITE_URL}${ogImage}" />
  <meta property="og:image:width" content="1200" />
  <meta property="og:image:height" content="630" />
  <meta property="og:locale" content="ms_MY" />
  <meta property="og:locale:alternate" content="id_ID" />
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content="${esc(title)}" />
  <meta name="twitter:description" content="${esc(desc)}" />
  <meta name="twitter:image" content="${SITE_URL}${ogImage}" />
  <link rel="icon" type="image/png" href="/assets/favicon.png" />
  <link rel="apple-touch-icon" href="/assets/apple-touch-icon.png" />
  <meta name="theme-color" content="#92400e" media="(prefers-color-scheme: light)" />
  <meta name="theme-color" content="#1f1e1c" media="(prefers-color-scheme: dark)" />
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link href="https://fonts.googleapis.com/css2?family=Amiri:ital,wght@0,400;0,700;1,400&display=swap" rel="stylesheet" />
  ${STYLE_CSS ? `<style>${STYLE_CSS}</style>` : '<link rel="stylesheet" href="/assets/style.css" />'}
  ${schema ? `<script type="application/ld+json">${JSON.stringify(schema)}<\/script>` : ''}`;
}

// ── Shared Nav ────────────────────────────────────────────────────────────────
const NAV = `
  <nav class="nav" role="navigation" aria-label="Navigasi utama">
    <div class="nav-inner">
      <a href="/" class="nav-logo" aria-label="ZikirHarian">ZikirHarian</a>
      <ul class="nav-links" role="list">
        <li><a href="/zikir/">Zikir</a></li>
        <li><a href="/doa/">Doa</a></li>
        <li><a href="/kategori/">Kategori</a></li>
        <li><a href="/tentang/">Tentang</a></li>
      </ul>
      <div class="nav-right">
        <div class="lang-toggle" role="group" aria-label="Pilih bahasa">
          <button class="lang-btn active" data-lang="my" aria-pressed="true">MY</button>
          <button class="lang-btn" data-lang="id" aria-pressed="false">ID</button>

        </div>
        <button class="theme-btn" id="themeToggle" aria-label="Tukar tema">☀️</button>
        <button class="hamburger" id="menuBtn" aria-label="Buka menu" aria-expanded="false">
          <span></span><span></span><span></span>
        </button>
      </div>
    </div>
  </nav>
  <div class="mobile-nav" id="mobileNav" role="dialog" aria-modal="true">
    <div class="mobile-nav-overlay" id="navOverlay"></div>
    <div class="mobile-nav-drawer">
      <button class="mobile-nav-close" id="navClose" aria-label="Tutup menu">✕</button>
      <a href="/zikir/">Zikir</a>
      <a href="/doa/">Doa</a>
      <a href="/kategori/">Kategori</a>
      <a href="/tentang/">Tentang</a>
    </div>
  </div>`;

// ── Shared Footer ─────────────────────────────────────────────────────────────
const year = new Date().getFullYear();
const FOOTER = `
  <footer role="contentinfo">
    <div class="footer-inner">
      <div class="footer-top">
        <div>
          <a href="/" class="footer-logo">ZikirHarian</a>
          <p class="footer-desc">Koleksi zikir, doa dan wirid harian terbaik untuk Muslim Malaysia dan Indonesia. Lengkap dengan bacaan Arab, rumi, terjemahan dan fadhilat.</p>
        </div>
        <div>
          <div class="footer-heading">Navigasi</div>
          <ul class="footer-links" role="list">
            <li><a href="/zikir/">Zikir</a></li>
            <li><a href="/doa/">Doa</a></li>
            <li><a href="/kategori/">Kategori</a></li>
            <li><a href="/tentang/">Tentang</a></li>
          </ul>
        </div>
        <div>
          <div class="footer-heading">Kategori Popular</div>
          <ul class="footer-links" role="list">
            <li><a href="/kategori/pagi/">Zikir Pagi</a></li>
            <li><a href="/kategori/petang/">Zikir Petang</a></li>
            <li><a href="/kategori/selepas-solat/">Selepas Solat</a></li>
            <li><a href="/kategori/doa-harian/">Doa Harian</a></li>
            <li><a href="/kategori/tidur/">Sebelum Tidur</a></li>
          </ul>
        </div>
      </div>
      <div class="footer-bottom">
        <p class="footer-copy">© ${year} ZikirHarian.com · Zikir Harian</p>
        <div class="footer-policy">
          <a href="/privasi/">Privasi</a>
          <a href="/syarat/">Syarat Guna</a>
        </div>
      </div>
    </div>
  </footer>`;

// ── Entry Page ────────────────────────────────────────────────────────────────
function buildEntryPage(item, allData) {
  const canon  = `/${item.type}/${item.slug}/`;
  const m      = CAT_META[item.category] || {};
  const title  = `${item.name_my} — Bacaan, Fadhilat & Terjemahan | ${SITE_NAME}`;
  const desc   = `${item.name_my}: ${(item.fadhilat_my||'').slice(0,140)}. Lengkap dengan bacaan Arab, rumi, terjemahan dan sumber hadis.`;

  const related = allData
    .filter(d => d.category === item.category && d.slug !== item.slug && d.status === 'published')
    .slice(0, 4);

  const schema = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Article",
        "headline": item.name_my,
        "description": desc,
        "url": `${SITE_URL}${canon}`,
        "inLanguage": ["ms","id"],
        "author": { "@type": "Organization", "name": "Zikir Harian" },
        "publisher": {
          "@type": "Organization", "name": "Zikir Harian",
          "logo": { "@type": "ImageObject", "url": `${SITE_URL}/assets/logo.png` }
        },
        "datePublished": item.publishedAt || item.createdAt,
        "dateModified":  item.publishedAt || item.createdAt,
        "keywords": (item.tags||[]).join(', ')
      },
      {
        "@type": "FAQPage",
        "mainEntity": [
          { "@type": "Question", "name": `Apakah maksud ${item.name_my}?`,
            "acceptedAnswer": { "@type": "Answer", "text": item.translation_my||'' } },
          { "@type": "Question", "name": `Berapa kali membaca ${item.name_my}?`,
            "acceptedAnswer": { "@type": "Answer",
              "text": item.bilangan ? `${item.name_my} dibaca sebanyak ${item.bilangan} kali.` : `Tiada bilangan tetap dinyatakan.` } },
          { "@type": "Question", "name": `Dari mana sumber ${item.name_my}?`,
            "acceptedAnswer": { "@type": "Answer", "text": item.sumber||'Sila rujuk kitab hadis yang muktamad.' } }
        ]
      },
      {
        "@type": "BreadcrumbList",
        "itemListElement": [
          { "@type": "ListItem", "position": 1, "name": "Utama",                              "item": SITE_URL },
          { "@type": "ListItem", "position": 2, "name": item.type==='zikir'?'Zikir':'Doa',   "item": `${SITE_URL}/${item.type}/` },
          { "@type": "ListItem", "position": 3, "name": catLabel(item.category),              "item": `${SITE_URL}/kategori/${item.category}/` },
          { "@type": "ListItem", "position": 4, "name": item.name_my,                        "item": `${SITE_URL}${canon}` }
        ]
      }
    ]
  };

  const relatedHTML = related.length ? `
    <section class="related-section" aria-labelledby="related-heading">
      <div class="section-header">
        <h2 class="section-title" id="related-heading">Amalan Berkaitan</h2>
        <div class="section-line"></div>
      </div>
      <div class="entry-list">
        ${related.map(r => `
        <a href="/${r.type}/${r.slug}/" class="entry-card">
          <div class="entry-arabic-preview" lang="ar">${esc((r.arabic||'').slice(0,8))}</div>
          <div class="entry-info">
            <div class="entry-name">${esc(r.name_my)}</div>
            <div class="entry-rumi">${esc(r.rumi||'')}</div>
          </div>
          <div class="entry-arrow" aria-hidden="true">›</div>
        </a>`).join('')}
      </div>
    </section>` : '';

  const tagsHTML = (item.tags||[]).length
    ? `<div class="tags-wrap">${(item.tags||[]).map(t=>`<a href="/tag/${esc(t)}/" class="tag">#${esc(t)}</a>`).join('')}</div>` : '';

  return `<!DOCTYPE html>
<html lang="ms" dir="ltr" translate="no">
<head>${sharedHead({ title, desc, canonical: canon, schema })}</head>
<body>
  ${NAV}
  <nav class="breadcrumb-bar" aria-label="Laluan navigasi">
    <div class="page-wrap">
      <ol class="breadcrumb" itemscope itemtype="https://schema.org/BreadcrumbList">
        <li itemprop="itemListElement" itemscope itemtype="https://schema.org/ListItem">
          <a href="/" itemprop="item"><span itemprop="name">Utama</span></a><meta itemprop="position" content="1" />
        </li>
        <li aria-hidden="true">›</li>
        <li itemprop="itemListElement" itemscope itemtype="https://schema.org/ListItem">
          <a href="/${item.type}/" itemprop="item"><span itemprop="name">${item.type==='zikir'?'Zikir':'Doa'}</span></a><meta itemprop="position" content="2" />
        </li>
        <li aria-hidden="true">›</li>
        <li itemprop="itemListElement" itemscope itemtype="https://schema.org/ListItem">
          <a href="/kategori/${esc(item.category)}/" itemprop="item"><span itemprop="name">${esc(catLabel(item.category))}</span></a><meta itemprop="position" content="3" />
        </li>
        <li aria-hidden="true">›</li>
        <li itemprop="itemListElement" itemscope itemtype="https://schema.org/ListItem">
          <span itemprop="name" aria-current="page" id="breadcrumb-title">${esc(item.name_my)}</span><meta itemprop="position" content="4" />
        </li>
      </ol>
    </div>
  </nav>

  <main class="page-wrap entry-main" id="main-content">
    <article itemscope itemtype="https://schema.org/Article">
      <header class="entry-header">
        <span class="entry-type-badge badge-${esc(item.type)}">${item.type==='zikir'?'Zikir':'Doa'}</span>
        <h1 class="entry-title" itemprop="headline" id="entryTitle">${esc(item.name_my)}</h1>
        <p class="entry-subtitle" id="entrySubtitle">${item.bilangan?`Dibaca ${item.bilangan} kali`:''}</p>
      </header>

      <div class="arabic-block" role="region" aria-label="Bacaan Arab">
        <div class="arabic-text" lang="ar" dir="rtl" id="arabicText">${esc(item.arabic||'')}</div>
        <div class="rumi-text" id="rumiText">${esc(item.rumi||'')}</div>
        <div class="translation-text" id="transText">${esc(item.translation_my||'')}</div>
        ${item.bilangan?`<span class="count-pill" id="countPill">× ${item.bilangan} kali</span>`:''}
      </div>

      <section class="answer-section" aria-labelledby="answer-heading">
        <h2 class="sr-only" id="answer-heading">Fadhilat dan Keterangan</h2>
        <div class="answer-block" itemscope itemtype="https://schema.org/Question">
          <div class="answer-q" itemprop="name">Apakah fadhilat ${esc(item.name_my)}?</div>
          <div class="answer-a" itemscope itemprop="acceptedAnswer" itemtype="https://schema.org/Answer">
            <span itemprop="text" id="fadhilatText">${esc(item.fadhilat_my||'')}</span>
          </div>
        </div>
        ${item.bilangan?`
        <div class="answer-block" itemscope itemtype="https://schema.org/Question">
          <div class="answer-q" itemprop="name">Berapa kali membaca ${esc(item.name_my)}?</div>
          <div class="answer-a" itemscope itemprop="acceptedAnswer" itemtype="https://schema.org/Answer">
            <span itemprop="text" id="countAnswer">${esc(item.name_my)} dibaca sebanyak <strong>${item.bilangan} kali</strong>${item.category==='selepas-solat'?' selepas setiap solat fardu':''}.</span>
          </div>
        </div>`:''}
        <div class="answer-block" itemscope itemtype="https://schema.org/Question">
          <div class="answer-q" itemprop="name">Dari mana sumber ${esc(item.name_my)}?</div>
          <div class="answer-a" itemscope itemprop="acceptedAnswer" itemtype="https://schema.org/Answer">
            <span itemprop="text" id="sumberAnswer">${esc(item.sumber||'')}</span>
          </div>
        </div>
      </section>

      ${item.sumber?`
      <div class="source-block">
        <span class="source-icon" aria-hidden="true">📖</span>
        <span id="sumberText">${esc(item.sumber)}</span>
      </div>`:''}

      ${tagsHTML}

      <div class="ornament" aria-hidden="true">
        <div class="ornament-line"></div><div class="ornament-diamond"></div><div class="ornament-line"></div>
      </div>

      ${relatedHTML}
    </article>
  </main>
  ${FOOTER}

  <script>
  const ENTRY_I18N = {
    my: {
      title:    ${JSON.stringify(item.name_my||'')},
      subtitle: ${JSON.stringify(item.bilangan?`Dibaca ${item.bilangan} kali`:'')},
      trans:    ${JSON.stringify(item.translation_my||'')},
      fadhilat: ${JSON.stringify(item.fadhilat_my||'')},
      sumber:   ${JSON.stringify(item.sumber||'')},
      count:    ${JSON.stringify(item.bilangan?`× ${item.bilangan} kali`:'')},
    },
    id: {
      title:    ${JSON.stringify(item.name_id||item.name_my||'')},
      subtitle: ${JSON.stringify(item.bilangan?`Dibaca ${item.bilangan} kali`:'')},
      trans:    ${JSON.stringify(item.translation_id||item.translation_my||'')},
      fadhilat: ${JSON.stringify(item.fadhilat_id||item.fadhilat_my||'')},
      sumber:   ${JSON.stringify(item.sumber||'')},
      count:    ${JSON.stringify(item.bilangan?`× ${item.bilangan} kali`:'')},
    },
    en: {
      title:    ${JSON.stringify(item.name_en||item.name_my||'')},
      subtitle: ${JSON.stringify(item.bilangan?`Recite ${item.bilangan} times`:'')},
      trans:    ${JSON.stringify(item.translation_en||item.translation_my||'')},
      fadhilat: ${JSON.stringify(item.fadhilat_en||item.fadhilat_my||'')},
      sumber:   ${JSON.stringify(item.sumber||'')},
      count:    ${JSON.stringify(item.bilangan?`× ${item.bilangan} times`:'')},
    }
  };
  <\/script>
  <script>${APP_JS}</script>
</body>
</html>`;
}

// ── Listing Page ──────────────────────────────────────────────────────────────
function buildListingPage(type, items) {
  const isZikir = type === 'zikir';
  const title   = isZikir ? `Semua Zikir Harian — Koleksi Lengkap | ${SITE_NAME}` : `Semua Doa Harian — Koleksi Lengkap | ${SITE_NAME}`;
  const desc    = `Koleksi lengkap ${items.length} ${isZikir?'zikir':'doa'} harian dengan bacaan Arab, rumi, terjemahan dan fadhilat. Panduan terbaik untuk Muslim Malaysia dan Indonesia.`;
  const canon   = `/${type}/`;
  const schema  = {
    "@context": "https://schema.org",
    "@graph": [
      { "@type": "CollectionPage", "name": title, "description": desc, "url": `${SITE_URL}${canon}`, "numberOfItems": items.length,
        "publisher": { "@type": "Organization", "name": "Zikir Harian" } },
      { "@type": "BreadcrumbList", "itemListElement": [
        { "@type": "ListItem", "position": 1, "name": "Utama", "item": SITE_URL },
        { "@type": "ListItem", "position": 2, "name": isZikir?"Zikir":"Doa", "item": `${SITE_URL}${canon}` }
      ]}
    ]
  };

  return `<!DOCTYPE html>
<html lang="ms" dir="ltr" translate="no">
<head>${sharedHead({ title, desc, canonical: canon, schema })}</head>
<body>
  ${NAV}
  <nav class="breadcrumb-bar" aria-label="Laluan navigasi">
    <div class="page-wrap">
      <ol class="breadcrumb">
        <li><a href="/">Utama</a></li><li aria-hidden="true">›</li>
        <li aria-current="page">${isZikir?'Zikir':'Doa'}</li>
      </ol>
    </div>
  </nav>
  <main class="page-wrap" id="main-content" style="padding-bottom:60px">
    <div class="section-header" style="padding-top:40px">
      <h1 class="section-title">${isZikir?'Semua Zikir':'Semua Doa'}</h1>
      <div class="section-line"></div>
      <span style="font-size:13px;color:var(--txm)">${items.length} amalan</span>
    </div>
    <div class="entry-list">
      ${items.map(item=>`
      <a href="/${item.type}/${item.slug}/" class="entry-card">
        <div class="entry-arabic-preview" lang="ar">${esc((item.arabic||'').slice(0,8))}</div>
        <div class="entry-info">
          <div class="entry-name">${esc(item.name_my)}</div>
          <div class="entry-rumi">${esc(item.rumi||'')}</div>
          <div class="entry-cat">${esc(catLabel(item.category))}</div>
        </div>
        <div class="entry-arrow" aria-hidden="true">›</div>
      </a>`).join('')}
    </div>
  </main>
  ${FOOTER}
  <script>${APP_JS}</script>
</body>
</html>`;
}

// ── Category Page ─────────────────────────────────────────────────────────────
function buildCategoryPage(cat, items) {
  const m      = CAT_META[cat] || { icon:'🌿', my:cat, id:cat, en:cat };
  const canon  = `/kategori/${cat}/`;
  const title  = `${m.my} — Zikir & Doa | ${SITE_NAME}`;
  const desc   = `Koleksi ${m.my.toLowerCase()} lengkap dengan bacaan Arab, rumi, terjemahan dan fadhilat. ${items.length} amalan tersedia di ZikirHarian.`;
  const schema = {
    "@context": "https://schema.org",
    "@graph": [
      { "@type": "CollectionPage", "name": title, "description": desc, "url": `${SITE_URL}${canon}`, "numberOfItems": items.length,
        "publisher": { "@type": "Organization", "name": "Zikir Harian" } },
      { "@type": "BreadcrumbList", "itemListElement": [
        { "@type": "ListItem", "position": 1, "name": "Utama",    "item": SITE_URL },
        { "@type": "ListItem", "position": 2, "name": "Kategori", "item": `${SITE_URL}/kategori/` },
        { "@type": "ListItem", "position": 3, "name": m.my,       "item": `${SITE_URL}${canon}` }
      ]}
    ]
  };

  return `<!DOCTYPE html>
<html lang="ms" dir="ltr" translate="no">
<head>${sharedHead({ title, desc, canonical: canon, schema })}</head>
<body>
  ${NAV}
  <nav class="breadcrumb-bar" aria-label="Laluan navigasi">
    <div class="page-wrap">
      <ol class="breadcrumb">
        <li><a href="/">Utama</a></li><li aria-hidden="true">›</li>
        <li><a href="/kategori/">Kategori</a></li><li aria-hidden="true">›</li>
        <li aria-current="page">${esc(m.my)}</li>
      </ol>
    </div>
  </nav>
  <main class="page-wrap" id="main-content" style="padding-bottom:60px">
    <div class="section-header" style="padding-top:40px">
      <h1 class="section-title">${m.icon} ${esc(m.my)}</h1>
      <div class="section-line"></div>
      <span style="font-size:13px;color:var(--txm)">${items.length} amalan</span>
    </div>
    <div class="entry-list">
      ${items.map(item=>`
      <a href="/${item.type}/${item.slug}/" class="entry-card">
        <div class="entry-arabic-preview" lang="ar">${esc((item.arabic||'').slice(0,8))}</div>
        <div class="entry-info">
          <span class="entry-type-badge badge-${esc(item.type)}">${item.type==='zikir'?'Zikir':'Doa'}</span>
          <div class="entry-name">${esc(item.name_my)}</div>
          <div class="entry-rumi">${esc(item.rumi||'')}</div>
        </div>
        <div class="entry-arrow" aria-hidden="true">›</div>
      </a>`).join('')}
    </div>
  </main>
  ${FOOTER}
  <script>${APP_JS}</script>
</body>
</html>`;
}

// ── Sitemap ───────────────────────────────────────────────────────────────────
function buildSitemap(data) {
  const today = new Date().toISOString().split('T')[0];
  const cats  = [...new Set(data.map(d => d.category))];
  const pages = [
    { loc:'/',          freq:'daily',   priority:'1.0', lastmod:today },
    { loc:'/zikir/',    freq:'weekly',  priority:'0.9', lastmod:today },
    { loc:'/doa/',      freq:'weekly',  priority:'0.9', lastmod:today },
    { loc:'/kategori/', freq:'weekly',  priority:'0.8', lastmod:today },
    { loc:'/tentang/',  freq:'monthly', priority:'0.4', lastmod:today },
    ...cats.map(cat => ({ loc:`/kategori/${cat}/`, freq:'weekly', priority:'0.7', lastmod:today })),
    ...data.map(item  => ({ loc:`/${item.type}/${item.slug}/`, freq:'monthly', priority:'0.8',
        lastmod:(item.publishedAt||today).split('T')[0] })),
  ];
  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${pages.map(p=>`  <url>\n    <loc>${SITE_URL}${p.loc}</loc>\n    <lastmod>${p.lastmod}</lastmod>\n    <changefreq>${p.freq}</changefreq>\n    <priority>${p.priority}</priority>\n  </url>`).join('\n')}
</urlset>`;
}

// ── Main ──────────────────────────────────────────────────────────────────────
async function main() {
  console.log('\n🕌 ZikirHarian — Static Build\n' + '─'.repeat(40));

  // Load assets to inline into generated pages
  const appJsPath = path.join(SRC, 'assets', 'app.js');
  const cssPath   = path.join(SRC, 'assets', 'style.css');
  if (fs.existsSync(appJsPath)) {
    APP_JS = fs.readFileSync(appJsPath, 'utf8');
    console.log('✅ app.js loaded for inlining');
  } else {
    console.warn('⚠️  app.js not found in repo root');
  }
  if (fs.existsSync(cssPath)) {
    STYLE_CSS = fs.readFileSync(cssPath, 'utf8');
    console.log('✅ style.css loaded for inlining');
  } else {
    console.warn('⚠️  assets/style.css not found');
  }
  console.log('');

  let raw;
  try {
    process.stdout.write('⏳ Fetching zikir.json...');
    raw = await fetchJSON(JSON_URL);
    console.log(` ✅ ${raw.length} entries`);
  } catch(e) {
    console.error('\n❌ Failed to fetch zikir.json:', e.message);
    process.exit(1);
  }

  const data = raw.filter(d => d.status === 'published');
  console.log(`📦 ${data.length} published entries\n`);

  // Clean dist
  if (fs.existsSync(DIST)) fs.rmSync(DIST, { recursive: true });
  mkdir(DIST);

  // Copy static files
  ['index.html', '_redirects', '_headers', 'robots.txt'].forEach(f => {
    if (fs.existsSync(path.join(SRC, f))) copyRecursive(path.join(SRC, f), path.join(DIST, f));
  });
  copyRecursive(path.join(SRC, 'assets'), path.join(DIST, 'assets'));
  console.log('📋 Static files copied\n');

  // Entry pages
  let built = 0;
  for (const item of data) {
    if (!item.slug || !item.type) continue;
    write(path.join(DIST, item.type, item.slug, 'index.html'), buildEntryPage(item, data));
    built++;
    process.stdout.write(`\r✍️  Entry pages: ${built}/${data.length}`);
  }
  console.log(`\n✅ ${built} entry pages\n`);

  // Listing pages
  write(path.join(DIST, 'zikir',   'index.html'), buildListingPage('zikir', data.filter(d=>d.type==='zikir')));
  write(path.join(DIST, 'doa',     'index.html'), buildListingPage('doa',   data.filter(d=>d.type==='doa')));
  console.log('✅ Listing pages: /zikir/ /doa/');

  // Category pages
  const cats = [...new Set(data.map(d => d.category))];
  cats.forEach(cat => {
    write(path.join(DIST, 'kategori', cat, 'index.html'), buildCategoryPage(cat, data.filter(d=>d.category===cat)));
  });
  console.log(`✅ ${cats.length} category pages`);

  // Sitemap
  write(path.join(DIST, 'sitemap.xml'), buildSitemap(data));
  console.log('✅ sitemap.xml');

  // robots.txt (if not in src)
  if (!fs.existsSync(path.join(SRC, 'robots.txt'))) {
    write(path.join(DIST, 'robots.txt'), `User-agent: *\nAllow: /\nSitemap: ${SITE_URL}/sitemap.xml\n`);
    console.log('✅ robots.txt');
  }

  const total = built + 2 + cats.length;
  console.log(`\n${'─'.repeat(40)}`);
  console.log(`🎉 Done — ${total} pages built in /dist`);
  console.log(`📁 Deploy /dist to Cloudflare Pages\n`);
}

main().catch(err => { console.error('\n❌ Build failed:', err); process.exit(1); });
