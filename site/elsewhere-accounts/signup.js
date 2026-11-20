import { canRegister, TERMS_VERSION } from './admission.js'
import { SIGNUP_ENDPOINT, TURNSTILE_SITE_KEY } from './config.js'

const age = document.querySelector('#age')
const signup = document.querySelector('#signup')
const status = document.querySelector('#status')
const submit = document.querySelector('#submit')
let birthDate = ''
let token = ''
let widget
let sending = false

function announce(message) {
  status.textContent = message
  status.focus()
}

function loadChallenge() {
  return new Promise((resolve, reject) => {
    const script = document.createElement('script')
    script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit'
    script.async = true
    script.onload = () => window.turnstile.ready(resolve)
    script.onerror = reject
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
      birthDate = ''
      signup.reset()
      signup.hidden = true
      window.turnstile.remove(widget)
    }
    announce(result.message || 'Signup is unavailable. Try again later.')
  } catch { announce('Could not reach Elsewhere. Try again later.') }
  finally {
    sending = false
    token = ''
    if (!signup.hidden) window.turnstile.reset(widget)
  }
})
