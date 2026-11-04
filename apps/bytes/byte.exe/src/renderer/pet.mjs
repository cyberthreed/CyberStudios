import { Sprite } from './sprite.mjs';
const button = document.querySelector('#pet'), bubble = document.querySelector('#bubble');
const sprite = new Sprite(document.querySelector('#sprite'));
let pointer = null, startPromise = null, finishing = false;
const messages = { pet: 'purrr ♡', feed: 'nom nom…', play: 'a little magic ✧', sleep: 'z z z', walk: '', idle: '' };
function update(state) {
  document.body.dataset.theme = state.settings.theme;
  document.body.dataset.reducedMotion = String(state.settings.reducedMotion);
  document.body.dataset.dancing = String(state.reaction?.kind === 'dance');
  sprite.update(state);
  bubble.textContent = state.reaction?.text || messages[state.mode] || '';
  bubble.hidden = !bubble.textContent;
}
try {
  const initial = await window.byte.snapshot();
  await sprite.load(initial.manifest);
  update(initial);
  window.byte.onChange(update);
} catch {
  bubble.hidden = false; bubble.textContent = 'Art missing · right-click';
}
button.addEventListener('pointerdown', event => {
  if (event.button !== 0 || pointer !== null) return;
  pointer = event.pointerId; button.setPointerCapture(pointer);
  startPromise = window.byte.dragStart();
});
async function endDrag(petOnClick = false) {
  if (pointer === null || finishing) return;
  finishing = true;
  try {
    await startPromise;
    const moved = await window.byte.dragEnd();
    if (!moved && petOnClick) await window.byte.action('pet');
  } finally {
    const oldPointer = pointer; pointer = null; finishing = false;
    if (button.hasPointerCapture(oldPointer)) button.releasePointerCapture(oldPointer);
  }
}
button.addEventListener('pointerup', event => { if (event.button === 0) void endDrag(true); });
button.addEventListener('pointercancel', () => void endDrag());
button.addEventListener('lostpointercapture', () => void endDrag());
window.addEventListener('blur', () => void endDrag());
document.addEventListener('contextmenu', event => { event.preventDefault(); void window.byte.menu(); });
button.addEventListener('keydown', event => {
  if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); void window.byte.action('pet'); }
  if (event.key === 'ContextMenu' || (event.shiftKey && event.key === 'F10')) { event.preventDefault(); void window.byte.menu(); }
});
window.addEventListener('unload', () => sprite.stop());
document.querySelector('#open-room').addEventListener('click', () => void window.byte.action('settings'));
document.querySelector('#pet-quit').addEventListener('click', () => void window.byte.action('quit'));
