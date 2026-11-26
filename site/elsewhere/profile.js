// Elsewhere profile on the web: ?u=handle. Uses the same renderer as Elsewhere Messenger.
// Signed-out visitors only ever receive what the profile owner made public: the server decides.
import { renderProfile } from './profile-render.js?v=5'
import { SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY } from '../elsewhere-accounts/config.js'
import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.49.4/+esm'

const host = document.getElementById('profile')
const handle = (new URLSearchParams(location.search).get('u') || '').replace(/^@/, '').trim().toLowerCase()
const here = h => `profile.html?u=${encodeURIComponent(h)}`
const page = (new URLSearchParams(location.search).get('p') || 'home').toLowerCase().replace(/[^a-z0-9-]/g, '').slice(0, 30) || 'home'

function finder(message = '') {
  host.replaceChildren()
  const box = document.createElement('div'); box.className = 'ep-find'
  const title = document.createElement('h1'); title.textContent = '🦋 Find an Elsewhere profile'
  const note = document.createElement('p'); note.textContent = message || 'Type someone’s @handle to visit their page.'
  const form = document.createElement('form')
  const input = document.createElement('input'); input.placeholder = '@handle'; input.setAttribute('aria-label', 'Elsewhere handle')
  const go = document.createElement('button'); go.type = 'submit'; go.textContent = 'Visit'
  form.append(input, go)
  form.addEventListener('submit', event => { event.preventDefault(); const h = input.value.replace(/^@/, '').trim(); if (h) location.href = here(h) })
  const join = document.createElement('a'); join.href = '../elsewhere-accounts/'; join.textContent = 'Make your own Elsewhere profile'
  box.append(title, note, form, join)
  host.append(box)
}

async function show() {
  if (!/^[a-z0-9_.]{3,30}$/.test(handle)) { finder(); return }
  try {
    const client = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, { auth: { persistSession: false } })
    const { data, error } = await client.rpc('get_elsewhere_profile', { target_handle: handle })
    if (error) throw error
    if (!data || data.status === 'missing') { finder(`We couldn’t find @${handle}. It may be private or not published yet.`); return }
    if (data.status === 'ok' && !data.published) { finder(`@${handle} hasn’t published their profile yet.`); return }
    document.title = `${data.display_name || handle} · Elsewhere`
    renderProfile(host, data, {
      profileHref: here,
      page,
      getPoll: async id => { const { data: poll, error } = await client.rpc('get_elsewhere_poll', { poll_id: id }); if (error) throw error; return poll },
      webringNav: async id => { const { data: nav, error } = await client.rpc('elsewhere_webring_nav', { ring_id: id, from_handle: handle }); if (error) throw error; return nav },
      countView: async () => { const { data: n, error } = await client.rpc('count_elsewhere_profile_view', { target_handle: handle }); if (error) throw error; return n },
      pageHref: slug => here(handle) + (slug === 'home' ? '' : '&p=' + encodeURIComponent(slug)),
      railButtons: [
        { label: '✦ Get Elsewhere', primary: true, onClick: () => { location.href = 'messenger.html' } },
        { label: 'Find a profile', onClick: () => finder() },
      ],
    })
  } catch {
    finder('Profiles couldn’t load right now. Try again in a little bit ♡')
  }
}
show()
