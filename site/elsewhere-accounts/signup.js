import { canRegister, TERMS_VERSION } from './admission.js'
import { SIGNUP_ENDPOINT, TURNSTILE_SITE_KEY, SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY } from './config.js'
import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.49.4/+esm'

// Only used to check the emailed code and save the password. Nothing is kept in the browser.
const auth = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, { auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false } }).auth

const age = document.querySelector('#age')
const signup = document.querySelector('#signup')
const status = document.querySelector('#status')
const submit = document.querySelector('#submit')
let birthDate = ''
let token = ''
let widget
let sending = false
let email = ''
const verify = document.querySelector('#verify')
const passwordForm = document.querySelector('#password')
const done = document.querySelector('#done')

function friendly(error) {
  const code = error?.code || ''
  if (code === 'otp_expired' || /expired|invalid/i.test(error?.message || '')) return 'That code didn’t work or has expired. Check the newest email, or reload this page to get a new code.'
  if (code === 'weak_password') return 'Choose a stronger password.'
  if (error?.status === 429) return 'Too many tries. Wait a minute, then try again.'
  return 'Something went wrong. Try again in a moment.'
}

function announce(message) {
  status.textContent = message
  status.focus()
}

function loadChallenge() {
  return new Promise((resolve, reject) => {
    const script = document.createElement('script')
    window.onElsewhereTurnstileLoad = () => {
      delete window.onElsewhereTurnstileLoad
      resolve()
    }
    script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit&onload=onElsewhereTurnstileLoad'
    script.async = true
    script.onerror = () => {
      delete window.onElsewhereTurnstileLoad
      reject(new Error('Could not load Turnstile.'))
    }
    document.head.append(script)
  })
}

age.addEventListener('submit', async event => {
  event.preventDefault()
  const date = document.querySelector('#birth-date')
  if (!canRegister(date.value)) {
    // Do not load the widget or request an email on an ineligible visit.
    date.value = ''
    age.hidden = true
    announce('You are not eligible to create an Elsewhere account.')
    return
  }
  if (!SIGNUP_ENDPOINT.startsWith('https://') || !TURNSTILE_SITE_KEY) {
    announce('Account signup is not open yet.')
    return
  }
  birthDate = date.value
  date.value = ''
  age.hidden = true
  signup.hidden = false
  document.querySelector('#email').focus()
  try {
    await loadChallenge()
    widget = window.turnstile.render('#challenge', {
      sitekey: TURNSTILE_SITE_KEY,
      size: document.querySelector('#challenge').clientWidth < 300 ? 'compact' : 'normal',
      action: 'elsewhere_signup',
      callback: proof => { token = proof; submit.disabled = sending },
      'expired-callback': () => { token = ''; submit.disabled = true },
      'error-callback': () => { token = ''; submit.disabled = true; announce('The bot check could not load.') },
    })
  } catch { announce('The bot check could not load. Try reloading this page.') }
})
signup.addEventListener('submit', async event => {
  event.preventDefault()
  if (!token || sending || !birthDate || !document.querySelector('#terms').checked) return
  sending = true
  submit.disabled = true
  try {
    const response = await fetch(SIGNUP_ENDPOINT, { method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ birthDate, email: document.querySelector('#email').value, captcha: token,
        agreed: true, termsVersion: TERMS_VERSION }) })
    const result = await response.json()
    if (response.ok) {
      email = document.querySelector('#email').value.trim().toLowerCase()
      birthDate = ''
      signup.reset()
      signup.hidden = true
      window.turnstile.remove(widget)
      document.querySelector('#code-email').textContent = email
      verify.hidden = false
      status.textContent = ''
      document.querySelector('#code').focus()
      return
    }
    announce(result.message || 'Signup is unavailable. Try again later.')
  } catch { announce('Could not reach Elsewhere. Try again later.') }
  finally {
    sending = false
    token = ''
    if (!signup.hidden) window.turnstile.reset(widget)
  }
})
verify.addEventListener('submit', async event => {
  event.preventDefault()
  if (sending) return
  const token = document.querySelector('#code').value.replace(/\s+/g, '')
  if (!token) return
  sending = true
  verify.querySelector('button').disabled = true
  try {
    // New addresses get a signup code; addresses that started signing up before get a sign-in code.
    let result = await auth.verifyOtp({ email, token, type: 'email' })
    if (result.error) result = await auth.verifyOtp({ email, token, type: 'signup' })
    if (result.error || !result.data.session) { announce(friendly(result.error)); return }
    verify.hidden = true
    passwordForm.hidden = false
    status.textContent = ''
    document.querySelector('#new-password').focus()
  } catch { announce('Could not reach Elsewhere. Try again later.') }
  finally { sending = false; verify.querySelector('button').disabled = false }
})
passwordForm.addEventListener('submit', async event => {
  event.preventDefault()
  if (sending) return
  const password = document.querySelector('#new-password').value
  if (password !== document.querySelector('#confirm-password').value) { announce('The passwords don’t match.'); return }
  if (password.length < 8) { announce('Use at least 8 characters.'); return }
  sending = true
  passwordForm.querySelector('button').disabled = true
  try {
    const { error } = await auth.updateUser({ password })
    if (error && error.code !== 'same_password') { announce(friendly(error)); return }
    await auth.signOut({ scope: 'local' }).catch(() => {})
    passwordForm.reset()
    passwordForm.hidden = true
    done.hidden = false
    status.textContent = ''
    document.querySelector('#account-title').textContent = 'Welcome to Elsewhere'
  } catch { announce('Could not reach Elsewhere. Try again later.') }
  finally { sending = false; passwordForm.querySelector('button').disabled = false }
})
