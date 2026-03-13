/**
 * ZikirHarian — app.js
 * Shared across all pages: theme toggle, language toggle, mobile nav
 * Entry-specific i18n is handled via ENTRY_I18N baked into each page by build.js
 */
(function() {
  'use strict';

  // ── Theme ──────────────────────────────────────────────────────────────────
  const savedTheme = localStorage.getItem('zh_theme') ||
    (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');

  function applyTheme(t) {
    document.documentElement.setAttribute('data-theme', t);
    const btn = document.getElementById('themeToggle');
    if (btn) btn.textContent = t === 'dark' ? '🌙' : '☀️';
    localStorage.setItem('zh_theme', t);
  }

  applyTheme(savedTheme);

  document.getElementById('themeToggle')?.addEventListener('click', function() {
    const current = document.documentElement.getAttribute('data-theme');
    applyTheme(current === 'dark' ? 'light' : 'dark');
  });

  // ── Language ───────────────────────────────────────────────────────────────
  const savedLang = localStorage.getItem('zh_lang') || detectLang();

  function detectLang() {
    const nav = (navigator.language || 'ms').split('-')[0].toLowerCase();
    if (nav === 'id') return 'id';
    if (nav === 'en') return 'en';
    return 'my';
  }

  function applyLang(lang) {
    localStorage.setItem('zh_lang', lang);
    document.documentElement.lang = lang === 'my' ? 'ms' : lang;

    // Update lang buttons
    document.querySelectorAll('.lang-btn').forEach(btn => {
      const active = btn.getAttribute('data-lang') === lang;
      btn.classList.toggle('active', active);
      btn.setAttribute('aria-pressed', String(active));
    });

    // Entry page: swap i18n content if ENTRY_I18N is defined (baked in by build.js)
    if (typeof ENTRY_I18N !== 'undefined' && ENTRY_I18N[lang]) {
      const d = ENTRY_I18N[lang];
      const set = (id, val) => { const el = document.getElementById(id); if (el && val) el.textContent = val; };
      set('entryTitle',   d.title);
      set('entrySubtitle', d.subtitle);
      set('arabicText',   d.arabic);
      set('rumiText',     d.rumi);
      set('transText',    d.trans);
      set('fadhilatText', d.fadhilat);
      set('sumberText',   d.sumber);
      set('featuredCount', d.count);
    }

    // Update html lang attribute direction
    document.documentElement.dir = 'ltr'; // Arabic text has dir=rtl inline
  }

  applyLang(savedLang);

  document.querySelectorAll('.lang-btn').forEach(btn => {
    btn.addEventListener('click', function() {
      applyLang(this.getAttribute('data-lang'));
    });
  });

  // ── Mobile Nav ─────────────────────────────────────────────────────────────
  const mobileNav  = document.getElementById('mobileNav');
  const menuBtn    = document.getElementById('menuBtn');
  const navClose   = document.getElementById('navClose');
  const navOverlay = document.getElementById('navOverlay');

  function openNav() {
    mobileNav?.classList.add('open');
    menuBtn?.setAttribute('aria-expanded', 'true');
    document.body.style.overflow = 'hidden';
  }

  function closeNav() {
    mobileNav?.classList.remove('open');
    menuBtn?.setAttribute('aria-expanded', 'false');
    document.body.style.overflow = '';
  }

  menuBtn?.addEventListener('click', openNav);
  navClose?.addEventListener('click', closeNav);
  navOverlay?.addEventListener('click', closeNav);

  // Close on Escape
  document.addEventListener('keydown', e => { if (e.key === 'Escape') closeNav(); });

})();
