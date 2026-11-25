import { SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY } from './config.js'
import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.49.4/+esm'

// Nothing is kept in the browser: the session lives only while this page is open.
const client = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, { auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false } })
const form = document.querySelector('#signin'), done = document.querySelector('#done'), status = document.querySelector('#status')
const say = m => { status.textContent = m; status.focus() }
let busy = false
form.addEventListener('submit', async event => {
  event.preventDefault()
  if (busy) return
  busy = true; form.querySelector('button').disabled = true
  try {
    const { error } = await client.auth.signInWithPassword({ email: form.querySelector('#email').value.trim(), password: form.querySelector('#pw').value })
    if (error) { say(error.status === 429 ? 'Too many tries. Wait a minute, then try again.' : 'That email or password didn’t match.'); return }
    form.reset(); form.hidden = true; done.hidden = false; status.textContent = ''
    const { data } = await client.rpc('get_my_elsewhere_profile')
    const who = document.querySelector('#who'), link = document.querySelector('#my-profile')
    if (data?.handle) { who.textContent = `Signed in as @${data.handle}`; link.href = `../elsewhere/profile.html?u=${encodeURIComponent(data.handle)}` }
    else who.textContent = 'Open Elsewhere Messenger to pick your @handle and make your profile.'
  } catch { say('Could not reach Elsewhere. Try again later.') }
  finally { busy = false; form.querySelector('button').disabled = false }
})
document.querySelector('#signout').addEventListener('click', async () => {
  await client.auth.signOut({ scope: 'local' }).catch(() => {})
  done.hidden = true; form.hidden = false; say('Signed out.')
})
