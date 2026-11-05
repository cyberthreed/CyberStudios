'use strict';
const { app, BrowserWindow, ipcMain, Menu, Tray, nativeImage, protocol, session, net, screen, powerMonitor, dialog } = require('electron');
const path = require('node:path');
const fs = require('node:fs');
const { pathToFileURL } = require('node:url');
const { performance } = require('node:perf_hooks');
const { settingsPatch, petSize, clampPosition, createStore } = require('./lib/state.cjs');
const { Behavior } = require('./lib/behavior.cjs');
const { validateManifest } = require('./lib/sprites.cjs');
const { careAction, EVENTS, SAYINGS } = require('./lib/care.cjs');

protocol.registerSchemesAsPrivileged([{ scheme: 'byte', privileges: { standard: true, secure: true, supportFetchAPI: true } }]);
// Tests opt into a separate profile. Normal launches never read this override.
const testing = process.argv.includes('--byte-test');
if (testing && process.env.BYTE_TEST_DATA) app.setPath('userData', process.env.BYTE_TEST_DATA);
else app.setPath('userData', path.join(app.getPath('appData'), 'CyberStudios', 'Byte'));
const locked = app.requestSingleInstanceLock();
if (!locked) app.quit();

let pet, panel, tray, store, brain, manifest, byteSession, loopTimer, saveTimer;
let drag = null, menuOpen = false, suspended = false, ignored = false, persistenceError = '';
let lastTick = performance.now(), lastSignature = '';
let quitting = false, reaction = null;
const root = __dirname;
const pageURL = name => `byte://app/${name}.html`;
const roomActive = () => Boolean(panel && !panel.isDestroyed() && panel.isVisible() && !panel.isMinimized());
const snapshot = () => ({
  settings: { ...store.state.settings }, mode: brain.mode, facing: brain.facing,
  sleeping: brain.sleeping, manifest, saveError: persistenceError, version: app.getVersion(),
  care: store.state.care, activityText: EVENTS, reaction, roomActive: roomActive(), petVisible: Boolean(pet?.isVisible())
});
function publish(force = false) {
  if (!brain || !store) return;
  const value = snapshot(), signature = JSON.stringify(value);
  if (!force && signature === lastSignature) return;
  lastSignature = signature;
  for (const win of [pet, panel]) if (win && !win.isDestroyed()) win.webContents.send('byte:changed', value);
}
function persist() {
  if (!store || !brain) return;
  store.update({ ...store.state, position: brain.position });
}
function workArea() { return screen.getDisplayMatching(pet.getBounds()).workArea; }
function positionPet(position, area = workArea()) {
  const p = clampPosition(position, petSize(store.state.settings.scale), area);
  // Keep fractional movement in the model; round only native window coordinates.
  if (p.x !== Math.round(position.x) || p.y !== Math.round(position.y)) brain.position = p;
  else brain.position = { ...position };
  if (pet.getBounds().x !== p.x || pet.getBounds().y !== p.y) { pet.setPosition(p.x, p.y, false); persist(); }
}
function resetPosition() {
  const area = screen.getPrimaryDisplay().workArea, size = petSize(store.state.settings.scale);
  positionPet({ x: area.x + area.width - size.width - 48, y: area.y + area.height - size.height - 24 }, area);
  brain.target = null; brain.nextWander = performance.now() + 6000;
  persist(); store.flush();
}
function secureWindow(win, name) {
  win.webContents.setWindowOpenHandler(() => ({ action: 'deny' }));
  win.webContents.on('will-navigate', event => event.preventDefault());
  win.webContents.on('will-attach-webview', event => event.preventDefault());
  win.webContents.on('render-process-gone', () => { if (win === pet) app.quit(); });
  win.loadURL(pageURL(name));
}
function preferences() {
  return { preload: path.join(root, 'preload.cjs'), session: byteSession,
    contextIsolation: true, sandbox: true, nodeIntegration: false, webSecurity: true,
    webviewTag: false, devTools: !app.isPackaged };
}
function showSettings() {
  if (panel && !panel.isDestroyed()) { if (panel.isMinimized()) panel.restore(); panel.show(); panel.focus(); publish(true); return; }
  const area = screen.getDisplayMatching(pet.getBounds()).workArea;
  panel = new BrowserWindow({
    title: 'BYTE.EXE · CyberStudios Pet Lab', width: Math.min(1040, area.width - 16), height: Math.min(800, area.height - 40),
    minWidth: Math.min(390, area.width), minHeight: Math.min(600, area.height),
    frame: true, useContentSize: true, resizable: true, maximizable: true, fullscreenable: false,
    backgroundColor: '#f6f0ff', show: false, autoHideMenuBar: true,
    icon: path.join(root, 'assets', 'icon.png'), webPreferences: preferences()
  });
  panel.setMenu(null);
  panel.once('ready-to-show', () => panel?.show());
  panel.on('closed', () => { panel = null; if (!quitting) app.quit(); });
  for (const event of ['minimize', 'restore', 'show']) panel.on(event, () => { publish(true); });
  secureWindow(panel, 'settings');
}
function desktopMode() {
  if (!store.state.settings.showPet) updateSettings({ showPet: true });
  panel?.minimize();
}
function perform(name) {
  if (['pet', 'feed', 'nap', 'play', 'talk', 'dance', 'catch-star'].includes(name)) {
    const activity = name === 'nap' && brain.sleeping ? 'wake' : name;
    brain.action(name, performance.now());
    const words = name === 'talk' ? SAYINGS[store.state.care.talks % SAYINGS.length]
      : name === 'dance' ? 'a tiny dance, just for you ✦' : name === 'catch-star' ? 'caught a little wish! ✧' : null;
    reaction = words ? { kind: name, text: words, until: brain.until } : null;
    store.update({ ...store.state, care: careAction(store.state.care, activity) });
    store.flush(); publish();
  } else if (name === 'settings') showSettings();
  else if (name === 'reset-position') resetPosition();
  else if (name === 'minimize-room' || name === 'desktop-mode') desktopMode();
  else if (name === 'toggle-pet') updateSettings({ showPet: !store.state.settings.showPet });
  else if (name === 'maximize-room' && panel) { if (panel.isMaximized()) panel.unmaximize(); else panel.maximize(); }
  else if (name === 'quit') app.quit();
  else throw new Error('Unknown action');
}
function updateSettings(value) {
  const before = store.state.settings, patch = settingsPatch(value);
  if (Object.keys(patch).length === 0) return snapshot();
  const settings = { ...before, ...patch };
  store.update({ ...store.state, settings });
  pet.setAlwaysOnTop(settings.alwaysOnTop);
  if (settings.showPet !== before.showPet) {
    if (settings.showPet) pet.showInactive(); else { drag = null; pet.hide(); }
  }
  if (settings.scale !== before.scale) {
    const size = petSize(settings.scale);
    pet.setBounds({ ...pet.getBounds(), ...size }, false);
    positionPet(brain.position);
  }
  brain.target = null;
  persist(); store.flush(); publish(true);
  return snapshot();
}
function menuTemplate() {
  return [
    { label: 'Byte · Desktop Resident', enabled: false },
    { type: 'separator' },
    { label: 'Feed a little snack', click: () => perform('feed') },
    { label: 'Chase a little sparkle', click: () => perform('play') },
    { label: 'Talk to Byte', click: () => perform('talk') },
    { label: 'A tiny happy dance', click: () => perform('dance') },
    { label: brain.sleeping ? 'Wake up' : 'Time for a nap', click: () => perform('nap') },
    { label: 'Follow my cursor', type: 'checkbox', checked: store.state.settings.followCursor,
      click: item => updateSettings({ followCursor: item.checked }) },
    { type: 'separator' },
    { label: 'Open Byte’s room', click: showSettings },
    { label: 'Desktop mode', click: desktopMode },
    { label: 'Show desktop Byte', type: 'checkbox', checked: store.state.settings.showPet,
      click: item => updateSettings({ showPet: item.checked }) },
    { label: 'Bring Byte home', click: resetPosition },
    { type: 'separator' },
    { label: 'Quit Byte', click: () => app.quit() }
  ];
}
function showMenu() {
  drag = null; menuOpen = true; pet.setIgnoreMouseEvents(false); ignored = false;
  Menu.buildFromTemplate(menuTemplate()).popup({ window: pet, callback: () => { menuOpen = false; } });
}
function trusted(event, kind) {
  const window = BrowserWindow.fromWebContents(event.sender);
  const role = window === pet ? 'index' : window === panel ? 'settings' : null;
  if (!role || (kind && kind !== role) || event.senderFrame !== event.sender.mainFrame ||
      event.senderFrame.url !== pageURL(role)) throw new Error('Untrusted IPC sender');
}
function setupIPC() {
  const handle = (channel, role, fn) => ipcMain.handle(`byte:${channel}`, (event, value) => { trusted(event, role); return fn(value); });
  handle('snapshot', null, snapshot);
  handle('action', null, name => { if (typeof name !== 'string') throw new Error('Invalid action'); perform(name); });
  handle('settings', 'settings', updateSettings);
  handle('close-settings', 'settings', desktopMode);
  handle('menu', 'index', showMenu);
  handle('drag-start', 'index', () => {
    drag = { cursor: screen.getCursorScreenPoint(), position: { ...brain.position }, moved: false, started: performance.now() };
    brain.target = null; pet.setIgnoreMouseEvents(false); ignored = false;
  });
  handle('drag-end', 'index', () => {
    if (!drag) return true;
    moveDrag(screen.getCursorScreenPoint());
    const moved = drag.moved; drag = null;
    brain.until = performance.now() + 1200; brain.nextWander = performance.now() + 6000;
    persist(); store.flush(); return moved;
  });
}
function moveDrag(cursor) {
  const dx = cursor.x - drag.cursor.x, dy = cursor.y - drag.cursor.y;
  if (Math.hypot(dx, dy) > 5) drag.moved = true;
  if (!drag.moved) return;
  const target = { x: drag.position.x + dx, y: drag.position.y + dy };
  const size = petSize(store.state.settings.scale);
  const area = screen.getDisplayMatching({ ...target, ...size }).workArea;
  positionPet(target, area);
}
function loop() {
  if (!pet || pet.isDestroyed()) return;
  const now = performance.now(), dt = (now - lastTick) / 1000; lastTick = now;
  if (reaction && now >= reaction.until) reaction = null;
  const cursor = screen.getCursorScreenPoint(), settings = store.state.settings, size = petSize(settings.scale);
  if (drag) {
    moveDrag(cursor);
    if (now - drag.started > 30000) drag = null;
  } else if (!suspended) {
    brain.tick(now, dt, settings, workArea(), size, cursor, menuOpen || roomActive() || !pet.isVisible());
    positionPet(brain.position);
  }
  // Transparent margins pass through to the desktop. Keep the sprite rectangle interactive.
  const bounds = pet.getBounds();
  const over = cursor.x >= bounds.x + 12 && cursor.x <= bounds.x + bounds.width - 12 &&
    cursor.y >= bounds.y + 28 && cursor.y <= bounds.y + bounds.height - 12;
  const overControls = cursor.x >= bounds.x + 12 && cursor.x <= bounds.x + bounds.width - 12 &&
    cursor.y >= bounds.y + bounds.height - 24 && cursor.y <= bounds.y + bounds.height;
  const shouldIgnore = !over && !overControls && !drag && !menuOpen;
  if (ignored !== shouldIgnore) {
    ignored = shouldIgnore; pet.setIgnoreMouseEvents(ignored, { forward: true });
  }
  publish();
  loopTimer = setTimeout(loop, drag || brain.mode === 'walk' || (settings.followCursor && !roomActive() && pet.isVisible() && !brain.sleeping && !settings.reducedMotion) ? 50 : 150);
}
async function start() {
  byteSession = session.fromPartition('byte-local');
  byteSession.setPermissionRequestHandler((_contents, _permission, callback) => callback(false));
  byteSession.setPermissionCheckHandler(() => false);
  byteSession.on('will-download', event => event.preventDefault());
  byteSession.webRequest.onBeforeRequest((details, callback) => {
    callback({ cancel: !details.url.startsWith('byte://app/') });
  });
  const allowed = new Set(['index.html', 'settings.html', 'styles.css', 'room-layout.css', 'pet.mjs', 'settings.mjs', 'sprite.mjs']);
  const assetNames = fs.readdirSync(path.join(root, 'assets')).filter(name => /^[a-zA-Z0-9_-]+\.(png|webp|svg)$/.test(name));
  for (const name of assetNames) allowed.add(`assets/${name}`);
  byteSession.protocol.handle('byte', request => {
    const url = new URL(request.url);
    const name = url.pathname.slice(1);
    if (url.hostname !== 'app' || url.username || url.password || url.port || request.method !== 'GET' || !allowed.has(name)) {
      return new Response('Not found', { status: 404 });
    }
    const filename = name.startsWith('assets/') ? path.join(root, name) : path.join(root, 'renderer', name);
    return net.fetch(pathToFileURL(filename).href, { bypassCustomProtocolHandlers: true });
  });
  manifest = validateManifest(JSON.parse(fs.readFileSync(path.join(root, 'assets', 'sprites.json'), 'utf8')));
  store = createStore(app.getPath('userData'), message => { persistenceError = message; publish(true); });
  const area = screen.getPrimaryDisplay().workArea, size = petSize(store.state.settings.scale);
  const initial = store.state.position || { x: area.x + area.width - size.width - 48, y: area.y + area.height - size.height - 24 };
  const restoredArea = screen.getDisplayMatching({ ...initial, ...size }).workArea;
  const position = clampPosition(initial, size, restoredArea);
  brain = new Behavior(position); brain.nextWander = performance.now() + 6000;
  pet = new BrowserWindow({
    ...position, ...size, title: 'Byte Resident', frame: false, transparent: true,
    backgroundColor: '#00000000', hasShadow: false, resizable: false,
    maximizable: false, minimizable: false, fullscreenable: false, thickFrame: false,
    alwaysOnTop: store.state.settings.alwaysOnTop, skipTaskbar: true, show: false,
    icon: path.join(root, 'assets', 'icon.png'), webPreferences: preferences()
  });
  pet.setMenu(null);
  pet.once('ready-to-show', () => {
    if (store.state.settings.showPet) pet.showInactive();
    if (process.argv.includes('--pet-only')) { if (!store.state.settings.showPet) updateSettings({ showPet: true }); }
    else showSettings();
  });
  pet.on('blur', () => { if (drag) { drag = null; persist(); } });
  pet.on('closed', () => { pet = null; if (!quitting) app.quit(); });
  setupIPC(); secureWindow(pet, 'index');
  tray = new Tray(nativeImage.createFromPath(path.join(root, 'assets', 'icon.png')));
  tray.setToolTip('Byte · right-click for snacks & settings');
  tray.on('click', showSettings); tray.on('right-click', showMenu);
  for (const event of ['display-removed', 'display-metrics-changed']) screen.on(event, () => {
    if (!pet) return;
    positionPet(brain.position); brain.target = null; persist();
  });
  powerMonitor.on('suspend', () => { suspended = true; drag = null; });
  powerMonitor.on('resume', () => { suspended = false; lastTick = performance.now(); });
  saveTimer = setInterval(() => store.flush(), 5000); saveTimer.unref();
  persist(); loop();
}
if (locked) {
  app.whenReady().then(start).catch(error => { dialog.showErrorBox('Byte could not start', error.message); app.quit(); });
  app.on('second-instance', () => { if (pet) showSettings(); });
  app.on('activate', () => { if (pet) showSettings(); });
  app.on('before-quit', () => { quitting = true; clearTimeout(loopTimer); clearInterval(saveTimer); drag = null; persist(); store?.flush(); tray?.destroy(); });
  app.on('window-all-closed', () => app.quit());
}
