/**
 * ZikirHarian — Static Site Generator
 * Run: node build.js
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
  'pagi':          { icon:'🌅', my:'Zikir Pagi',       id:'Zikir Pagi' },
  'petang':        { icon:'🌇', my:'Zikir Petang',      id:'Zikir Petang' },
  'selepas-solat': { icon:'🤲', my:'Selepas Solat',     id:'Setelah Sholat' },
  'tidur':         { icon:'😴', my:'Sebelum Tidur',     id:'Sebelum Tidur' },
  'situasi':       { icon:'🌿', my:'Situasi Harian',    id:'Situasi Sehari-hari' },
  'doa-harian':    { icon:'🙏', my:'Doa Harian',        id:'Doa Sehari-hari' },
  'asmaul-husna':  { icon:'✨', my:'Asmaul Husna',      id:'Asmaul Husna' },
  'peristiwa':     { icon:'🕌', my:'Peristiwa Khas',    id:'Peristiwa Khusus' },
};

let APP_JS    = '';
let STYLE_CSS = '';

// ── Helpers ───────────────────────────────────────────────────────────────────
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
function write(filePath, content) { mkdir(path.dirname(filePath)); fs.writeFileSync(filePath, content, 'utf8'); }
function esc(str='') {
  return String(str).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;');
}
function catLabel(cat, lang='my') {
  const m = CAT_META[cat];
  return m ? (m[lang] || m.my) : cat;
}
function copyRecursive(src, dest) {
  if (!fs.existsSync(src)) return;
  const stat = fs.statSync(src);
  if (stat.isDirectory()) {
    mkdir(dest);
    fs.readdirSync(src).forEach(f => copyRecursive(path.join(src,f), path.join(dest,f)));
  } else {
    mkdir(path.dirname(dest));
    fs.copyFileSync(src, dest);
  }
}

// ── Shared Head ───────────────────────────────────────────────────────────────
function sharedHead({ title, desc, canonical, ogImage='/assets/og-default.jpg', schema=null }) {
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
  <meta property="og:type"        content="website" />
  <meta property="og:site_name"   content="${SITE_NAME}" />
  <meta property="og:title"       content="${esc(title)}" />
  <meta property="og:description" content="${esc(desc)}" />
  <meta property="og:url"         content="${SITE_URL}${canonical}" />
  <meta property="og:image"       content="${SITE_URL}${ogImage}" />
  <meta property="og:image:width"  content="1200" />
  <meta property="og:image:height" content="630" />
  <meta property="og:locale"      content="ms_MY" />
  <meta property="og:locale:alternate" content="id_ID" />
  <meta name="twitter:card"        content="summary_large_image" />
  <meta name="twitter:title"       content="${esc(title)}" />
  <meta name="twitter:description" content="${esc(desc)}" />
  <meta name="twitter:image"       content="${SITE_URL}${ogImage}" />
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
          <p class="footer-desc">Koleksi zikir, doa dan wirid harian terbaik untuk Muslim Malaysia dan Indonesia.</p>
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
        <p class="footer-copy">© ${year} ZikirHarian.com</p>
        <div class="footer-policy">
          <a href="/privasi/">Privasi</a>
          <a href="/syarat/">Syarat Guna</a>
        </div>
      </div>
    </div>
  </footer>`;

// ── Inline Script ─────────────────────────────────────────────────────────────
function inlineScript(extraJS='') {
  return `<script>
${extraJS}
${APP_JS}
</script>`;
}

// ── Entry Page ────────────────────────────────────────────────────────────────
function buildEntryPage(item, allData) {
  const canon  = `/${item.type}/${item.slug}/`;
  const title  = `${item.name_my} — Bacaan, Fadhilat & Terjemahan | ${SITE_NAME}`;
  const desc   = `${item.name_my}: ${(item.fadhilat_my||'').slice(0,140)}. Lengkap dengan bacaan Arab, rumi, terjemahan dan sumber hadis.`;

  const related = allData
    .filter(d => d.category === item.category && d.slug !== item.slug && d.status === 'published')
    .slice(0, 4);

  const schema = {
    "@context": "https://schema.org",
    "@graph": [
      { "@type": "Article", "headline": item.name_my, "description": desc,
        "url": `${SITE_URL}${canon}`, "inLanguage": ["ms","id"],
        "author": { "@type": "Organization", "name": "Zikir Harian" },
        "publisher": { "@type": "Organization", "name": "Zikir Harian",
          "logo": { "@type": "ImageObject", "url": `${SITE_URL}/assets/logo.png` } },
        "datePublished": item.publishedAt||item.createdAt,
        "dateModified":  item.publishedAt||item.createdAt,
        "keywords": (item.tags||[]).join(', ') },
      { "@type": "FAQPage", "mainEntity": [
        { "@type": "Question", "name": `Apakah maksud ${item.name_my}?`,
          "acceptedAnswer": { "@type": "Answer", "text": item.translation_my||'' } },
        { "@type": "Question", "name": `Berapa kali membaca ${item.name_my}?`,
          "acceptedAnswer": { "@type": "Answer", "text": item.bilangan
            ? `${item.name_my} dibaca sebanyak ${item.bilangan} kali.`
            : `Tiada bilangan tetap dinyatakan.` } },
        { "@type": "Question", "name": `Dari mana sumber ${item.name_my}?`,
          "acceptedAnswer": { "@type": "Answer", "text": item.sumber||'Sila rujuk kitab hadis yang muktamad.' } }
      ]},
      { "@type": "BreadcrumbList", "itemListElement": [
        { "@type": "ListItem", "position": 1, "name": "Utama", "item": SITE_URL },
        { "@type": "ListItem", "position": 2, "name": item.type==='zikir'?'Zikir':'Doa', "item": `${SITE_URL}/${item.type}/` },
        { "@type": "ListItem", "position": 3, "name": catLabel(item.category), "item": `${SITE_URL}/kategori/${item.category}/` },
        { "@type": "ListItem", "position": 4, "name": item.name_my, "item": `${SITE_URL}${canon}` }
      ]}
    ]
  };

  const relatedHTML = related.length ? `
    <section class="related-section" aria-labelledby="related-heading">
      <div class="section-header">
        <h2 class="section-title" id="related-heading">Amalan Berkaitan</h2>
        <div class="section-line"></div>
      </div>
      <div class="entry-list">
        ${related.map(r=>`
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

  const i18nScript = `
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
  }
};`;

  return `<!DOCTYPE html>
<html lang="ms" dir="ltr" translate="no">
<head>${sharedHead({ title, desc, canonical: canon, schema })}</head>
<body>
  ${NAV}
  <nav class="breadcrumb-bar" aria-label="Laluan navigasi">
    <div class="page-wrap">
      <ol class="breadcrumb">
        <li><a href="/">Utama</a></li><li aria-hidden="true">›</li>
        <li><a href="/${item.type}/">${item.type==='zikir'?'Zikir':'Doa'}</a></li><li aria-hidden="true">›</li>
        <li><a href="/kategori/${esc(item.category)}/">${esc(catLabel(item.category))}</a></li><li aria-hidden="true">›</li>
        <li aria-current="page" id="breadcrumb-title">${esc(item.name_my)}</li>
      </ol>
    </div>
  </nav>
  <main class="page-wrap entry-main" id="main-content">
    <article>
      <header class="entry-header">
        <span class="entry-type-badge badge-${esc(item.type)}">${item.type==='zikir'?'Zikir':'Doa'}</span>
        <h1 class="entry-title" id="entryTitle">${esc(item.name_my)}</h1>
        <p class="entry-subtitle" id="entrySubtitle">${item.bilangan?`Dibaca ${item.bilangan} kali`:''}</p>
      </header>
      <div class="arabic-block" role="region" aria-label="Bacaan Arab">
        <div class="arabic-text" lang="ar" dir="rtl" id="arabicText">${esc(item.arabic||'')}</div>
        <div class="rumi-text" id="rumiText">${esc(item.rumi||'')}</div>
        <div class="translation-text" id="transText">${esc(item.translation_my||'')}</div>
        ${item.bilangan?`<span class="count-pill" id="countPill">× ${item.bilangan} kali</span>`:''}
      </div>
      <section class="answer-section">
        <div class="answer-block">
          <div class="answer-q">Apakah fadhilat ${esc(item.name_my)}?</div>
          <div class="answer-a" id="fadhilatText">${esc(item.fadhilat_my||'')}</div>
        </div>
        ${item.bilangan?`
        <div class="answer-block">
          <div class="answer-q">Berapa kali membaca ${esc(item.name_my)}?</div>
          <div class="answer-a" id="countAnswer">${esc(item.name_my)} dibaca sebanyak <strong>${item.bilangan} kali</strong>${item.category==='selepas-solat'?' selepas setiap solat fardu':''}.</div>
        </div>`:''}
        <div class="answer-block">
          <div class="answer-q">Dari mana sumber ${esc(item.name_my)}?</div>
          <div class="answer-a" id="sumberAnswer">${esc(item.sumber||'')}</div>
        </div>
      </section>
      ${item.sumber?`<div class="source-block"><span class="source-icon">📖</span><span id="sumberText">${esc(item.sumber)}</span></div>`:''}
      ${tagsHTML}
      <div class="ornament" aria-hidden="true">
        <div class="ornament-line"></div><div class="ornament-diamond"></div><div class="ornament-line"></div>
      </div>
      ${relatedHTML}
    </article>
  </main>
  ${FOOTER}
  <div class="share-float" aria-label="Kongsi halaman ini">
    <a class="share-btn share-btn-wa" id="shareWa" href="#" target="_blank" rel="noopener" aria-label="Kongsi di WhatsApp">
      <svg width="24" height="24" viewBox="0 0 24 24" fill="white" xmlns="http://www.w3.org/2000/svg"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
    </a>
    <a class="share-btn share-btn-tg" id="shareTg" href="#" target="_blank" rel="noopener" aria-label="Kongsi di Telegram">
      <svg width="22" height="22" viewBox="0 0 24 24" fill="white" xmlns="http://www.w3.org/2000/svg"><path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/></svg>
    </a>
  </div>
  ${inlineScript(i18nScript + `
(function(){
  const url   = encodeURIComponent(window.location.href);
  const title = encodeURIComponent(document.title);
  const wa = document.getElementById('shareWa');
  const tg = document.getElementById('shareTg');
  if (wa) wa.href = 'https://wa.me/?text=' + title + '%0A' + url;
  if (tg) tg.href = 'https://t.me/share/url?url=' + url + '&text=' + title;
})();
`)}
</body>
</html>`;
}

// ── Listing Page ──────────────────────────────────────────────────────────────
function buildListingPage(type, items) {
  const isZikir = type === 'zikir';
  const title   = isZikir ? `Semua Zikir Harian — Koleksi Lengkap | ${SITE_NAME}` : `Semua Doa Harian — Koleksi Lengkap | ${SITE_NAME}`;
  const desc    = `Koleksi lengkap ${items.length} ${isZikir?'zikir':'doa'} harian dengan bacaan Arab, rumi, terjemahan dan fadhilat.`;
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
  ${inlineScript()}
</body>
</html>`;
}

// ── Category Page ─────────────────────────────────────────────────────────────
function buildCategoryPage(cat, items) {
  const m      = CAT_META[cat] || { icon:'🌿', my:cat, id:cat };
  const canon  = `/kategori/${cat}/`;
  const title  = `${m.my} — Zikir & Doa | ${SITE_NAME}`;
  const desc   = `Koleksi ${m.my.toLowerCase()} lengkap dengan bacaan Arab, rumi, terjemahan dan fadhilat. ${items.length} amalan tersedia.`;
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
  ${inlineScript()}
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

// ── Static Page Shell ─────────────────────────────────────────────────────────
function staticPage({ title, desc, canonical, breadcrumb, content }) {
  return `<!DOCTYPE html>
<html lang="ms" dir="ltr" translate="no">
<head>
  <meta charset="UTF-8" /><meta name="google" content="notranslate" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${esc(title)}</title>
  <meta name="description" content="${esc(desc)}" />
  <link rel="canonical" href="${SITE_URL}${canonical}" />
  <meta property="og:title" content="${esc(title)}" />
  <meta property="og:description" content="${esc(desc)}" />
  <meta property="og:url" content="${SITE_URL}${canonical}" />
  <meta property="og:image" content="${SITE_URL}/assets/og-default.jpg" />
  <link rel="icon" type="image/x-icon" href="/assets/favicon.ico" />
  <link rel="icon" type="image/png" sizes="32x32" href="/assets/favicon-32x32.png" />
  <link rel="apple-touch-icon" sizes="180x180" href="/assets/apple-touch-icon.png" />
  <link rel="manifest" href="/assets/site.webmanifest" />
  <meta name="theme-color" content="#92400e" media="(prefers-color-scheme: light)" />
  <meta name="theme-color" content="#1f1e1c" media="(prefers-color-scheme: dark)" />
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  ${STYLE_CSS ? `<style>${STYLE_CSS}</style>` : '<link rel="stylesheet" href="/assets/style.css" />'}
</head>
<body>
  ${NAV}
  <nav class="breadcrumb-bar" aria-label="Laluan navigasi">
    <div class="page-wrap">
      <ol class="breadcrumb">
        <li><a href="/">Utama</a></li><li aria-hidden="true">›</li>
        <li aria-current="page">${breadcrumb}</li>
      </ol>
    </div>
  </nav>
  <main class="page-wrap" id="main-content" style="max-width:720px;padding-bottom:60px">
    <div style="padding-top:40px">${content}</div>
  </main>
  ${FOOTER}
  ${inlineScript()}
</body>
</html>`;
}

function h1(text) {
  return `<h1 style="font-family:Georgia,serif;font-size:28px;font-weight:700;color:var(--tx1);margin-bottom:8px">${text}</h1>
    <div style="width:48px;height:3px;background:var(--acc);border-radius:2px;margin-bottom:32px"></div>`;
}
function h2(text) {
  return `<h2 style="font-family:Georgia,serif;font-size:18px;font-weight:700;color:var(--tx1);margin:28px 0 10px">${text}</h2>`;
}
function p(text) { return `<p style="margin-bottom:16px">${text}</p>`; }

function buildTentang() {
  return staticPage({
    title: 'Tentang Kami — ZikirHarian.com',
    desc:  'ZikirHarian.com menyediakan koleksi zikir, doa dan wirid harian untuk Muslim Malaysia dan Indonesia.',
    canonical: '/tentang/',
    breadcrumb: 'Tentang',
    content: `
    ${h1('Tentang ZikirHarian')}
    <div style="font-size:15px;color:var(--tx2);line-height:1.85">
      ${p('<strong>ZikirHarian.com</strong> adalah platform koleksi zikir, doa dan wirid harian untuk Muslim Malaysia dan Indonesia. Kami menyediakan bacaan yang lengkap — teks Arab, rumi, terjemahan dan fadhilat — dalam satu tempat yang mudah diakses.')}
      ${h2('Misi Kami')}
      ${p('Memudahkan umat Islam untuk mengamalkan zikir dan doa harian dengan betul dan istiqamah. Kami percaya bahawa akses kepada ilmu agama yang sahih patut mudah, cepat dan percuma untuk semua orang.')}
      ${h2('Sumber Kandungan')}
      ${p('Semua kandungan di ZikirHarian.com bersumberkan al-Quran, hadis-hadis sahih dan kitab-kitab muktamad seperti Hisnul Muslim, Riyadhus Solihin dan sumber ulama yang dipercayai. Setiap entri disertakan sumber rujukan bagi memudahkan pengesahan.')}
      ${h2('Hubungi Kami')}
      ${p('Ada cadangan kandungan atau ingin melaporkan kesilapan? Hubungi kami melalui emel di <a href="mailto:hello@zikirharian.com" style="color:var(--acc)">hello@zikirharian.com</a>.')}
      <div style="background:var(--bg2);border:1px solid var(--border2);border-radius:12px;padding:24px;margin-top:8px;text-align:center">
        <div style="font-size:28px;margin-bottom:8px">🤲</div>
        <div style="font-family:Georgia,serif;font-size:16px;font-weight:600;color:var(--tx1);margin-bottom:6px">Doa Kami</div>
        <p style="font-size:14px;color:var(--tx3);line-height:1.7;margin:0">Semoga laman ini menjadi sebab bertambahnya amal soleh pengguna, dan menjadi sadaqah jariah bagi semua yang membantu menyebarkannya. Amin.</p>
      </div>
    </div>`
  });
}

function buildPrivasi() {
  return staticPage({
    title: 'Dasar Privasi — ZikirHarian.com',
    desc:  'Dasar privasi ZikirHarian.com. Ketahui bagaimana kami menguruskan maklumat pengguna.',
    canonical: '/privasi/',
    breadcrumb: 'Dasar Privasi',
    content: `
    ${h1('Dasar Privasi')}
    <p style="font-size:13px;color:var(--tx3);margin-bottom:24px;margin-top:-20px">Dikemaskini: 14 Mac 2026</p>
    <div style="font-size:15px;color:var(--tx2);line-height:1.85">
      ${h2('1. Maklumat Yang Dikumpulkan')}
      ${p('ZikirHarian.com adalah laman statik. Kami <strong>tidak mengumpulkan</strong> sebarang maklumat peribadi seperti nama, emel atau nombor telefon. Kami tidak memerlukan pendaftaran akaun.')}
      ${p('Pilihan bahasa dan tema anda disimpan secara tempatan pada peranti anda sahaja menggunakan <em>localStorage</em> dan tidak dihantar ke mana-mana pelayan.')}
      ${h2('2. Kuki dan Penjejakan')}
      ${p('Laman ini mungkin menggunakan perkhidmatan pihak ketiga seperti Google Analytics untuk memahami corak penggunaan secara agregat. Data ini tidak boleh dikenal pasti secara peribadi.')}
      ${p('Jika anda tidak mahu data anda dikumpulkan oleh Google Analytics, anda boleh memasang <a href="https://tools.google.com/dlpage/gaoptout" target="_blank" rel="noopener" style="color:var(--acc)">Google Analytics Opt-out Add-on</a>.')}
      ${h2('3. Pengiklanan')}
      ${p('Laman ini mungkin memaparkan iklan melalui Google AdSense. Google mungkin menggunakan kuki untuk memaparkan iklan berdasarkan lawatan anda. Anda boleh menyahaktifkan ini melalui <a href="https://www.google.com/settings/ads" target="_blank" rel="noopener" style="color:var(--acc)">Tetapan Iklan Google</a>.')}
      ${h2('4. Pautan Luar')}
      ${p('Laman ini mungkin mengandungi pautan ke laman web pihak ketiga. Kami tidak bertanggungjawab ke atas dasar privasi atau kandungan laman-laman tersebut.')}
      ${h2('5. Hubungi Kami')}
      ${p('Sekiranya anda mempunyai pertanyaan berkaitan dasar privasi ini, sila hubungi kami di <a href="mailto:hello@zikirharian.com" style="color:var(--acc)">hello@zikirharian.com</a>.')}
    </div>`
  });
}

function buildSyarat() {
  return staticPage({
    title: 'Syarat Penggunaan — ZikirHarian.com',
    desc:  'Syarat dan terma penggunaan laman ZikirHarian.com.',
    canonical: '/syarat/',
    breadcrumb: 'Syarat Penggunaan',
    content: `
    ${h1('Syarat Penggunaan')}
    <p style="font-size:13px;color:var(--tx3);margin-bottom:24px;margin-top:-20px">Dikemaskini: 14 Mac 2026</p>
    <div style="font-size:15px;color:var(--tx2);line-height:1.85">
      ${h2('1. Penerimaan Syarat')}
      ${p('Dengan menggunakan laman ZikirHarian.com, anda bersetuju untuk mematuhi syarat-syarat penggunaan ini. Sekiranya anda tidak bersetuju, sila hentikan penggunaan laman ini.')}
      ${h2('2. Penggunaan Kandungan')}
      ${p('Kandungan di ZikirHarian.com boleh digunakan untuk tujuan peribadi dan pendidikan. Penggunaan semula secara komersial tanpa kebenaran bertulis adalah dilarang.')}
      ${p('Anda dialu-alukan untuk berkongsi pautan ke halaman kami. Sila nyatakan sumber apabila menggunakan kandungan daripada laman ini.')}
      ${h2('3. Ketepatan Maklumat')}
      ${p('Kami berusaha memastikan semua kandungan bersumberkan rujukan yang sahih. Walau bagaimanapun, kami mengesyorkan agar pengguna merujuk ulama atau pakar agama yang berkelayakan untuk pengesahan lanjut.')}
      ${h2('4. Had Tanggungjawab')}
      ${p('ZikirHarian.com disediakan "seadanya" tanpa sebarang jaminan. Kami tidak bertanggungjawab atas sebarang kerugian atau kerosakan yang timbul daripada penggunaan laman ini.')}
      ${h2('5. Perubahan Syarat')}
      ${p('Kami berhak mengubah syarat penggunaan ini pada bila-bila masa. Perubahan akan dikuatkuasakan serta-merta selepas disiarkan di laman ini.')}
      ${h2('6. Hubungi Kami')}
      ${p('Untuk sebarang pertanyaan, hubungi kami di <a href="mailto:hello@zikirharian.com" style="color:var(--acc)">hello@zikirharian.com</a>.')}
    </div>`
  });
}

// ── Main ──────────────────────────────────────────────────────────────────────
async function main() {
  console.log('\n🕌 ZikirHarian — Static Build\n' + '─'.repeat(40));

  // Load assets to inline
  const appJsPath = path.join(SRC, 'assets', 'app.js');
  const cssPath   = path.join(SRC, 'assets', 'style.css');
  if (fs.existsSync(appJsPath)) {
    APP_JS = fs.readFileSync(appJsPath, 'utf8');
    console.log('✅ app.js loaded');
  } else {
    console.warn('⚠️  assets/app.js not found');
  }
  if (fs.existsSync(cssPath)) {
    STYLE_CSS = fs.readFileSync(cssPath, 'utf8');
    console.log('✅ style.css loaded');
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

  if (fs.existsSync(DIST)) fs.rmSync(DIST, { recursive: true });
  mkdir(DIST);

  ['index.html', '_redirects', '_headers', 'robots.txt'].forEach(f => {
    if (fs.existsSync(path.join(SRC, f))) copyRecursive(path.join(SRC, f), path.join(DIST, f));
  });
  copyRecursive(path.join(SRC, 'assets'), path.join(DIST, 'assets'));
  // Copy static pages
  ['tentang', 'privasi', 'syarat'].forEach(p => {
    const src = path.join(SRC, p);
    if (fs.existsSync(src)) {
      copyRecursive(src, path.join(DIST, p));
      console.log(`   ✅ /${p}/`);
    }
  });
  console.log('📋 Static files copied\n');

  let built = 0;
  for (const item of data) {
    if (!item.slug || !item.type) continue;
    write(path.join(DIST, item.type, item.slug, 'index.html'), buildEntryPage(item, data));
    built++;
    process.stdout.write(`\r✍️  Entry pages: ${built}/${data.length}`);
  }
  console.log(`\n✅ ${built} entry pages\n`);

  write(path.join(DIST, 'zikir', 'index.html'), buildListingPage('zikir', data.filter(d=>d.type==='zikir')));
  write(path.join(DIST, 'doa',   'index.html'), buildListingPage('doa',   data.filter(d=>d.type==='doa')));
  console.log('✅ Listing pages: /zikir/ /doa/');

  const cats = [...new Set(data.map(d => d.category))];
  cats.forEach(cat => {
    write(path.join(DIST, 'kategori', cat, 'index.html'), buildCategoryPage(cat, data.filter(d=>d.category===cat)));
  });
  console.log(`✅ ${cats.length} category pages`);

  write(path.join(DIST, 'sitemap.xml'), buildSitemap(data));
  console.log('✅ sitemap.xml');

  if (!fs.existsSync(path.join(SRC, 'robots.txt'))) {
    write(path.join(DIST, 'robots.txt'), `User-agent: *\nAllow: /\nSitemap: ${SITE_URL}/sitemap.xml\n`);
    console.log('✅ robots.txt');
  }

  // Static pages
  write(path.join(DIST, 'tentang', 'index.html'), buildTentang());
  write(path.join(DIST, 'privasi', 'index.html'), buildPrivasi());
  write(path.join(DIST, 'syarat',  'index.html'), buildSyarat());
  console.log('✅ Static pages: /tentang/ /privasi/ /syarat/');

  const total = built + 2 + cats.length + 3;
  console.log(`\n${'─'.repeat(40)}`);
  console.log(`🎉 Done — ${total} pages built in /dist\n`);
}

main().catch(err => { console.error('\n❌ Build failed:', err); process.exit(1); });
