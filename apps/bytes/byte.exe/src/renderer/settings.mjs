import { Sprite } from './sprite.mjs';
const sprite = new Sprite(document.querySelector('#preview'));
const fields = ['followCursor', 'wander', 'alwaysOnTop', 'reducedMotion', 'scale', 'theme', 'speed'];
const error = document.querySelector('#error');
const stage = document.querySelector('#stage'), roomPet = document.querySelector('#room-pet');
const toyStar = document.querySelector('#toy-star'), toyButton = document.querySelector('#star-game');
const toyHelp = document.querySelector('#toy-help');
let current = null, artError = '', toyActive = false, flight = null, token = 0;
let preferenceHighlightTimer;
const moods = { idle:'☁ curious', walk:'✦ exploring', sleep:'☾ dreaming', pet:'♡ loved', feed:'✿ snack time', play:'✧ playful' };
const speech = { idle:'hello again ✧', walk:'a tiny adventure ✧', sleep:'dreaming of starlight ☾', pet:'purrr… thank you ♡', feed:'a snack? for me? ✿', play:'catch a little magic ✧' };
function showError(message) { error.textContent = message; error.hidden = !message; }
function drawSprite(state) {
  sprite.update(flight ? { ...state, mode: 'walk', facing: flight.facing } : state);
}
function stopFlight() {
  token++;
  if (flight) clearTimeout(flight.timer);
  flight = null; toyStar.hidden = true; roomPet.style.left = '';
  roomPet.style.transitionDuration = '';
  if (current) drawSprite(current);
}
function stopGame() {
  toyActive = false; stopFlight();
  stage.dataset.toy = 'none'; toyButton.setAttribute('aria-pressed', 'false');
  toyButton.innerHTML = '✧ Toss a star <kbd>6</kbd>';
  toyHelp.textContent = 'A little chat, a tiny game, a happy wiggle.';
}
function toggleGame() {
  if (toyActive) { stopGame(); return; }
  toyActive = true; stage.dataset.toy = 'star';
  toyButton.setAttribute('aria-pressed','true'); toyButton.textContent = '✧ Finish star game';
  toyHelp.textContent = 'Click a spot in the room, or press Space, to toss a star.';
  stage.focus();
}
async function tossStar(x) {
  if (!toyActive || !current || !current.roomActive) return;
  stopFlight();
  const bounds = stage.getBoundingClientRect();
  const half = roomPet.getBoundingClientRect().width / 2;
  const target = Math.max(half, Math.min(x, bounds.width - half));
  const start = bounds.width / 2;
  const reduced = current.settings.reducedMotion || matchMedia('(prefers-reduced-motion: reduce)').matches;
  const duration = reduced ? 0 : Math.round(450 + Math.abs(target - start) * 3);
  const myToken = ++token;
  toyStar.style.left = `${target}px`; toyStar.hidden = false;
  roomPet.style.transitionDuration = `${duration}ms`; roomPet.style.left = `${target}px`;
  flight = { facing: target >= start ? 1 : -1, timer: null };
  drawSprite(current); toyHelp.textContent = 'A little star, a little chase…';
  flight.timer = setTimeout(async () => {
    if (myToken !== token || !toyActive || document.hidden) return;
    flight = null; toyStar.hidden = true;
    try {
      await window.byte.action('catch-star');
      toyHelp.textContent = 'Caught it! Click another spot to play again.';
    } catch { showError('That star slipped away. Try tossing another.'); }
    roomPet.style.transitionDuration = ''; roomPet.style.left = '';
    if (current) drawSprite(current);
  }, duration + 40);
}
function update(state) {
  current = state;
  document.body.dataset.theme = state.settings.theme;
  document.body.dataset.reducedMotion = String(state.settings.reducedMotion);
  document.body.dataset.night = String(state.settings.nightRoom);
  document.body.dataset.dancing = String(state.reaction?.kind === 'dance');
  if (toyActive && (!state.roomActive || state.sleeping || state.reaction?.kind === 'dance')) stopGame();
  for (const name of fields) {
    const field = document.getElementById(name);
    if (field.type === 'checkbox') field.checked = state.settings[name];
    else if (document.activeElement !== field) field.value = state.settings[name];
  }
  for (const [name, value] of Object.entries(state.care.stats)) {
    document.getElementById(name).value = value;
    document.getElementById(name).textContent = `${value}%`;
    document.getElementById(`${name}-value`).value = `${value}%`;
  }
  const latest = state.care.activity[0];
  const text = state.activityText[latest?.type] || state.activityText.hello;
  document.querySelector('#activity-title-text').textContent = text[0];
  document.querySelector('#activity-detail').textContent = text[1];
  document.querySelector('#star-count').textContent = `✦ ${state.care.starsCaught} ${state.care.starsCaught === 1 ? 'star' : 'stars'} caught`;
  document.querySelector('#speed-value').value = state.settings.speed;
  document.querySelector('#nap-label').textContent = state.sleeping ? 'Wake' : 'Rest';
  document.querySelector('#mood').textContent = moods[state.mode] || moods.idle;
  document.querySelector('#speech').textContent = state.reaction?.text || speech[state.mode] || speech.idle;
  document.querySelector('#version').textContent = `✧ v${state.version}`;
  document.querySelector('#save-status').textContent = state.saveError ? '● save needs attention' : '● saved locally';
  document.querySelector('#night').textContent = state.settings.nightRoom ? '☀ Day room' : '☾ Night room';
  document.querySelector('#night').setAttribute('aria-pressed',String(state.settings.nightRoom));
  document.querySelector('#room-mode').textContent = state.settings.nightRoom ? '☾ starlight mode' : '☀ daydream mode';
  document.querySelector('#toggle-pet').textContent = state.petVisible ? 'Hide desktop cat' : 'Show desktop cat';
  document.querySelector('#toggle-pet').setAttribute('aria-pressed',String(state.petVisible));
  document.querySelector('#behavior-note').textContent = state.settings.reducedMotion
    ? 'Reduced motion pauses animation, wandering, and cursor following.'
    : state.settings.followCursor ? 'Following takes priority over wandering. Use Desktop mode to resume desktop strolls.'
    : 'Desktop strolls pause while this room is open. Desktop mode keeps Byte on your desktop.';
  showError(state.saveError || artError); drawSprite(state);
}
async function act(name) {
  if (name !== 'catch-star' && toyActive) stopGame();
  try { await window.byte.action(name); } catch { showError('Byte could not do that. Please try again.'); }
}
async function save(patch) { try { update(await window.byte.settings(patch)); } catch { showError('Could not save preferences. Please try again.'); } }
try {
  const initial = await window.byte.snapshot();
  window.byte.onChange(update);
  try { await sprite.load(initial.manifest); } catch { artError = 'The sprite pack could not load. Check assets/sprites.json.'; }
  update(initial);
} catch { showError('The room could not connect to Byte. Please restart the app.'); }
for (const name of fields) {
  const field = document.getElementById(name);
  field.addEventListener('change', () => {
    const value = field.type === 'checkbox' ? field.checked : ['scale', 'speed'].includes(name) ? Number(field.value) : field.value;
    void save({ [name]: value });
  });
}
document.querySelector('#speed').addEventListener('input', event => { document.querySelector('#speed-value').value = event.target.value; });
for (const name of ['feed','play','nap','talk','dance']) document.getElementById(name).addEventListener('click', () => void act(name));
for (const id of ['quit','quit-header','quit-session']) document.getElementById(id)?.addEventListener('click', () => void act('quit'));
document.querySelector('#pet-action').addEventListener('click', () => void act('pet'));
roomPet.addEventListener('click', () => { if (!toyActive) void act('pet'); });
toyButton.addEventListener('click', toggleGame);
stage.addEventListener('click', event => { if (toyActive) void tossStar(event.clientX - stage.getBoundingClientRect().left); });
stage.addEventListener('keydown', event => {
  if (toyActive && event.key === ' ' && event.target === stage) { event.preventDefault(); void tossStar(60 + Math.random() * (stage.clientWidth - 120)); }
});
for (const id of ['desktop-mode','desktop-mode-secondary','preferences-desktop-mode']) document.getElementById(id).addEventListener('click', () => void act('desktop-mode'));
document.querySelector('#preferences-jump').addEventListener('click', () => {
  const card = document.querySelector('#desktop-preferences');
  const reduced = current?.settings.reducedMotion || matchMedia('(prefers-reduced-motion: reduce)').matches;
  card.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth', block: 'start' });
  card.focus({ preventScroll: true });
  card.dataset.highlight = 'true';
  clearTimeout(preferenceHighlightTimer);
  preferenceHighlightTimer = setTimeout(() => { delete card.dataset.highlight; }, 1800);
});
document.querySelector('#toggle-pet').addEventListener('click', () => void act('toggle-pet'));
document.querySelector('#reset').addEventListener('click', () => void act('reset-position'));
document.querySelector('#night').addEventListener('click', () => { if(current) void save({nightRoom:!current.settings.nightRoom}); });
document.addEventListener('keydown', event => {
  if (event.key === 'Escape') {
    if (toyActive) stopGame(); else void window.byte.closeSettings();
    return;
  }
  if (event.repeat || event.ctrlKey || event.altKey || event.metaKey || /^(INPUT|SELECT|TEXTAREA)$/.test(event.target.tagName)) return;
  if (event.key === '6') { event.preventDefault(); toggleGame(); return; }
  const action = {1:'pet',2:'feed',3:'play',4:'nap',5:'talk',7:'dance'}[event.key];
  if (action) { event.preventDefault(); void act(action); }
});
document.addEventListener('visibilitychange', () => { if(document.hidden && toyActive) stopGame(); });
window.addEventListener('resize', () => { if (flight) stopFlight(); });
window.addEventListener('unload', () => { clearTimeout(preferenceHighlightTimer); stopFlight(); sprite.stop(); });
