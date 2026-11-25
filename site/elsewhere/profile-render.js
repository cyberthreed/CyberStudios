// Elsewhere Profiles: the ONE renderer used by the Messenger profile window and the public web page.
// No imports and no framework: this file is compiled from Elsewhere Messenger (src/profiles/profileRender.ts) for the website.
// Everything the creator types is shown as text (never HTML), links must be https, and images must be
// https or small data: images. Data arrives already filtered by the server for this viewer.
export const FONTS = ['Tahoma', 'Verdana', 'Trebuchet MS', 'Georgia', 'Courier New', 'Comic Sans MS', 'Segoe UI', 'Lucida Console', 'Arial'];
export const PATTERNS = ['elsewhaero', 'none', 'stars', 'hearts', 'grid', 'dots', 'checker', 'stripes', 'sparkles'];
export const INTEREST_LABELS = ['General', 'Music', 'Movies', 'Television', 'Books', 'Games', 'Heroes'];
export const LAYOUT_DEFAULTS = {
    classic: { bg: '#cfe6ff', panel: '#ffffff', ink: '#16233a', accent: '#ff5fa2', heading: '#3a7bd5', font: 'Verdana', pattern: 'stars' },
    original: { bg: '#7cc9f3', panel: '#f4fbff', ink: '#0b2a4a', accent: '#62c23d', heading: '#0a6fbd', font: 'Segoe UI', pattern: 'elsewhaero' },
};
export function blankDoc(layout = 'original') {
    return {
        v: 1, layout, theme: { ...LAYOUT_DEFAULTS[layout] }, headline: '', mood: '', status: '', about: '',
        interests: INTEREST_LABELS.slice(0, 4).map(label => ({ label, value: '' })),
        music: { title: '', artist: '', url: '' }, links: [], topFriends: [], avatar: '', banner: '',
        sections: { about: true, interests: true, music: true, bulletins: true, friends: true, guestbook: true, links: true },
        privateCard: { message: '' },
    };
}
const COLOR = /^#[0-9a-f]{6}$/i;
const str = (value, max) => typeof value === 'string' ? value.slice(0, max) : '';
const color = (value, fallback) => typeof value === 'string' && COLOR.test(value) ? value : fallback;
export function safeUrl(value) {
    if (typeof value !== 'string')
        return '';
    try {
        const url = new URL(value.trim());
        return url.protocol === 'https:' ? url.href : '';
    }
    catch {
        return '';
    }
}
export function safeImage(value) {
    if (typeof value !== 'string')
        return '';
    if (/^data:image\/(png|jpeg|gif|webp);base64,[a-z0-9+/=]+$/i.test(value) && value.length < 420000)
        return value;
    return safeUrl(value);
}
/** Reads any stored doc into a complete, safe ProfileDoc (unknown fields dropped, bad values defaulted). */
export function normalizeDoc(raw) {
    const d = (raw && typeof raw === 'object' ? raw : {});
    const layout = d.layout === 'classic' ? 'classic' : 'original';
    const base = blankDoc(layout);
    const t = (d.theme && typeof d.theme === 'object' ? d.theme : {});
    const s = (d.sections && typeof d.sections === 'object' ? d.sections : {});
    const m = (d.music && typeof d.music === 'object' ? d.music : {});
    const card = (d.privateCard && typeof d.privateCard === 'object' ? d.privateCard : {});
    return {
        v: 1, layout,
        theme: {
            bg: color(t.bg, base.theme.bg), panel: color(t.panel, base.theme.panel), ink: color(t.ink, base.theme.ink),
            accent: color(t.accent, base.theme.accent), heading: color(t.heading, base.theme.heading),
            font: FONTS.includes(t.font) ? t.font : base.theme.font,
            pattern: PATTERNS.includes(t.pattern) ? t.pattern : base.theme.pattern,
        },
        headline: str(d.headline, 120), mood: str(d.mood, 60), status: str(d.status, 160), about: str(d.about, 5000),
        interests: Array.isArray(d.interests) ? d.interests.slice(0, 10).map(row => ({ label: str(row?.label, 30), value: str(row?.value, 600) })) : base.interests,
        music: { title: str(m.title, 120), artist: str(m.artist, 120), url: safeUrl(m.url) },
        links: Array.isArray(d.links) ? d.links.slice(0, 12).map(row => ({ label: str(row?.label, 60), url: safeUrl(row?.url) })).filter(link => link.url) : [],
        topFriends: Array.isArray(d.topFriends) ? d.topFriends.filter((id) => typeof id === 'string').slice(0, 12) : [],
        avatar: safeImage(d.avatar), banner: safeImage(d.banner),
        sections: Object.fromEntries(Object.keys(base.sections).map(key => [key, s[key] !== false])),
        privateCard: { message: str(card.message, 300) },
    };
}
function h(tag, attrs = {}, ...children) {
    const el = document.createElement(tag);
    for (const [key, value] of Object.entries(attrs))
        if (value !== undefined)
            el.setAttribute(key, value);
    for (const child of children)
        if (child)
            el.append(child);
    return el;
}
function paragraphs(text) {
    const box = h('div', { class: 'ep-text' });
    for (const part of text.split(/\n{2,}/))
        if (part.trim())
            box.append(h('p', {}, part.trim()));
    return box;
}
const when = (iso) => { const d = new Date(iso); return isNaN(d.getTime()) ? '' : d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }); };
function initials(name) { return (name.trim().split(/\s+/).map(w => w[0]).join('').slice(0, 2) || '?').toUpperCase(); }
function avatarEl(src, name, cls) {
    return src ? h('img', { class: cls, src, alt: `${name}'s picture`, loading: 'lazy' }) : h('div', { class: cls + ' ep-avatar-blank', 'aria-hidden': 'true' }, initials(name));
}
function box(title, cls, ...children) {
    return h('section', { class: 'ep-box ' + cls }, h('h2', { class: 'ep-box-title' }, title), ...children);
}
function friendLink(friend, actions) {
    const a = h('a', { class: 'ep-friend', href: actions.profileHref(friend.handle) }, h('span', { class: 'ep-friend-pic', 'aria-hidden': 'true' }, initials(friend.display_name)), h('span', {}, friend.display_name), h('small', {}, '@' + friend.handle));
    if (actions.onOpenProfile)
        a.addEventListener('click', event => { event.preventDefault(); actions.onOpenProfile(friend.handle); });
    return a;
}
function composer(placeholder, button, send, max) {
    const area = h('textarea', { placeholder, maxlength: String(max), rows: '3', 'aria-label': placeholder });
    const go = h('button', { type: 'submit', class: 'ep-button' }, button);
    const note = h('p', { class: 'ep-note', role: 'status' });
    const form = h('form', { class: 'ep-compose' }, area, h('div', { class: 'ep-compose-row' }, note, go));
    form.addEventListener('submit', async (event) => {
        event.preventDefault();
        const body = area.value.trim();
        if (!body)
            return;
        go.disabled = true;
        note.textContent = '';
        try {
            await send(body);
            area.value = '';
        }
        catch (error) {
            note.textContent = error instanceof Error ? error.message : String(error);
        }
        finally {
            go.disabled = false;
        }
    });
    return form;
}
// ---------- Modules ----------
function guestbookBox(data, actions) {
    const entries = data.guestbook || [];
    const list = h('ol', { class: 'ep-guestbook' });
    for (const entry of entries) {
        const item = h('li', {}, h('div', { class: 'ep-entry-head' }, friendLink(entry, actions), h('time', {}, when(entry.created_at))), paragraphs(entry.body));
        if ((data.access === 'owner' || entry.mine) && actions.onRemoveEntry) {
            const remove = h('button', { type: 'button', class: 'ep-link-button' }, 'remove');
            remove.addEventListener('click', () => { void actions.onRemoveEntry(entry.id); });
            item.querySelector('.ep-entry-head').append(remove);
        }
        list.append(item);
    }
    const children = [entries.length ? list : h('p', { class: 'ep-empty' }, 'No guestbook entries yet. Be the first ♡')];
    if (data.can_sign && actions.onSign && data.access !== 'owner')
        children.unshift(composer(`Sign ${data.display_name}'s guestbook…`, 'Sign', actions.onSign, 1000));
    else if (!data.signed_in && data.guestbook_mode !== 'off')
        children.unshift(h('p', { class: 'ep-note' }, 'Sign in to Elsewhere to sign this guestbook.'));
    return box(`${data.display_name}'s Guestbook`, 'ep-guestbook-box', ...children);
}
function bulletinsBox(data, actions) {
    const posts = data.bulletins || [];
    const list = h('ul', { class: 'ep-bulletins' });
    for (const post of posts) {
        const item = h('li', {}, h('time', {}, when(post.created_at)), paragraphs(post.body));
        if (data.access === 'owner' && actions.onDeleteBulletin) {
            const remove = h('button', { type: 'button', class: 'ep-link-button' }, 'delete');
            remove.addEventListener('click', () => { void actions.onDeleteBulletin(post.id); });
            item.append(remove);
        }
        list.append(item);
    }
    const children = [posts.length ? list : h('p', { class: 'ep-empty' }, 'No bulletins yet.')];
    if (data.access === 'owner' && actions.onPostBulletin)
        children.unshift(composer('Post a bulletin…', 'Post', actions.onPostBulletin, 2000));
    return box('Bulletins', 'ep-bulletins-box', ...children);
}
function friendsBox(data, actions) {
    const friends = data.top_friends || [];
    return box(`${data.display_name}'s Top Friends`, 'ep-friends-box', friends.length ? h('div', { class: 'ep-friend-grid' }, ...friends.map(f => friendLink(f, actions))) : h('p', { class: 'ep-empty' }, 'No Top Friends picked yet.'));
}
function interestsBox(doc, name) {
    const rows = doc.interests.filter(row => row.value.trim());
    if (!rows.length)
        return null;
    return box(`${name}'s Interests`, 'ep-interests-box', h('table', { class: 'ep-interests' }, h('tbody', {}, ...rows.map(row => h('tr', {}, h('th', { scope: 'row' }, row.label || '♡'), h('td', {}, row.value))))));
}
function musicBox(doc) {
    if (!doc.music.title && !doc.music.url)
        return null;
    const children = [h('p', { class: 'ep-track' }, h('span', { class: 'ep-note-icon', 'aria-hidden': 'true' }, '♫ '), doc.music.title || 'My song', doc.music.artist ? h('small', {}, ' · ' + doc.music.artist) : null)];
    // Music never auto-plays: visitors choose to open it.
    if (doc.music.url)
        children.push(h('a', { class: 'ep-button', href: doc.music.url, target: '_blank', rel: 'noopener noreferrer' }, '▶ Listen'));
    return box('Profile Song', 'ep-music-box', ...children);
}
function linksBox(doc) {
    if (!doc.links.length)
        return null;
    return box('Links', 'ep-links-box', h('ul', { class: 'ep-links' }, ...doc.links.map(link => h('li', {}, h('a', { href: link.url, target: '_blank', rel: 'noopener noreferrer ugc' }, link.label || new URL(link.url).hostname)))));
}
function aboutBox(doc, name) {
    return box(`About ${name}`, 'ep-about-box', doc.about.trim() ? paragraphs(doc.about) : h('p', { class: 'ep-empty' }, 'Nothing here yet.'));
}
// ---------- The protected identity rail (never styled by the creator) ----------
function rail(data, actions) {
    const bar = h('header', { class: 'ep-rail', 'aria-label': 'Profile' }, h('span', { class: 'ep-rail-logo', 'aria-hidden': 'true' }, '🦋'), h('span', { class: 'ep-rail-name' }, h('strong', {}, data.display_name || ''), h('small', {}, '@' + (data.handle || ''))));
    const tools = h('span', { class: 'ep-rail-actions' });
    for (const button of actions.railButtons || []) {
        const b = h('button', { type: 'button', class: button.primary ? 'is-primary' : undefined }, button.label);
        b.addEventListener('click', button.onClick);
        tools.append(b);
    }
    bar.append(tools);
    return bar;
}
/** Renders a profile into `host` (replacing its contents). */
export function renderProfile(host, data, actions) {
    host.replaceChildren();
    host.classList.add('ep-host');
    if (data.status === 'missing') {
        host.append(h('div', { class: 'ep-state' }, h('h1', {}, 'Profile not found'), h('p', {}, 'This profile doesn’t exist or isn’t available.')));
        return;
    }
    host.append(rail(data, actions));
    if (data.status === 'locked') {
        host.append(h('div', { class: 'ep-state ep-locked' }, h('div', { class: 'ep-lock', 'aria-hidden': 'true' }, '🔒'), h('h1', {}, data.display_name || ''), h('p', {}, data.card?.message || (data.signed_in ? 'This profile is only visible to friends.' : 'This profile is private. Sign in to Elsewhere to see if you can view it.'))));
        return;
    }
    const doc = normalizeDoc(data.doc);
    const name = data.display_name || data.handle || '';
    const page = h('div', { class: `ep-page ep-layout-${doc.layout} ep-pattern-${doc.theme.pattern}` });
    const vars = { '--ep-bg': doc.theme.bg, '--ep-panel': doc.theme.panel, '--ep-ink': doc.theme.ink, '--ep-accent': doc.theme.accent, '--ep-heading': doc.theme.heading, '--ep-font': `"${doc.theme.font}", Tahoma, sans-serif` };
    for (const [key, value] of Object.entries(vars))
        page.style.setProperty(key, value);
    if (data.access === 'owner' && !data.published)
        page.append(h('p', { class: 'ep-draft-note' }, 'Preview: this profile isn’t published yet, so only you can see it.'));
    const identity = h('section', { class: 'ep-box ep-identity' }, avatarEl(doc.avatar, name, 'ep-avatar'), h('div', { class: 'ep-identity-text' }, h('h1', { class: 'ep-name' }, name), doc.headline ? h('p', { class: 'ep-headline' }, doc.headline) : null, doc.mood ? h('p', { class: 'ep-mood' }, h('b', {}, 'Mood: '), doc.mood) : null, doc.status ? h('p', { class: 'ep-status' }, h('b', {}, 'Status: '), doc.status) : null, h('p', { class: 'ep-handle' }, '@' + (data.handle || ''))));
    const sections = doc.sections;
    const parts = {
        about: sections.about ? aboutBox(doc, name) : null,
        interests: sections.interests ? interestsBox(doc, name) : null,
        music: sections.music ? musicBox(doc) : null,
        links: sections.links ? linksBox(doc) : null,
        friends: sections.friends ? friendsBox(data, actions) : null,
        bulletins: sections.bulletins ? bulletinsBox(data, actions) : null,
        guestbook: sections.guestbook && data.guestbook_mode !== 'off' ? guestbookBox(data, actions) : null,
    };
    if (doc.banner)
        page.append(h('img', { class: 'ep-banner', src: doc.banner, alt: '', loading: 'lazy' }));
    if (doc.layout === 'classic') {
        // Classic Profile: the familiar two-column homepage (left: you, right: your world).
        page.append(h('div', { class: 'ep-columns' }, h('div', { class: 'ep-col-left' }, identity, parts.music, parts.interests, parts.links), h('div', { class: 'ep-col-right' }, parts.about, parts.bulletins, parts.friends, parts.guestbook)));
    }
    else {
        // Elsewhere Original: glossy modular panels.
        page.append(h('div', { class: 'ep-modules' }, identity, parts.about, parts.music, parts.friends, parts.interests, parts.bulletins, parts.links, parts.guestbook));
    }
    host.append(page);
}
