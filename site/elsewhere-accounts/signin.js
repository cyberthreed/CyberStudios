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
  done.hidden = true; form.hidden = false; reset.hidden = true; say('Signed out.')
})

// Forgot password: email a sign-in code, then check it and save the new password.
const reset = document.querySelector('#reset'), step2 = document.querySelector('#reset-step2')
const show = which => { form.hidden = which !== 'signin'; reset.hidden = which !== 'reset'; status.textContent = '' }
document.querySelector('#forgot').addEventListener('click', () => {
  show('reset'); document.querySelector('#reset-email').value = form.querySelector('#email').value; document.querySelector('#reset-email').focus()
})
document.querySelector('#back-to-signin').addEventListener('click', () => { show('signin'); step2.hidden = true })
let sending = false
document.querySelector('#send-code').addEventListener('click', async () => {
  const email = document.querySelector('#reset-email').value.trim()
  if (!document.querySelector('#reset-email').checkValidity() || !email) { say('Enter the email address you signed up with.'); return }
  if (sending) return
  sending = true
  try {
    const { error } = await client.auth.signInWithOtp({ email, options: { shouldCreateUser: false } })
    // The same message either way, so this page never tells anyone which emails have accounts.
    if (error && error.status === 429) { say('Too many tries. Wait a minute, then try again.'); return }
    step2.hidden = false
    say('If that email has an Elsewhere account, a code is on its way. Check your inbox (and spam).')
    document.querySelector('#reset-code').focus()
  } catch { say('Could not reach Elsewhere. Try again later.') }
  finally { sending = false }
})
reset.addEventListener('submit', async event => {
  event.preventDefault()
  if (busy) return
  const email = document.querySelector('#reset-email').value.trim()
  const code = document.querySelector('#reset-code').value.trim()
  const pw = document.querySelector('#reset-pw').value, pw2 = document.querySelector('#reset-pw2').value
  if (!/^[0-9]{6,10}$/.test(code)) { say('Enter the code from the email.'); return }
  if (pw.length < 8) { say('Your new password needs at least 8 characters.'); return }
  if (pw !== pw2) { say('The two passwords don’t match.'); return }
  busy = true
  try {
    const { error } = await client.auth.verifyOtp({ email, token: code, type: 'email' })
    if (error) { say(error.status === 429 ? 'Too many tries. Wait a minute, then try again.' : 'That code didn’t work. It may have expired, so ask for a new one.'); return }
    const { error: saveError } = await client.auth.updateUser({ password: pw })
    if (saveError) { say(saveError.code === 'same_password' ? 'That’s already your password. Pick a new one.' : 'Your password couldn’t be saved. Try again.'); return }
    reset.reset(); step2.hidden = true; reset.hidden = true; done.hidden = false
    say('New password saved ♡ You’re signed in.')
    const { data } = await client.rpc('get_my_elsewhere_profile')
    const who = document.querySelector('#who'), link = document.querySelector('#my-profile')
    if (data?.handle) { who.textContent = `Signed in as @${data.handle}`; link.href = `../elsewhere/profile.html?u=${encodeURIComponent(data.handle)}` }
    else who.textContent = 'Open Elsewhere Messenger to pick your @handle and make your profile.'
  } catch { say('Could not reach Elsewhere. Try again later.') }
  finally { busy = false }
})
