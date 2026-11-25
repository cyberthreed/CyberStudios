/* CyberStudios Wiki search: the "Search CyberStudios Wiki" box in every page header.
   Searches assets/search-index.json (pages, sections and projects; rebuilt by tools/build-wiki-search.py).
   Keyboard: / focuses the box, ↑↓ pick a result, Enter opens it, Escape closes. */
(() => {
  'use strict';
  const script = document.currentScript;
  const base = new URL('..', script.src);           // the site root (script lives in assets/)
  const form = document.querySelector('.wiki-search');
  if (!form) return;
  const input = form.querySelector('input');
  const list = form.querySelector('.wiki-search-results');
  let index = null, items = [], active = -1;

  const load = () => index || (index = fetch(new URL('assets/search-index.json?v=1', base)).then(r => r.json()).catch(() => []));
  const words = text => text.toLowerCase().normalize('NFKD').replace(/[^\w\s.#+-]/g, ' ').split(/\s+/).filter(Boolean);
  const label = { page: 'page', section: 'section', project: 'project' };

  function score(entry, terms) {
    const title = entry.t.toLowerCase(), hay = (entry.t + ' ' + entry.w + ' ' + entry.p).toLowerCase();
    let total = 0;
    for (const term of terms) {
      if (!hay.includes(term)) return 0;
      total += title.startsWith(term) ? 6 : title.includes(term) ? 4 : 1;
    }
    return total + (entry.k === 'page' ? 2 : entry.k === 'project' ? 1 : 0);
  }

  function render(results, query) {
    list.replaceChildren();
    active = -1;
    if (!query) { list.hidden = true; input.setAttribute('aria-expanded', 'false'); return; }
    if (!results.length) {
      const empty = document.createElement('li'); empty.className = 'wiki-search-empty'; empty.textContent = 'Nothing found. Try another word ♡';
      list.append(empty);
    }
    results.forEach((entry, i) => {
      const li = document.createElement('li');
      li.setAttribute('role', 'option'); li.id = 'wiki-search-opt-' + i;
      const a = document.createElement('a');
      a.href = /^(https?:|mailto:)/.test(entry.u) ? entry.u : new URL(entry.u, base).href;
      const title = document.createElement('strong'); title.textContent = entry.t;
      const meta = document.createElement('small'); meta.textContent = label[entry.k] + (entry.p && entry.k !== 'page' ? ' · ' + entry.p : '');
      a.append(title, meta); li.append(a); list.append(li);
    });
    items = [...list.querySelectorAll('a')];
    list.hidden = false; input.setAttribute('aria-expanded', 'true');
  }

  async function search() {
    const query = input.value.trim();
    const terms = words(query);
    const all = await load();
    if (query !== input.value.trim()) return;
    render(terms.length ? all.map(e => [score(e, terms), e]).filter(([s]) => s > 0).sort((a, b) => b[0] - a[0]).slice(0, 8).map(([, e]) => e) : [], query);
  }

  function move(step) {
    if (!items.length) return;
    active = (active + step + items.length) % items.length;
    items.forEach((a, i) => a.parentElement.classList.toggle('is-active', i === active));
    input.setAttribute('aria-activedescendant', 'wiki-search-opt-' + active);
    items[active].scrollIntoView({ block: 'nearest' });
  }

  input.addEventListener('focus', load, { once: true });
  input.addEventListener('input', search);
  input.addEventListener('keydown', event => {
    if (event.key === 'ArrowDown') { event.preventDefault(); move(1); }
    else if (event.key === 'ArrowUp') { event.preventDefault(); move(-1); }
    else if (event.key === 'Escape') { input.value = ''; render([], ''); }
  });
  form.addEventListener('submit', event => {
    event.preventDefault();
    const target = items[active >= 0 ? active : 0];
    if (target) window.location.href = target.href;
  });
  document.addEventListener('click', event => { if (!form.contains(event.target)) { list.hidden = true; input.setAttribute('aria-expanded', 'false'); } });
  document.addEventListener('keydown', event => {
    if (event.key === '/' && !event.ctrlKey && !event.metaKey && !event.altKey && !['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement.tagName)) {
      event.preventDefault(); input.focus();
    }
  });
})();
