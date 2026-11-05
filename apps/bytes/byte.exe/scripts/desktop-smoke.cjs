'use strict';
// Real Electron integration checks. Each run has an isolated local profile.
const { _electron: electron } = require('playwright-core');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const root = path.join(__dirname, '..');
const results = path.join(root,'test-results'); fs.mkdirSync(results,{recursive:true});
const profile = fs.mkdtempSync(path.join(results,'profile-'));
const errors=[];
// Resolve/download Electron before Playwright's launch deadline starts (Electron 45 lazy-installs).
const executablePath = process.env.BYTE_SMOKE_EXECUTABLE || require('electron');
async function launch() {
  const env={...process.env,BYTE_TEST_DATA:profile}; delete env.ELECTRON_RUN_AS_NODE;
  const args=process.env.BYTE_SMOKE_EXECUTABLE ? ['--byte-test','--settings'] : [root,'--byte-test','--settings'];
  const app=await electron.launch({executablePath,args,env,timeout:30000});
  app.on('window',page=>{page.on('pageerror',error=>errors.push(error.message));});
  const pet=await app.firstWindow();
  await pet.waitForURL('byte://app/index.html');
  await pet.waitForFunction(()=>Boolean(window.byte));
  let panel=app.windows().find(page=>page.url()==='byte://app/settings.html');
  if(!panel) panel=await app.waitForEvent('window',{predicate:page=>page!==pet});
  await panel.waitForURL('byte://app/settings.html');
  await panel.waitForFunction(()=>document.querySelector('#preview').dataset.mode);
  return {app,pet,panel};
}
async function waitUntil(check, message) {
  for (let i=0;i<60;i++) { if(await check()) return; await new Promise(resolve=>setTimeout(resolve,50)); }
  throw new Error(message);
}
async function exitsCleanly(action, child, message) {
  try { await action(); } catch(error) { if(!/closed/i.test(error.message)) throw error; }
  await waitUntil(async()=>child.exitCode!==null,message);
  assert.equal(child.exitCode,0);
}
async function main() {
  let running=await launch();
  try {
    const {app,pet,panel}=running;
    const flags=await app.evaluate(({BrowserWindow})=>{
      const win=BrowserWindow.getAllWindows().find(w=>w.webContents.getURL().endsWith('/index.html'));
      const p=win.webContents.getLastWebPreferences();
      return {top:win.isAlwaysOnTop(),frame:p.contextIsolation,sandbox:p.sandbox,node:p.nodeIntegration,background:win.getBackgroundColor(),resizable:win.isResizable()};
    });
    // getBackgroundColor returns RGB (it does not round-trip the alpha channel on Windows).
    if(process.env.BYTE_TEST_ALLOW_TOPMOST_MISMATCH==='1' && !flags.top) {
      console.warn('LIMITATION: native always-on-top reports false on this host, including the previous build. The remaining checks continue.');
      assert.equal((await panel.evaluate(()=>window.byte.snapshot())).settings.alwaysOnTop,true);
    } else assert.equal(flags.top,true);
    assert.deepEqual({...flags,top:undefined},{top:undefined,frame:true,sandbox:true,node:false,background:'#000000',resizable:false});
    assert.equal(await pet.evaluate(()=>typeof require),'undefined');
    assert.equal(await pet.evaluate(()=>typeof window.byte.ipcRenderer),'undefined');
    assert.equal(await pet.evaluate(()=>typeof window.byte.onChange(()=>{}) === 'function'),true);
    // A trusted pet renderer still cannot use preferences-only IPC.
    const senderRejected=await app.evaluate(async ({BrowserWindow})=>{
      const win=BrowserWindow.getAllWindows().find(w=>w.webContents.getURL().endsWith('/index.html'));
      return win.webContents.executeJavaScript("window.byte.settings({scale:4}).then(()=>false,()=>true)");
    });
    assert.equal(senderRejected,true);
    assert.equal(await panel.locator('#art-note').count(),0);
    assert.equal((await panel.evaluate(()=>window.byte.snapshot())).version,'1.0.0');
    assert.equal(await panel.locator('#room-view').isVisible(),true);
    assert.equal(await panel.locator('aside.sidebar').count(),0);
    assert.equal(await panel.locator('[role="tabpanel"]:visible').count(),1);
    await panel.locator('#settings-tab').click();
    assert.equal(await panel.locator('#desktop-preferences input#followCursor').isVisible(),true);
    assert.equal(await panel.locator('details').count(),0);
    await panel.locator('#settings-tab').press('ArrowLeft');
    await panel.waitForFunction(()=>document.body.dataset.view==='activity');
    assert.equal(await panel.locator('#activity-list li').count(),1);
    await panel.locator('#activity-tab').press('Home');
    await panel.waitForFunction(()=>document.body.dataset.view==='room');
    assert.equal(await panel.locator('#quit-header').isVisible(),true);
    const roomFlags=await app.evaluate(({BrowserWindow})=>{
      const w=BrowserWindow.getAllWindows().find(w=>w.webContents.getURL().endsWith('/settings.html'));
      return {minimizable:w.isMinimizable(),closable:w.isClosable()};
    });assert.deepEqual(roomFlags,{minimizable:true,closable:true});
    // Capture the new reference-inspired room at desktop and mobile widths.
    await panel.waitForFunction(()=>Boolean(document.querySelector('#preview').dataset.frame));
    assert.equal(await panel.locator('#preview').evaluate(canvas=>{
      const data=canvas.getContext('2d').getImageData(0,0,256,256).data;
      let opaque=0;for(let i=3;i<data.length;i+=4)if(data[i]>128)opaque++;
      return opaque>4000;
    }),true,'Byte must render before the first interaction');
    await panel.locator('#room-tab').blur(); await panel.mouse.move(2,2);
    await panel.screenshot({path:path.join(results,'preview-room-desktop.png'),fullPage:true});
    assert.equal(await panel.evaluate(()=>document.documentElement.scrollHeight<=window.innerHeight+2),true,'Default room should fit without a long scroll');
    for(const name of ['care','activity','settings']) {
      await panel.locator(`#${name}-tab`).click();
      assert.equal(await panel.locator('[role="tabpanel"]:visible').count(),1);
      await panel.screenshot({path:path.join(results,`preview-${name}-desktop.png`),fullPage:true});
    }
    await panel.locator('#room-tab').click();
    await panel.locator('#settings-tab').click();
    await panel.locator('#nightRoom').check();
    await panel.locator('#room-tab').click();
    await panel.waitForFunction(()=>document.body.dataset.night==='true');
    assert.match(await panel.locator('#night').textContent(),/Day room/);
    await panel.locator('#night').click();
    await panel.locator('#settings-tab').click();
    assert.equal(await panel.locator('#nightRoom').isChecked(),false);
    await panel.locator('#room-tab').click();
    const roomBounds=await app.evaluate(({BrowserWindow})=>{
      const win=BrowserWindow.getAllWindows().find(w=>w.webContents.getURL().endsWith('/settings.html'));
      const original=win.getBounds();win.setContentSize(390,820);return original;
    });
    await panel.waitForFunction(()=>window.innerWidth===390);
    assert.equal(await panel.evaluate(()=>document.documentElement.scrollWidth<=document.documentElement.clientWidth),true);
    await panel.screenshot({path:path.join(results,'preview-room-mobile.png'),fullPage:true});
    await panel.locator('#settings-tab').click();
    assert.equal(await panel.evaluate(()=>document.documentElement.scrollWidth<=document.documentElement.clientWidth),true);
    await panel.screenshot({path:path.join(results,'preview-settings-mobile.png'),fullPage:true});
    await panel.locator('#room-tab').click();
    await app.evaluate(({BrowserWindow},bounds)=>BrowserWindow.getAllWindows().find(w=>w.webContents.getURL().endsWith('/settings.html')).setBounds(bounds),roomBounds);
    await panel.locator('#night').click();
    await panel.waitForFunction(()=>document.body.dataset.night==='true');
    await panel.screenshot({path:path.join(results,'preview-room-night.png'),fullPage:true});
    await panel.locator('#night').click();
    await panel.locator('#talk').click();
    await panel.waitForFunction(async ()=>(await window.byte.snapshot()).reaction?.kind==='talk');
    const firstReply=await panel.locator('#speech').textContent();
    await panel.locator('#talk').click();
    await panel.waitForFunction(async ()=>(await window.byte.snapshot()).care.talks===2);
    await panel.waitForFunction(previous=>document.querySelector('#speech').textContent!==previous,firstReply);
    assert.notEqual(await panel.locator('#speech').textContent(),firstReply);
    await panel.locator('#dance').click();
    await panel.waitForFunction(()=>document.body.dataset.dancing==='true');
    assert.equal(await panel.locator('#preview').evaluate(el=>getComputedStyle(el).animationName),'happy-dance');
    await panel.locator('#settings-tab').click();
    await panel.locator('#reducedMotion').check();
    await panel.locator('#room-tab').click();
    assert.equal(await panel.locator('#preview').evaluate(el=>getComputedStyle(el).animationName),'none');
    await panel.locator('#settings-tab').click();
    await panel.locator('#reducedMotion').uncheck();
    await panel.locator('#room-tab').click();
    // Feeding cancels the dance before the star game starts.
    await panel.evaluate(()=>window.byte.action('pet'));
    await panel.locator('#star-game').click();
    await panel.locator('#stage').click({position:{x:80,y:150}});
    await panel.waitForFunction(async ()=>(await window.byte.snapshot()).care.starsCaught===1);
    await panel.waitForFunction(()=>document.querySelector('#star-count').textContent.includes('1 star caught'));
    assert.match(await panel.locator('#star-count').textContent(),/1 star caught/);
    const stageWidth=await panel.locator('#stage').evaluate(el=>el.clientWidth);
    await panel.locator('#stage').click({position:{x:stageWidth-70,y:150}});
    await panel.locator('#star-game').click();
    await panel.waitForTimeout(1600);
    assert.equal((await panel.evaluate(()=>window.byte.snapshot())).care.starsCaught,1);
    await panel.locator('#star-game').click();
    await panel.locator('#stage').click({position:{x:80,y:150}});
    await panel.locator('#care-tab').click();
    await panel.waitForTimeout(1600);
    assert.equal((await panel.evaluate(()=>window.byte.snapshot())).care.starsCaught,1,'Leaving Room must cancel a chase without a reward');
    await panel.locator('#settings-tab').click();
    await panel.locator('#reducedMotion').check();
    await panel.locator('#room-tab').click();
    await panel.locator('#star-game').click();
    await panel.locator('#stage').press('Space');
    await panel.waitForFunction(async ()=>(await window.byte.snapshot()).care.starsCaught===2);
    await panel.waitForFunction(()=>document.querySelector('#star-count').textContent.includes('2 stars caught'));
    await panel.locator('#star-game').click();
    await panel.locator('#settings-tab').click();
    await panel.locator('#reducedMotion').uncheck();
    await panel.locator('#toggle-pet').click();
    await panel.waitForFunction(async ()=>!(await window.byte.snapshot()).petVisible);
    await panel.locator('#toggle-pet').click();
    await panel.waitForFunction(async ()=>(await window.byte.snapshot()).petVisible);
    await panel.locator('#room-tab').click();
    // Real renderer pointer capture + native window drag, using controlled OS-cursor samples.
    // This does not claim a physical-mouse or mixed-DPI test.
    const beforeDrag=await app.evaluate(({BrowserWindow,screen})=>{
      const win=BrowserWindow.getAllWindows().find(w=>w.webContents.getURL().endsWith('/index.html'));
      const bounds=win.getBounds();
      global.__realCursor=screen.getCursorScreenPoint;
      global.__testCursor={x:bounds.x+84,y:bounds.y+90};
      screen.getCursorScreenPoint=()=>({...global.__testCursor});
      return bounds;
    });
    await pet.mouse.move(84,90); await pet.mouse.down();
    await new Promise(resolve=>setTimeout(resolve,180));
    await app.evaluate(()=>{global.__testCursor.x-=140;global.__testCursor.y-=100;});
    await waitUntil(()=>app.evaluate(({BrowserWindow},before)=>{
      const b=BrowserWindow.getAllWindows().find(w=>w.webContents.getURL().endsWith('/index.html')).getBounds();
      return b.x<before.x-100 && b.y<before.y-60;
    },beforeDrag),'Native window did not move during drag');
    await pet.mouse.up();
    await pet.locator('#pet').press('Enter');
    await pet.waitForFunction(async ()=>(await window.byte.snapshot()).mode==='pet');
    await panel.locator('#feed').click();
    await pet.waitForFunction(async ()=>(await window.byte.snapshot()).mode==='feed');
    const afterFeed=await pet.evaluate(()=>window.byte.snapshot());assert.equal(afterFeed.care.stats.fullness,87);
    await panel.locator('#play').click();
    await pet.waitForFunction(async ()=>(await window.byte.snapshot()).mode==='play');
    assert.equal((await pet.evaluate(()=>window.byte.snapshot())).care.activity[0].type,'play');
    await panel.locator('#nap').click();
    await pet.waitForFunction(async ()=>(await window.byte.snapshot()).sleeping);
    await panel.locator('#nap').click();
    await pet.waitForFunction(async ()=>!(await window.byte.snapshot()).sleeping);
    await panel.locator('#care-tab').click();
    assert.equal(await panel.locator('#fullness').getAttribute('value'),'87');
    await panel.locator('#activity-tab').click();
    assert.ok(await panel.locator('#activity-list li').count()>1);
    await panel.locator('#activity-tab').press('Escape');
    await panel.waitForFunction(()=>document.body.dataset.view==='room');
    await panel.locator('#settings-tab').click();
    await panel.locator('#followCursor').check();
    await panel.locator('#theme').selectOption('lagoon');
    await panel.locator('#scale').selectOption('2');
    await panel.locator('#alwaysOnTop').uncheck();
    await panel.locator('#reducedMotion').check();
    await panel.waitForFunction(()=>document.body.dataset.theme==='lagoon');
    const bounds=await app.evaluate(({BrowserWindow})=>{
      const win=BrowserWindow.getAllWindows().find(w=>w.webContents.getURL().endsWith('/index.html'));
      return {bounds:win.getBounds(),top:win.isAlwaysOnTop()};
    });
    assert.equal(bounds.bounds.width,120); assert.equal(bounds.bounds.height,148); assert.equal(bounds.top,false);
    const blocked=await pet.evaluate(async ()=>{try { await fetch('https://example.com'); return false; } catch { return true; }}); assert.equal(blocked,true);
    const prevented=await pet.evaluate(()=>window.open('https://example.com')===null); assert.equal(prevented,true);
    const escaped=await pet.evaluate(async ()=>{try{await fetch('byte://app/../package.json');return false;}catch{return true;}}); assert.equal(escaped,true);
    const protocolStatus=await app.evaluate(async ({session})=>(await session.fromPartition('byte-local').fetch('byte://app/package.json')).status);
    assert.equal(protocolStatus,404);
    const staticBounds=await app.evaluate(({BrowserWindow})=>BrowserWindow.getAllWindows().find(w=>w.webContents.getURL().endsWith('/index.html')).getBounds());
    await panel.locator('#desktop-mode').click();
    await waitUntil(()=>app.evaluate(({BrowserWindow})=>BrowserWindow.getAllWindows().find(w=>w.webContents.getURL().endsWith('/settings.html')).isMinimized()),'Desktop mode did not minimize to taskbar');
    await new Promise(resolve=>setTimeout(resolve,400));
    assert.deepEqual(await app.evaluate(({BrowserWindow})=>BrowserWindow.getAllWindows().find(w=>w.webContents.getURL().endsWith('/index.html')).getBounds()),staticBounds);
    await pet.locator('#open-room').focus();await pet.locator('#open-room').press('Enter');
    let reopened=app.windows().find(page=>page.url()==='byte://app/settings.html');
    if(!reopened) reopened=await app.waitForEvent('window',{predicate:page=>page!==pet});
    await reopened.waitForFunction(()=>document.querySelector('#preview').dataset.mode);
    await reopened.locator('#reducedMotion').uncheck();
    // Open panels pause movement. Close it and verify cursor-follow moves the native overlay.
    const beforeFollow=await app.evaluate(({BrowserWindow})=>{
      const b=BrowserWindow.getAllWindows().find(w=>w.webContents.getURL().endsWith('/index.html')).getBounds();
      global.__testCursor={x:b.x-300,y:b.y}; return b;
    });
    await reopened.locator('#desktop-mode').click();
    await waitUntil(()=>app.evaluate(({BrowserWindow},x)=>BrowserWindow.getAllWindows().find(w=>w.webContents.getURL().endsWith('/index.html')).getBounds().x<x-5,beforeFollow.x),'Cursor follow did not move the native window');
    await pet.evaluate(()=>window.byte.action('settings'));
    reopened=app.windows().find(page=>page.url()==='byte://app/settings.html');
    if(!reopened) reopened=await app.waitForEvent('window',{predicate:page=>page!==pet});
    await reopened.waitForFunction(()=>document.querySelector('#preview').dataset.mode);
    await reopened.locator('#reducedMotion').check();
    // Inspect the real native menu and exercise its feed callback without sending OS input.
    await app.evaluate(({Menu})=>{
      const original=Menu.buildFromTemplate;
      Menu.buildFromTemplate=function(template){global.__byteMenu=template; const menu=original.call(Menu,template); setTimeout(()=>menu.closePopup(),300); return menu;};
    });
    await pet.evaluate(()=>window.byte.menu());
    const labels=await app.evaluate(()=>global.__byteMenu.map(item=>item.label).filter(Boolean));
    for(const label of ['Feed a little snack','Time for a nap','Follow my cursor','Open Byte’s room','Quit Byte']) assert.ok(labels.includes(label));
    await app.evaluate(()=>global.__byteMenu.find(item=>item.label==='Feed a little snack').click());
    await pet.waitForFunction(async ()=>(await window.byte.snapshot()).mode==='feed');
    await reopened.screenshot({path:path.join(results,'settings.png')});
    await pet.screenshot({path:path.join(results,'pet.png'),omitBackground:true});
    await reopened.locator('#reset').click();
    await reopened.locator('#theme').selectOption('haze');
    await reopened.locator('#theme').blur();
    await pet.evaluate(()=>document.querySelector('#pet').blur());
    await reopened.screenshot({path:path.join(results,'preview-haze.png')});
    await reopened.locator('#theme').selectOption('lagoon');
    await app.evaluate(({screen})=>{screen.getCursorScreenPoint=global.__realCursor;});
    const savedPosition=JSON.parse(fs.readFileSync(path.join(profile,'byte-state.json'),'utf8')).position;
    await app.close(); running=null;
    running=await launch();
    const restored=await running.pet.evaluate(()=>window.byte.snapshot());
    assert.equal(restored.settings.theme,'lagoon'); assert.equal(restored.settings.followCursor,true);
    assert.equal(restored.settings.scale,2); assert.equal(restored.settings.reducedMotion,true); assert.equal(restored.settings.alwaysOnTop,false);
    assert.equal(restored.care.stats.fullness,99);assert.ok(restored.care.stats.friendship>10);
    assert.equal(restored.care.starsCaught,2);assert.equal(restored.care.talks,2);
    const restoredBounds=await running.app.evaluate(({BrowserWindow})=>BrowserWindow.getAllWindows().find(w=>w.webContents.getURL().endsWith('/index.html')).getBounds());
    assert.equal(restoredBounds.x,savedPosition.x); assert.equal(restoredBounds.y,savedPosition.y);
    assert.deepEqual(errors,[]);
    // A visible Quit button exits the full app, not just its room.
    const headerProcess=running.app.process();
    await exitsCleanly(()=>running.panel.locator('#quit-header').click(),headerProcess,'Quit button left Byte running');
    running=null;
    // The OS titlebar close follows the same complete-exit behavior.
    running=await launch();
    const nativeProcess=running.app.process();
    await running.app.evaluate(({BrowserWindow})=>{const w=BrowserWindow.getAllWindows().find(w=>w.webContents.getURL().endsWith('/settings.html'));setTimeout(()=>w.close(),50);});
    await waitUntil(async()=>nativeProcess.exitCode!==null,'Window close left Byte running');assert.equal(nativeProcess.exitCode,0);
    running=null;
    // The small cat has accessible room and quit controls of its own.
    running=await launch();
    const petProcess=running.app.process();
    await running.pet.locator('#pet-quit').focus();
    await exitsCleanly(()=>running.pet.locator('#pet-quit').press('Enter'),petProcess,'Cat quit control left Byte running');
    running=null;
    assert.deepEqual(errors,[]);
    console.log('PASS: talk, dance, star game/cancellation/counter persistence, reduced motion, show/hide, taskbar desktop mode, cat controls, native X and full quit, original interactions, security, drag/follow, and restart persistence.');
  } finally { if(running) await running.app.close().catch(()=>{}); }
}
main().catch(error=>{console.error(error);process.exitCode=1;});
