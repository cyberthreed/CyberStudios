'use strict';
// Procedural temporary art. This is NOT an attempt to reproduce approved Byte artwork.
const fs = require('node:fs');
const path = require('node:path');
const zlib = require('node:zlib');
const dir = path.join(__dirname, '..', 'src', 'assets');
fs.mkdirSync(dir, { recursive: true });
const palette = { outline: '#48415e', fur: '#706581', light: '#9382a3', ear: '#dba9cb', eye: '#b9f1e5', blush: '#e4a8c4', shine: '#f6e6f6' };
const animations = { idle: { frames: [0,1,2,3], frameMs: 420 }, walk: { frames: [4,5,6,7,8,9], frameMs: 125 }, sleep: { frames: [10,11,12,13], frameMs: 650 }, pet: { frames: [14,15,16,17], frameMs: 180 }, feed: { frames: [18,19,20,21], frameMs: 220 } };
function pixels(state, frame) {
  const rects = [];
  const r = (x,y,w,h,color) => rects.push({x,y,w,h,color:palette[color]||color});
  const snooze = state === 'sleep', step = state === 'walk' ? frame % 3 - 1 : 0;
  const bob = state === 'idle' ? (frame === 2 ? 1 : 0) : state === 'pet' ? frame % 2 : 0;
  // Tail, including a little crooked tip.
  r(7,25+bob,5,12,'outline'); r(4,22+bob,5,7,'outline'); r(3,20+bob,4,5,'outline');
  r(8,26+bob,3,9,'light'); r(5,23+bob,3,5,'fur');
  if (snooze) {
    r(10,29,28,9,'outline'); r(13,26,22,14,'outline'); r(12,30,24,7,'fur'); r(15,28,18,10,'fur');
    r(25,25,13,12,'outline'); r(25,22,4,6,'outline'); r(34,23,4,5,'outline');
    r(27,27,9,8,'light'); r(27,30,3,1,'outline'); r(33,30,3,1,'outline');
    r(31,32,2,1,'ear'); r(17,38,5,2,'light'); r(29,38,5,2,'light');
    r(37,13-(frame%2),3,1,'light'); r(39,14-(frame%2),1,1,'light'); r(37,15-(frame%2),3,1,'light');
  } else {
    r(13,25+bob,20,14,'outline'); r(15,25+bob,16,13,'fur'); r(15,27+bob,3,8,'light');
    r(14+step,36+bob,6,6-step,'outline'); r(27-step,36+bob,6,6+step,'outline');
    r(15+step,39+bob-step,4,2,'light'); r(28-step,39+bob+step,4,2,'light');
    r(12,15+bob,24,13,'outline'); r(15,12+bob,18,17,'outline');
    r(12,8+bob,5,12,'outline'); r(14,10+bob,5,9,'outline'); r(30,9+bob,6,12,'outline');
    r(14,12+bob,3,6,'ear'); r(32,12+bob,2,6,'ear');
    r(14,17+bob,20,9,'fur'); r(17,14+bob,14,13,'fur'); r(16,16+bob,3,4,'light');
    const closed = state === 'pet' || (state === 'idle' && frame === 3);
    if (closed) { r(18,21+bob,4,1,'eye'); r(28,21+bob,4,1,'eye'); }
    else { r(18,19+bob,4,4,'eye'); r(28,19+bob,4,4,'eye'); r(20,19+bob,1,3,'outline'); r(30,19+bob,1,3,'outline'); }
    r(24,23+bob,2,1,'ear'); r(25,24+bob,1,2,'outline'); r(16,24+bob,3,1,'blush'); r(31,24+bob,3,1,'blush');
    if (state === 'pet') {
      const y = 6 - frame % 3;
      r(23,y,2,1,'blush'); r(26,y,2,1,'blush'); r(22,y+1,7,2,'blush'); r(23,y+3,5,1,'blush'); r(24,y+4,3,1,'blush'); r(25,y+5,1,1,'blush');
    }
    if (state === 'feed') {
      r(33,37,12,5,'outline'); r(35,40,8,4,'outline'); r(34,38,10,2,'mint'); r(36,40,6,2,'#d7b5eb');
      r(36,35+(frame%2),3,3,'#dba980'); r(40,35,3,3,'#dba980');
    }
  }
  return rects;
}
// Use explicit fill values; no external resources, scripts, or embedded fonts.
palette.mint = '#b9e5de';
let body = '';
for (const [state, animation] of Object.entries(animations)) {
  animation.frames.forEach((index, local) => {
    body += `<g transform="translate(${index*48} 0)">` + pixels(state,local).map(r => `<rect x="${r.x}" y="${r.y}" width="${r.w}" height="${r.h}" fill="${r.color}"/>`).join('') + '</g>';
  });
}
fs.writeFileSync(path.join(dir, 'placeholder-cat.svg'), `<svg xmlns="http://www.w3.org/2000/svg" width="1056" height="48" viewBox="0 0 1056 48" shape-rendering="crispEdges">${body}</svg>\n`);
fs.writeFileSync(path.join(dir, 'sprites.json'), JSON.stringify({ placeholder:true, image:'placeholder-cat.svg', frameWidth:48, frameHeight:48, facing:'right', animations }, null, 2) + '\n');
// Tiny self-contained PNG encoder for the tray icon; no image dependency needed.
function crc32(buffer) { let c = 0xffffffff; for (const b of buffer) { c ^= b; for (let i=0;i<8;i++) c = (c>>>1) ^ ((c&1) ? 0xedb88320 : 0); } return (c ^ 0xffffffff) >>> 0; }
function chunk(type,data) { const tag=Buffer.from(type), len=Buffer.alloc(4), crc=Buffer.alloc(4); len.writeUInt32BE(data.length); crc.writeUInt32BE(crc32(Buffer.concat([tag,data]))); return Buffer.concat([len,tag,data,crc]); }
const raster = Buffer.alloc(48*48*4);
for (const r of pixels('idle',0)) {
  const c = r.color.slice(1), rgb = [0,2,4].map(i=>parseInt(c.slice(i,i+2),16));
  for(let y=r.y;y<Math.min(48,r.y+r.h);y++) for(let x=r.x;x<Math.min(48,r.x+r.w);x++) {
    const off=(y*48+x)*4; raster.set([...rgb,255],off);
  }
}
const raw=Buffer.alloc((48*4+1)*48);
for(let y=0;y<48;y++) raster.copy(raw,y*(48*4+1)+1,y*48*4,(y+1)*48*4);
const ihdr=Buffer.alloc(13); ihdr.writeUInt32BE(48,0); ihdr.writeUInt32BE(48,4); ihdr[8]=8; ihdr[9]=6;
fs.writeFileSync(path.join(dir,'icon.png'), Buffer.concat([Buffer.from([137,80,78,71,13,10,26,10]),chunk('IHDR',ihdr),chunk('IDAT',zlib.deflateSync(raw)),chunk('IEND',Buffer.alloc(0))]));
console.log('Temporary sprites and tray icon generated.');
