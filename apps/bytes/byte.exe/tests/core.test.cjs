'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { DEFAULTS, normalizeState, settingsPatch, petSize, clampPosition, createStore } = require('../src/lib/state.cjs');
const { Behavior } = require('../src/lib/behavior.cjs');
const { validateManifest } = require('../src/lib/sprites.cjs');
const { INITIAL, normalizeCare, careAction } = require('../src/lib/care.cjs');
const area = { x: -1920, y: 0, width: 1920, height: 1040 }, size = petSize(3);

test('malformed preferences cannot inject arbitrary settings or unbounded window sizes', () => {
  assert.deepEqual(normalizeState({ settings: { scale: 50, followCursor: 'true', theme: '../x', speed: Infinity }, position: { x:NaN, y:10 } }), normalizeState(null));
  assert.deepEqual(settingsPatch({ speed:999, theme:'peach', scale:4, command:'anything' }), { scale:4, speed:100, theme:'peach' });
  assert.deepEqual(settingsPatch(null), {});
});
test('position restoration handles negative monitor coordinates and removed monitors', () => {
  assert.deepEqual(clampPosition({ x:-9000, y:9999 }, size, area), { x:-1920, y:844 });
  assert.deepEqual(clampPosition({ x:9000, y:-500 }, size, {x:0,y:0,width:1280,height:720}), {x:1112,y:0});
});
test('atomic persistence survives reload and corrupt data recovers with a visible warning', t => {
  const dir=fs.mkdtempSync(path.join(os.tmpdir(),'byte-store-')); t.after(()=>fs.rmSync(dir,{recursive:true,force:true}));
  const warnings=[], store=createStore(dir,message=>warnings.push(message));
  store.update({settings:{...DEFAULTS,theme:'lagoon',followCursor:true},position:{x:-500,y:350}});
  assert.equal(store.flush(),true);
  assert.equal(fs.existsSync(store.file+'.tmp'),false);
  const loaded=createStore(dir);
  assert.equal(loaded.state.settings.followCursor,true); assert.equal(loaded.state.settings.theme,'lagoon');
  assert.deepEqual(loaded.state.position,{x:-500,y:350});
  fs.writeFileSync(store.file,'{broken');
  assert.deepEqual(createStore(dir,m=>warnings.push(m)).state.settings,DEFAULTS); assert.equal(warnings.length,1);
});
test('save failures report a warning without crashing', t => {
  const dir=fs.mkdtempSync(path.join(os.tmpdir(),'byte-fail-')); t.after(()=>fs.rmSync(dir,{recursive:true,force:true}));
  const file=path.join(dir,'file'); fs.writeFileSync(file,'not a directory');
  const errors=[], store=createStore(file,m=>errors.push(m)); store.update({settings:DEFAULTS});
  assert.equal(store.flush(),false); assert.ok(errors.length>0);
});
test('nap overrides follow, feeding wakes Byte, and reactions expire', () => {
  const b=new Behavior({x:-500,y:300}); const settings={...DEFAULTS,followCursor:true};
  b.action('nap',0); b.tick(5000,.05,settings,area,size,{x:-300,y:500}); assert.equal(b.mode,'sleep');
  b.action('feed',5000); assert.equal(b.sleeping,false); b.tick(6000,.05,settings,area,size,{x:-300,y:500}); assert.equal(b.mode,'feed');
  b.tick(8000,.05,settings,area,size,{x:-100,y:500}); assert.equal(b.mode,'walk');
  b.action('pet',9000); b.tick(9100,.05,settings,area,size,{x:-100,y:500}); assert.equal(b.mode,'pet');
});
test('follow movement stays in work area, respects speed and stops near cursor', () => {
  const b=new Behavior({x:-500,y:300});
  b.tick(10000,.05,{...DEFAULTS,followCursor:true},area,size,{x:3000,y:400});
  assert.equal(b.mode,'walk'); assert.ok(b.position.x>-500); assert.ok(Math.hypot(b.position.x+500,b.position.y-300)<=2.41);
  for(let i=0;i<1000;i++) b.tick(11000+i*50,.05,{...DEFAULTS,followCursor:true},area,size,{x:3000,y:400});
  assert.ok(b.position.x<=-168); assert.ok(b.position.y>=0);
  b.tick(70000,.05,{...DEFAULTS,followCursor:true},area,size,{x:b.position.x+size.width/2,y:b.position.y+size.height/2}); assert.equal(b.mode,'idle');
});
test('reduced motion and paused interactions stop automatic movement', () => {
  const b=new Behavior({x:-500,y:300});
  b.tick(10000,.1,{...DEFAULTS,reducedMotion:true,followCursor:true},area,size,{x:0,y:0}); assert.equal(b.mode,'idle'); assert.deepEqual(b.position,{x:-500,y:300});
  b.tick(11000,.1,{...DEFAULTS,followCursor:true},area,size,{x:0,y:0},true); assert.deepEqual(b.position,{x:-500,y:300});
});
test('wander walks horizontally then returns to idle; disabled wander stays still', () => {
  const b=new Behavior({x:-500,y:300},()=>.75);
  b.tick(10000,.05,DEFAULTS,area,size,{x:0,y:0}); assert.equal(b.mode,'walk'); assert.equal(b.position.y,300);
  for(let i=0;i<80;i++) b.tick(10050+i*50,.05,DEFAULTS,area,size,{x:0,y:0}); assert.equal(b.mode,'idle');
  b.tick(20000,.1,{...DEFAULTS,wander:false},area,size,{x:0,y:0}); assert.equal(b.mode,'idle');
});
test('sprite packs must provide every state and cannot request URLs or path traversal', () => {
  const manifest=require('../src/assets/sprites.json'); assert.equal(validateManifest(manifest),manifest);
  for(const image of ['../private.png','https://example.com/a.png','nested/cat.png','cat.png?foo']) assert.throws(()=>validateManifest({...manifest,image}));
  assert.throws(()=>validateManifest({...manifest,animations:{idle:manifest.animations.idle}}));
});

test('care values are bounded, activity is sanitized, and old preferences migrate without losing settings', () => {
  const migrated=normalizeState({settings:{scale:4,theme:'lagoon'},position:{x:10,y:20}});
  assert.deepEqual(migrated.care.stats,INITIAL);assert.equal(migrated.settings.scale,4);
  const care=normalizeCare({stats:{happiness:Infinity,fullness:999,energy:-5},activity:[{type:'<script>',at:1},{type:'feed',at:2}]});
  assert.equal(care.stats.happiness,78);assert.equal(care.stats.fullness,100);assert.equal(care.stats.energy,0);assert.deepEqual(care.activity,[{type:'feed',at:2}]);
  const fed=careAction(normalizeCare(null),'feed',123);assert.equal(fed.stats.fullness,87);assert.equal(fed.activity[0].at,123);
  let loved=normalizeCare(null);for(let i=0;i<50;i++)loved=careAction(loved,'pet',i);
  assert.equal(loved.stats.happiness,100);assert.equal(loved.stats.friendship,100);assert.equal(loved.activity.length,8);
});
test('play wakes Byte, selects the new animation, and returns to idle', () => {
  const b=new Behavior({x:-500,y:300});b.action('nap',0);b.action('play',1000);
  assert.equal(b.mode,'play');assert.equal(b.sleeping,false);
  b.tick(4000,.05,{...DEFAULTS,wander:false},area,size,{x:0,y:0});assert.equal(b.mode,'idle');
});
test('atlas layout and optional play animation are validated', () => {
  const manifest=require('../src/assets/sprites.json');
  assert.equal(validateManifest(manifest).columns,4);
  assert.throws(()=>validateManifest({...manifest,columns:0}));
  assert.throws(()=>validateManifest({...manifest,animations:{...manifest.animations,play:{frames:[-1],frameMs:100}}}));
});

test('new counters migrate safely and persist alongside existing care and settings', t => {
  const dir=fs.mkdtempSync(path.join(os.tmpdir(),'byte-new-care-'));t.after(()=>fs.rmSync(dir,{recursive:true,force:true}));
  let care=normalizeCare({stats:{happiness:90},starsCaught:12,talks:4});
  care=careAction(care,'catch-star',1);care=careAction(care,'talk',2);care=careAction(care,'dance',3);
  assert.equal(care.starsCaught,13);assert.equal(care.talks,5);assert.equal(care.activity[0].type,'dance');
  const store=createStore(dir);store.update({settings:{...DEFAULTS,showPet:false},care,position:{x:-20,y:30}});assert.equal(store.flush(),true);
  const restored=createStore(dir).state;assert.equal(restored.care.starsCaught,13);assert.equal(restored.care.talks,5);assert.equal(restored.settings.showPet,false);
  assert.equal(normalizeCare({starsCaught:Infinity,talks:-30}).starsCaught,0);assert.equal(normalizeCare({talks:-30}).talks,0);
  assert.equal(careAction(normalizeCare({starsCaught:1000000}),'catch-star',4).starsCaught,1000000);
});
test('talk and dance wake Byte, use the approved animation states, and expire', () => {
  const b=new Behavior({x:-500,y:300});b.action('nap',0);b.action('talk',1000);
  assert.equal(b.sleeping,false);assert.equal(b.mode,'pet');
  b.tick(5400,.05,{...DEFAULTS,wander:false},area,size,{x:0,y:0});assert.equal(b.mode,'pet');
  b.tick(5501,.05,{...DEFAULTS,wander:false},area,size,{x:0,y:0});assert.equal(b.mode,'idle');
  b.action('dance',6000);assert.equal(b.mode,'play');
  b.tick(9001,.05,{...DEFAULTS,wander:false},area,size,{x:0,y:0});assert.equal(b.mode,'idle');
  b.action('catch-star',10000);assert.equal(b.mode,'play');
});
