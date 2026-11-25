"""Builds site/assets/search-index.json for the wiki's "Search CyberStudios Wiki" box.
Run after changing wiki pages:  python tools/build-wiki-search.py
Indexes every page title, section heading (with an id) and project card."""
import html, json, os, re

ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'site')
SKIP = ('elsewhere-accounts/data-deletion.html', 'elsewhere-accounts/license.html')

def text(fragment):
    return re.sub(r'\s+', ' ', html.unescape(re.sub(r'<[^>]+>', ' ', fragment))).strip()

def resolve(page_dir, href):
    if re.match(r'^(https?:|mailto:)', href): return href
    if href.startswith('#'): return None
    path = os.path.normpath(os.path.join(page_dir, href.split('#')[0])).replace(os.sep, '/')
    anchor = ('#' + href.split('#')[1]) if '#' in href else ''
    return ('' if path == '.' else path.rstrip('/') + ('/' if href.split('#')[0].endswith('/') else '')) + anchor

entries, seen = [], set()
def add(title, url, kind, words='', where=''):
    key = (re.sub(r'[^a-z0-9]+', '', title.lower()), url.split('#')[0], kind)
    if title and url and key not in seen:
        seen.add(key)
        entries.append({'t': title[:90], 'u': url, 'k': kind, 'w': words[:240], 'p': where})

for folder, _, files in os.walk(ROOT):
    for f in sorted(files):
        if not f.endswith('.html'): continue
        rel = os.path.relpath(os.path.join(folder, f), ROOT).replace(os.sep, '/')
        if rel in SKIP: continue
        s = open(os.path.join(folder, f), encoding='utf-8').read()
        url = rel[:-len('index.html')] if rel.endswith('index.html') else rel
        page_dir = os.path.dirname(rel)
        title = text(re.search(r'<title>(.*?)</title>', s, re.S).group(1)).replace(' ♡ CyberStudios Wiki', '')
        if rel == 'index.html': title = 'Home'
        desc = re.search(r'<meta name="description" content="([^"]*)"', s)
        add(title, url or './', 'page', html.unescape(desc.group(1)) if desc else '')
        for m in re.finditer(r'<h2[^>]*id="([^"]+)"[^>]*>(.*?)</h2>', s, re.S):
            add(text(m.group(2)), (url or './') + '#' + m.group(1), 'section', '', title)
        for m in re.finditer(r'<section[^>]*id="([^"]+)"[^>]*>.*?<h2[^>]*>(.*?)</h2>', s, re.S):
            add(text(m.group(2)), (url or './') + '#' + m.group(1), 'section', '', title)
        for m in re.finditer(r'<article class="project[^"]*"[^>]*data-search="([^"]*)"(.*?)</article>', s, re.S):
            name = re.search(r'<h3[^>]*>(.*?)</h3>', m.group(2), re.S)
            link = re.search(r'href="([^"]+)"', m.group(2))
            target = resolve(page_dir, link.group(1)) if link else None
            if name:
                add(text(name.group(1)), target or (url or './'), 'project', m.group(1) + ' ' + text(m.group(2))[:160], title)

json.dump(entries, open(os.path.join(ROOT, 'assets', 'search-index.json'), 'w', encoding='utf-8'), ensure_ascii=False, separators=(',', ':'))
print(len(entries), 'entries')
