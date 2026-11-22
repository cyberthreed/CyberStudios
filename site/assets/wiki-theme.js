/* CyberStudios Wiki theme picker: ☀ Day · ☾ Night · 🫧 Aero.
   The saved mode lives on <html data-theme="…"> (set early by a tiny inline script in <head>).
   body.night stays on for Night so each page's existing night styles keep working.
   Images can swap per mode with data-src-day / data-src-night / data-src-aero (and optional
   data-alt-*). A missing or broken variant falls back to the original picture. */
(() => {
  'use strict';
  const KEY = 'cyberstudios-wiki-theme';
  const LEGACY = 'cyberstudios-wiki-night';
  const THEMES = ['day', 'night', 'aero'];
  const root = document.documentElement;

  const read = () => {
    try {
      const saved = localStorage.getItem(KEY);
      if (THEMES.includes(saved)) return saved;
      return localStorage.getItem(LEGACY) === '1' ? 'night' : 'day';
    } catch (_) { return root.getAttribute('data-theme') || 'day'; }
  };

  const cap = word => word.charAt(0).toUpperCase() + word.slice(1);
  function swapImages(theme) {
    for (const img of document.querySelectorAll('img[data-src-day], img[data-src-night], img[data-src-aero]')) {
      if (!img.dataset.srcOriginal) {
        img.dataset.srcOriginal = img.getAttribute('src') || '';
        img.dataset.altOriginal = img.getAttribute('alt') || '';
      }
      const original = img.dataset.srcOriginal;
      const wanted = img.dataset['src' + cap(theme)] || original;
      const alt = img.dataset['alt' + cap(theme)];
      img.setAttribute('alt', alt || img.dataset.altOriginal);
      if (img.getAttribute('src') === wanted) { img.setAttribute('data-theme-ready', ''); continue; }
      img.removeAttribute('data-theme-ready');
      img.onerror = () => { img.onerror = null; img.setAttribute('src', original); img.setAttribute('alt', img.dataset.altOriginal); img.setAttribute('data-theme-ready', ''); };
      img.onload = () => img.setAttribute('data-theme-ready', '');
      img.setAttribute('src', wanted);
    }
  }

  function apply(theme, save) {
    if (!THEMES.includes(theme)) theme = 'day';
    root.setAttribute('data-theme', theme);
    document.body.classList.toggle('night', theme === 'night');
    for (const button of document.querySelectorAll('[data-theme-choice]')) {
      button.setAttribute('aria-pressed', String(button.dataset.themeChoice === theme));
    }
    swapImages(theme);
    // The tab icon follows the logo (Aero has its own).
    for (const link of document.querySelectorAll('link[data-href-aero]')) {
      if (!link.dataset.hrefOriginal) link.dataset.hrefOriginal = link.getAttribute('href') || '';
      link.setAttribute('href', theme === 'aero' ? link.dataset.hrefAero : link.dataset.hrefOriginal);
    }
    if (save) {
      try {
        localStorage.setItem(KEY, theme);
        localStorage.setItem(LEGACY, theme === 'night' ? '1' : '0');
      } catch (_) { /* the picker still works for this visit */ }
    }
  }

  function start() {
    const theme = read();
    try { if (!localStorage.getItem(KEY)) localStorage.setItem(KEY, theme); } catch (_) {}
    apply(theme, false);
    document.addEventListener('click', event => {
      const button = event.target.closest('[data-theme-choice]');
      if (button) apply(button.dataset.themeChoice, true);
    });
    window.addEventListener('storage', event => { if (event.key === KEY && THEMES.includes(event.newValue)) apply(event.newValue, false); });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start);
  else start();
})();
