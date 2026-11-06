// Byte's existing Tumblr companion, shared across the Wiki.
(() => {
  'use strict';
  const read = (key) => { try { return localStorage.getItem('cyberstudios-wiki.' + key); } catch (_) { return null; } };
  const write = (key, value) => { try { localStorage.setItem('cyberstudios-wiki.' + key, value); } catch (_) {} };
    const pet = document.getElementById('byte-companion');
    const toggle = document.getElementById('byte-toggle');
    if (!pet || !toggle) return;
    const $ = (id) => document.getElementById('byte-' + id);
    const character = $('character'), menu = $('menu'), response = $('response');
    const roamButton = $('roam'), restButton = $('rest');
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
    let visible = read('byte-visible') !== 'false';
    let roaming = false, asleep = false, hovered = false, x = 18, direction = 1;
    let frame = 0, lastTime = 0, bounceTimer = 0;
    const viewportWidth = () => document.documentElement.clientWidth || window.innerWidth;
    const bounds = () => Math.max(12, viewportWidth() - pet.offsetWidth - 12);
    const position = () => {
      x = Math.max(12, Math.min(x, bounds()));
      pet.style.left = x + 'px';
      menu.style.left = Math.max(12, Math.min(x, viewportWidth() - menu.offsetWidth - 12)) + 'px';
    };
    const say = (message) => { response.textContent = message; };
    const paused = () => !visible || asleep || hovered || !menu.hidden ||
      document.hidden || document.activeElement === character || menu.contains(document.activeElement);
    function tick(time) {
      frame = 0;
      if (!roaming || reduced.matches || paused()) { lastTime = 0; return; }
      if (lastTime) {
        x += direction * Math.min(time - lastTime, 40) * .025;
        if (x >= bounds()) { x = bounds(); direction = -1; }
        if (x <= 12) { x = 12; direction = 1; }
        position();
      }
      lastTime = time;
      frame = window.requestAnimationFrame(tick);
    }
    function schedule() {
      if (roaming && !reduced.matches && !paused() && !frame) {
        lastTime = 0; frame = window.requestAnimationFrame(tick);
      }
    }
    function stopFrame() {
      if (frame) window.cancelAnimationFrame(frame);
      frame = 0; lastTime = 0;
    }
    function setRoaming(enabled) {
      roaming = Boolean(enabled && !reduced.matches && visible && !asleep);
      roamButton.setAttribute('aria-pressed', String(roaming));
      roamButton.textContent = reduced.matches ? 'Roaming off: reduced motion' : (roaming ? 'Pause roaming' : 'Start roaming');
      roamButton.disabled = reduced.matches || asleep;
      stopFrame(); schedule();
    }
    function closeMenu(focusByte) {
      menu.hidden = true; character.setAttribute('aria-expanded', 'false');
      if (focusByte && visible) character.focus();
      schedule();
    }
    function setVisible(enabled, save) {
      visible = enabled; pet.hidden = !enabled;
      toggle.setAttribute('aria-pressed', String(enabled));
      toggle.textContent = enabled ? '♡ Hide Byte' : '♡ Show Byte';
      if (!enabled) { closeMenu(false); setRoaming(false); }
      if (save) write('byte-visible', String(enabled));
      position();
    }
    function wake() {
      asleep = false; character.classList.remove('is-asleep');
      restButton.setAttribute('aria-pressed', 'false'); restButton.textContent = '☾ Rest';
      setRoaming(false);
    }
    function happy(message) {
      wake(); say(message);
      window.clearTimeout(bounceTimer);
      character.classList.remove('is-happy');
      if (!reduced.matches) {
        // Re-start the short, user-triggered animation without inserting HTML.
        void character.offsetWidth;
        character.classList.add('is-happy');
        bounceTimer = window.setTimeout(() => character.classList.remove('is-happy'), 850);
      }
    }
    toggle.hidden = false;
    setVisible(visible, false); setRoaming(false);
    toggle.addEventListener('click', () => {
      setVisible(!visible, true);
      if (visible) character.focus();
    });
    character.addEventListener('click', () => {
      if (!menu.hidden) { closeMenu(false); return; }
      menu.hidden = false; character.setAttribute('aria-expanded', 'true'); position();
      stopFrame(); $('pet').focus();
    });
    $('pet').addEventListener('click', () => happy('Prrr… Byte leans into your hand. ♡'));
    $('treat').addEventListener('click', () => happy('A tiny treat, a very happy Byte. ✿'));
    restButton.addEventListener('click', () => {
      if (asleep) { wake(); say('Byte stretches. Hello again. ✧'); return; }
      asleep = true; character.classList.add('is-asleep'); character.classList.remove('is-happy');
      restButton.setAttribute('aria-pressed', 'true'); restButton.textContent = '☀ Wake up';
      setRoaming(false); say('Byte curls up for a little rest. zzz ♡');
    });
    roamButton.addEventListener('click', () => {
      setRoaming(!roaming);
      say(roaming ? 'Roaming is on. Close the controls and move focus away to let Byte wander.' : 'Byte is staying in his little spot. ♡');
    });
    function move(amount) { setRoaming(false); x += amount; position(); }
    $('left').addEventListener('click', () => move(-40));
    $('right').addEventListener('click', () => move(40));
    $('home').addEventListener('click', () => { setRoaming(false); x = 18; position(); say('Home, sweet little corner. ♡'); });
    character.addEventListener('keydown', (event) => {
      if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
        event.preventDefault(); move(event.key === 'ArrowLeft' ? -24 : 24);
      } else if (event.key === 'Home') {
        event.preventDefault(); setRoaming(false); x = 18; position();
      }
    });
    $('close').addEventListener('click', () => closeMenu(true));
    $('hide').addEventListener('click', () => { setVisible(false, true); toggle.focus(); });
    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape' && !menu.hidden) { event.preventDefault(); closeMenu(true); }
    });
    document.addEventListener('pointerdown', (event) => {
      if (!menu.hidden && !menu.contains(event.target) && !pet.contains(event.target)) closeMenu(false);
    });
    pet.addEventListener('pointerenter', () => { hovered = true; stopFrame(); });
    pet.addEventListener('pointerleave', () => { hovered = false; schedule(); });
    pet.addEventListener('focusin', stopFrame);
    menu.addEventListener('focusin', stopFrame);
    pet.addEventListener('focusout', () => window.setTimeout(schedule, 0));
    menu.addEventListener('focusout', () => window.setTimeout(schedule, 0));
    document.addEventListener('visibilitychange', () => { stopFrame(); schedule(); });
    window.addEventListener('resize', position);
    const motionChange = () => {
      setRoaming(false);
      if (reduced.matches) { character.classList.remove('is-happy'); say('Reduced motion is on. You can still pet Byte and move him with the buttons.'); }
    };
    if (reduced.addEventListener) reduced.addEventListener('change', motionChange);
    else if (reduced.addListener) reduced.addListener(motionChange);
  })();
  