'use strict';
const fs = require('node:fs');
const path = require('node:path');
const { normalizeCare } = require('./care.cjs');

const DEFAULTS = Object.freeze({
  followCursor: false, wander: true, reducedMotion: false,
  alwaysOnTop: true, scale: 3, speed: 48, theme: 'haze', nightRoom: false, showPet: true
});
const THEMES = ['haze', 'lagoon', 'peach'];
function settingsPatch(value) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return {};
  const patch = {};
  for (const key of ['followCursor', 'wander', 'reducedMotion', 'alwaysOnTop', 'nightRoom', 'showPet']) {
    if (typeof value[key] === 'boolean') patch[key] = value[key];
  }
  if ([2, 3, 4].includes(value.scale)) patch.scale = value.scale;
  if (Number.isFinite(value.speed)) patch.speed = Math.round(Math.min(100, Math.max(20, value.speed)));
  if (THEMES.includes(value.theme)) patch.theme = value.theme;
  return patch;
}
function normalizeState(value) {
  const result = { version: 1, settings: { ...DEFAULTS, ...settingsPatch(value?.settings) }, position: null };
  result.care = normalizeCare(value?.care);
  const p = value?.position;
  if (p && Number.isFinite(p.x) && Number.isFinite(p.y) && Math.abs(p.x) < 1e6 && Math.abs(p.y) < 1e6) {
    result.position = { x: Math.round(p.x), y: Math.round(p.y) };
  }
  return result;
}
function petSize(scale) { return { width: 48 * scale + 24, height: 48 * scale + 52 }; }
function clampPosition(p, size, area) {
  return {
    x: Math.round(Math.max(area.x, Math.min(p.x, area.x + Math.max(0, area.width - size.width)))),
    y: Math.round(Math.max(area.y, Math.min(p.y, area.y + Math.max(0, area.height - size.height))))
  };
}
function createStore(directory, reportError = () => {}) {
  const file = path.join(directory, 'byte-state.json');
  let state;
  try { state = normalizeState(JSON.parse(fs.readFileSync(file, 'utf8'))); }
  catch (error) {
    state = normalizeState(null);
    if (error.code !== 'ENOENT') reportError('Saved preferences could not be read. Defaults are in use.');
  }
  let dirty = false;
  return {
    file,
    get state() { return state; },
    update(value) { state = normalizeState(value); dirty = true; },
    flush() {
      if (!dirty) return true;
      try {
        fs.mkdirSync(directory, { recursive: true });
        fs.writeFileSync(file + '.tmp', JSON.stringify(state, null, 2), { mode: 0o600 });
        fs.renameSync(file + '.tmp', file);
        dirty = false;
        return true;
      } catch { reportError('Preferences could not be saved. Check free space and folder permissions.'); return false; }
    }
  };
}
module.exports = { DEFAULTS, settingsPatch, normalizeState, petSize, clampPosition, createStore };
