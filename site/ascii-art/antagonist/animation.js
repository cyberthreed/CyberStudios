"use strict";

(() => {
  const frame = window.ASCII_FRAME;
  const error = document.getElementById("error");
  if (!frame || !frame.lines || !frame.levels || !frame.masks) {
    error.hidden = false;
    error.textContent = "The ASCII artwork data could not be loaded.";
    console.error(error.textContent);
    return;
  }

  const art = document.getElementById("art");
  const display = document.getElementById("display");
  const displayCtx = display.getContext("2d", { alpha: false });
  const viewport = document.getElementById("viewport");
  const ctx = art.getContext("2d", { alpha: false });
  const cellW = 7, cellH = 10;
  const width = frame.columns * cellW, height = frame.rows * cellH;
  const chars = frame.lines.join(""), tones = frame.levels.join("");
  const $ = id => document.getElementById(id);
  const inputs = { density: $("density"), speed: $("speed"), wind: $("wind"), lightning: $("lightning"), blink: $("blink"), reduced: $("reduced"), performance: $("performance") };
  const pauseButton = $("pause");
  const background = "#070809";
  art.width = width;
  art.height = height;

  const createCanvas = (w, h) => {
    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    return canvas;
  };
  const downsample = [];
  const phone = matchMedia("(max-width: 700px)");
  function present() {
    const box = display.getBoundingClientRect();
    const scale = phone.matches ? Math.min(devicePixelRatio, 2) / 2 : devicePixelRatio;
    const ratio = Math.min(box.width / width, box.height / height) * scale;
    const targetW = Math.max(1, Math.round(width * ratio));
    const targetH = Math.max(1, Math.round(height * ratio));
    if (display.width !== targetW || display.height !== targetH) {
      display.width = targetW;
      display.height = targetH;
    }
    let source = art, w = width, h = height, stage = 0;
    while (w / 2 >= targetW && h / 2 >= targetH) {
      w = Math.max(targetW, Math.round(w / 2));
      h = Math.max(targetH, Math.round(h / 2));
      const buffer = downsample[stage] || (downsample[stage] = createCanvas(w, h));
      if (buffer.width !== w || buffer.height !== h) { buffer.width = w; buffer.height = h; }
      const bufferCtx = buffer.getContext("2d", { alpha: false });
      bufferCtx.imageSmoothingEnabled = true;
      bufferCtx.imageSmoothingQuality = "high";
      bufferCtx.drawImage(source, 0, 0, w, h);
      source = buffer;
      stage++;
    }
    displayCtx.imageSmoothingEnabled = true;
    displayCtx.imageSmoothingQuality = "high";
    displayCtx.drawImage(source, 0, 0, targetW, targetH);
  }
  const atlasChars = Array.from(new Set(chars)).filter(c => c !== " ");
  const atlasLookup = new Map(atlasChars.map((c, i) => [c, i]));
  const atlas = createCanvas(atlasChars.length * cellW, 24 * cellH);
  const atlasCtx = atlas.getContext("2d");
  atlasCtx.font = 'bold 11px Consolas, "Cascadia Mono", "Courier New", monospace';
  atlasCtx.textBaseline = "alphabetic";
  for (let level = 1; level < 24; level++) {
    const shade = 235;
    atlasCtx.fillStyle = `rgb(${shade},${shade},${shade})`;
    atlasChars.forEach((char, index) => atlasCtx.fillText(char, index * cellW, level * cellH + 9));
  }
  const energyAtlas = createCanvas(atlas.width, atlas.height);
  const energyCtx = energyAtlas.getContext("2d");
  energyCtx.drawImage(atlas, 0, 0);
  energyCtx.globalCompositeOperation = "source-in";
  energyCtx.fillStyle = "#292929";
  energyCtx.fillRect(0, 0, energyAtlas.width, energyAtlas.height);
  const staticCanvas = createCanvas(width, height);
  const staticCtx = staticCanvas.getContext("2d", { alpha: false });
  function makeDetail(detail) {
    if (!detail) return null;
    const canvas = createCanvas(detail.lines[0].length * cellW, detail.lines.length * cellH);
    const detailCtx = canvas.getContext("2d");
    detailCtx.fillStyle = background;
    detailCtx.fillRect(0, 0, canvas.width, canvas.height);
    for (let y = 0; y < detail.lines.length; y++) {
      for (let x = 0; x < detail.lines[y].length; x++) {
        const col = atlasLookup.get(detail.lines[y][x]);
        if (col === undefined) continue;
        const level = Math.max(1, Math.min(23, detail.levels[y].charCodeAt(x) - 65));
        detailCtx.drawImage(atlas, col * cellW, level * cellH, cellW, cellH, x * cellW, y * cellH, cellW, cellH);
      }
    }
    detailCtx.globalCompositeOperation = "destination-in";
    for (const [extent, horizontal] of [[canvas.width, true], [canvas.height, false]]) {
      const gradient = detailCtx.createLinearGradient(0, 0, horizontal ? extent : 0, horizontal ? 0 : extent);
      gradient.addColorStop(0, "transparent");
      gradient.addColorStop(.15, "black");
      gradient.addColorStop(.85, "black");
      gradient.addColorStop(1, "transparent");
      detailCtx.fillStyle = gradient;
      detailCtx.fillRect(0, 0, canvas.width, canvas.height);
    }
    return canvas;
  }
  const details = [frame.eye, frame.weaponDetail, frame.neckDetail].map(detail => ({ detail, canvas: makeDetail(detail) }));
  const eyePaperCell = createCanvas(cellW, cellH);
  const eyePaperCtx = eyePaperCell.getContext("2d");
  eyePaperCtx.fillStyle = background;
  eyePaperCtx.fillRect(0, 0, cellW, cellH);
  eyePaperCtx.drawImage(atlas, atlasLookup.get("@") * cellW, 23 * cellH, cellW, cellH, 0, 0, cellW, cellH);
  const eyePaper = createCanvas(cellW * 2, cellH);
  const eyePaperScaled = eyePaper.getContext("2d");
  for (let py = 0; py < 2; py++) for (let px = 0; px < 4; px++)
    eyePaperScaled.drawImage(eyePaperCell, px * cellW / 2, py * cellH / 2, cellW / 2, cellH / 2);
  const groups = {};
  const groupOf = new Uint8Array(chars.length);
  for (const [number, name] of [[1, "hair"], [2, "fabric"]]) {
    const indices = frame.masks[name];
    let minX = frame.columns, maxX = 0, minY = frame.rows, maxY = 0;
    for (const index of indices) {
      if (chars[index] === " ") continue;
      const x = index % frame.columns, y = Math.floor(index / frame.columns);
      groupOf[index] = number;
      minX = Math.min(x, minX); maxX = Math.max(x, maxX);
      minY = Math.min(y, minY); maxY = Math.max(y, maxY);
    }
    if (maxX < minX || maxY < minY) {
      error.hidden = false;
      error.textContent = `The ${name} animation region is empty.`;
      console.error(error.textContent);
      return;
    }
    const canvas = createCanvas((maxX - minX + 1) * cellW, (maxY - minY + 1) * cellH);
    groups[name] = { canvas, ctx: canvas.getContext("2d"), x: minX * cellW, y: minY * cellH };
  }

  function included(index) {
    if (Number(inputs.density.value) >= 1) return true;
    let h = Math.imul(index ^ (index >>> 16), 0x45d9f3b);
    h = Math.imul(h ^ (h >>> 16), 0x45d9f3b);
    return ((h ^ (h >>> 16)) >>> 0) / 4294967296 < Number(inputs.density.value);
  }
  const PAPER_CHAR = "@", PAPER_LEVEL = 22;
  const clothCells = Array.from(frame.masks.fabric);
  function glyphAt(target, char, level, x, y) {
    const col = atlasLookup.get(char);
    if (col === undefined) return;
    target.drawImage(atlas, col * cellW, level * cellH, cellW, cellH, x, y, cellW, cellH);
  }
  function glyph(target, index, x, y, bright = false) {
    const col = atlasLookup.get(chars[index]);
    if (col === undefined) return;
    const level = bright ? 23 : Math.max(1, Math.min(23, tones.charCodeAt(index) - 65));
    target.drawImage(bright ? energyAtlas : atlas, col * cellW, level * cellH, cellW, cellH, x, y, cellW, cellH);
  }
  function rebuild() {
    staticCtx.fillStyle = background;
    staticCtx.fillRect(0, 0, width, height);
    for (const group of Object.values(groups)) group.ctx.clearRect(0, 0, group.canvas.width, group.canvas.height);
    for (let i = 0; i < chars.length; i++) {
      if (chars[i] === " " || !included(i)) continue;
      const x = (i % frame.columns) * cellW, y = Math.floor(i / frame.columns) * cellH;
      const name = groupOf[i] === 1 ? "hair" : groupOf[i] === 2 ? "fabric" : null;
      glyph(staticCtx, i, x, y);
      if (name) {
        const group = groups[name], gx = x - group.x, gy = y - group.y;
        group.ctx.fillStyle = background;
        group.ctx.fillRect(gx, gy, cellW, cellH);
        glyph(group.ctx, i, gx, gy);
      }
    }
    for (const i of clothCells) {
      const x = (i % frame.columns) * cellW, y = Math.floor(i / frame.columns) * cellH;
      staticCtx.fillStyle = background;
      staticCtx.fillRect(x, y, cellW, cellH);
      if (included(i)) glyphAt(staticCtx, PAPER_CHAR, PAPER_LEVEL, x, y);
    }
    if (Number(inputs.density.value) >= 1) {
      for (const { detail, canvas } of details) {
        if (canvas) staticCtx.drawImage(canvas, detail.x * cellW, detail.y * cellH,
          canvas.width / 2, canvas.height / 2);
      }
    }
  }
  rebuild();

  let paused = matchMedia("(prefers-reduced-motion: reduce)").matches;
  let time = 0, last = null, lastRender = 0, glow = true;
  const debug = new URLSearchParams(location.search).has("debug");
  let maskCanvas = null;
  if (debug) {
    maskCanvas = createCanvas(width, height);
    maskCanvas.id = "mask-preview";
    maskCanvas.hidden = true;
    viewport.appendChild(maskCanvas);
    const label = document.createElement("label");
    label.className = "control";
    label.textContent = "mask preview ";
    const select = document.createElement("select");
    for (const name of ["off", "static", "eye", "hair", "fabric", "electric", "rods", "weapon"]) {
      const option = document.createElement("option");
      option.value = name;
      option.textContent = name;
      select.appendChild(option);
    }
    label.appendChild(select);
    document.querySelector(".controls").appendChild(label);
    select.addEventListener("change", () => {
      const maskCtx = maskCanvas.getContext("2d");
      maskCtx.clearRect(0, 0, width, height);
      maskCanvas.hidden = select.value === "off";
      if (maskCanvas.hidden) return;
      let indices = frame.masks[select.value];
      if (select.value === "static") {
        const animated = new Set(["eye", "hair", "fabric", "electric", "rods"].flatMap(name => frame.masks[name]));
        indices = Array.from({ length: chars.length }, (_, i) => i).filter(i => chars[i] !== " " && !animated.has(i));
      }
      maskCtx.fillStyle = "rgba(255, 80, 100, .55)";
      for (const i of indices) maskCtx.fillRect((i % frame.columns) * cellW, Math.floor(i / frame.columns) * cellH, cellW, cellH);
    });
  }
  inputs.reduced.checked = paused;
  function syncPause() {
    pauseButton.textContent = paused ? "resume" : "pause";
    pauseButton.setAttribute("aria-pressed", String(paused));
  }
  syncPause();

  const hashUnit = (a, b = 0) => {
    let h = Math.imul(a * 374761393 + b * 668265263 + 0x2545f491, 0x85ebca6b);
    h = Math.imul(h ^ (h >>> 13), 0xc2b2ae35);
    return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
  };
  const smoothNoise = (x, seed) => {
    const i = Math.floor(x), f = x - i, u = f * f * (3 - 2 * f);
    return hashUnit(i, seed) * (1 - u) + hashUnit(i + 1, seed) * u;
  };
  function gustAt(t) {
    const base = .5 + .22 * Math.sin(t * .7) + .14 * Math.sin(t * 1.9 + 1.3);
    const burst = Math.pow(smoothNoise(t * .35, 91), 3) * 1.6;
    return Math.max(0, base + burst - .15);
  }
  function drawFlow(group, t, kind) {
    const wind = Number(inputs.wind.value);
    const strip = cellH * 2, chunk = cellW * (kind === "hair" ? 14 : 10);
    ctx.globalAlpha = Math.min(1, wind);
    for (let y = 0; y < group.canvas.height; y += strip) {
      const h = Math.min(strip, group.canvas.height - y);
      for (let x = 0; x < group.canvas.width; x += chunk) {
        const w = Math.min(chunk, group.canvas.width - x);
        const sourceX = (group.x + x + w / 2) / width * 1024;
        const sourceY = (group.y + y) / height * 1536;
        if (kind === "hair") {
          const reach = Math.min(1, Math.abs(sourceX - 240) / 120);
          const phase = t * 1.35 - sourceX * .008 - sourceY * .006;
          const dx = Math.sin(phase) * Math.min(1, wind) * reach * 2;
          const dy = Math.sin(phase * .73) * Math.min(1, wind) * reach;
          ctx.drawImage(group.canvas, x, y, w, h, group.x + x + dx, group.y + y + dy, w, h);
          continue;
        }
        const reach = Math.max(0, Math.min(1, (sourceX - 300) / 300));
        if (reach <= 0) {
          ctx.drawImage(group.canvas, x, y, w, h, group.x + x, group.y + y, w, h);
          continue;
        }
        const id = (Math.floor(y / strip) * 131 + Math.floor(x / chunk)) | 0;
        const lag = hashUnit(Math.floor(y / strip), 7);
        const anchorDist = Math.hypot(sourceX - 260, sourceY - 690) / 500;
        const delayed = gustAt(t - anchorDist * .55 - lag * .25);
        const rate = 4 + lag * 7;
        const flutter = (smoothNoise(t * rate + lag * 40, 17 + (id & 7)) - .5) * 2;
        const curl = smoothNoise(t * (1.2 + lag) + sourceY * .01, 53) - .5;
        const drive = Math.min(1.5, wind) * reach * (.4 + anchorDist * .8);
        const dx = drive * (delayed * 20 + flutter * (3 + delayed * 9));
        const dy = drive * (curl * 12 + flutter * 3 * delayed - delayed * 2);
        ctx.drawImage(group.canvas, x, y, w, h, group.x + x + Math.round(dx), group.y + y + Math.round(dy), w, h);
      }
      ctx.globalAlpha = 1;
    }
  }
  const cloth = clothCells.filter(i => chars[i] !== PAPER_CHAR).map(i => {
    const column = i % frame.columns, row = Math.floor(i / frame.columns);
    const sx = (column + .5) * cellW / width * 1024, sy = (row + .5) * cellH / height * 1536;
    const reach = Math.pow(Math.max(0, Math.min(1, (sx - 300) / 300)), 1.3);
    const along = Math.max(0, (sx - 260) / 700);
    return { i, x: column * cellW, y: row * cellH, sx, sy, reach, along, strip: smoothNoise(sy * .012, 5), ply: smoothNoise(sy * .03 + sx * .004, 29) };
  });
  function drawCloth(t) {
    const wind = Math.min(1.5, Number(inputs.wind.value));
    const dense = Number(inputs.density.value) >= 1;
    for (const c of cloth) {
      let dx = 0, dy = 0;
      if (c.reach > 0 && wind > 0) {
        const gust = gustAt(t - c.along * .6 - c.strip * .3);
        const p1 = t * (2.1 + c.strip * 1.3) - c.sx * .021 - c.sy * .006 + c.ply * 2;
        const p2 = t * (3.6 + c.ply) - c.sx * .047 + c.strip * 6;
        const k = c.reach * wind;
        dx = k * (gust * (14 + 8 * c.strip) + 3 * Math.sin(p2 * .8));
        dy = k * ((9 + 12 * gust) * (.5 + c.strip) * Math.sin(p1) + 4 * c.reach * Math.sin(p2) - gust * 8 * c.ply);
      }
      if (!dense && !included(c.i)) continue;
      const x = c.x + Math.round(dx), y = c.y + Math.round(dy);
      ctx.fillStyle = background;
      ctx.fillRect(x, y, cellW, cellH);
      glyph(ctx, c.i, x, y);
    }
  }
  function drawEnergy(t, intensity) {
    if (intensity <= 0) return;
    const electric = frame.masks.electric;
    const cols = frame.columns, rows = Math.floor(height / cellH);
    const tick = Math.floor(t * 10);
    const mix = (a, b, c = 0) => {
      let h = Math.imul(a + 0x9e3779b9, 0x85ebca6b) ^ Math.imul(b + 0x7f4a7c15, 0xc2b2ae35) ^ Math.imul(c + 0x165667b1, 0x27d4eb2f);
      h = Math.imul(h ^ (h >>> 15), 0x2c1b3c6d);
      h = Math.imul(h ^ (h >>> 12), 0x297a2d39);
      return ((h ^ (h >>> 15)) >>> 0) / 4294967296;
    };
    const rng = seed => {
      let s = Math.imul(seed, 0x9e3779b1) >>> 0;
      return () => {
        s = (s + 0x6d2b79f5) >>> 0;
        let r = Math.imul(s ^ (s >>> 15), 1 | s);
        r ^= r + Math.imul(r ^ (r >>> 7), 61 | r);
        return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
      };
    };
    const jolt = (x, y, ch, dark, a) => {
      if (x < 0 || y < 0 || x >= cols || y >= rows) return;
      ctx.globalAlpha = a;
      ctx.fillStyle = "#070809";
      ctx.fillRect(x * cellW, y * cellH, cellW, cellH);
      ctx.fillStyle = dark;
      ctx.fillText(ch, x * cellW, y * cellH + 9);
    };
    const run = (x0, y0, x1, y1, a, bright) => {
      const dx = Math.abs(x1 - x0), dy = Math.abs(y1 - y0);
      const sx = x0 < x1 ? 1 : -1, sy = y0 < y1 ? 1 : -1;
      const steep = dy > dx * 1.8, flat = dx > dy * 1.8;
      const ch = steep ? "|" : flat ? "-" : (sx * sy > 0 ? "\\" : "/");
      let err = dx - dy, x = x0, y = y0;
      for (let guard = 0; guard < 60; guard++) {
        jolt(x, y, ch, bright ? "#e2e2e2" : "#5a5a5a", a);
        if (x === x1 && y === y1) break;
        const e2 = err * 2;
        if (e2 > -dy) { err -= dy; x += sx; }
        if (e2 < dx) { err += dx; y += sy; }
      }
    };
    const bolt = (rand, x, y, angle, length, depth, a, bright) => {
      let travelled = 0;
      while (travelled < length) {
        const step = 3 + Math.floor(rand() * 6);
        if (rand() < .2) angle += (rand() < .5 ? -1 : 1) * (.8 + rand() * .7);
        else angle += (rand() - .5) * .8;
        const nx = Math.round(x + Math.cos(angle) * step * .9);
        const ny = Math.round(y + Math.sin(angle) * step * .55);
        run(x, y, nx, ny, a, bright && travelled < 6);
        if (depth < 2 && rand() < .34) bolt(rand, nx, ny, angle + (rand() < .5 ? -1 : 1) * (.7 + rand() * .8), length * (.3 + rand() * .3), depth + 1, a * .85, false);
        if (rand() < .16) jolt(nx + Math.round(rand() * 2 - 1), ny + Math.round(rand() * 2 - 1), rand() < .5 ? "*" : "+", "#6a6a6a", a);
        x = nx; y = ny; travelled += step;
      }
    };
    ctx.font = 'bold 12px Consolas, "Courier New", monospace';
    ctx.textBaseline = "alphabetic";
    const tips = [[212,410],[215,459],[328,406],[330,452]].map(([px, py]) => [Math.round(px / 1024 * cols), Math.round(py / 1536 * rows)]);

    for (let n = 0; n < electric.length; n++) {
      const i = electric[n];
      if (chars[i] === " " || !included(i)) continue;
      const x = i % cols, y = Math.floor(i / cols);
      const patch = (x >> 3) * 977 + (y >> 2);
      const live = mix(patch, tick) < .07 * intensity + .01 && mix(i, tick >> 1, 3) < .65;
      if (!live) continue;
      ctx.globalAlpha = Math.min(.95, .4 + intensity * .3);
      glyph(ctx, i, x * cellW, y * cellH, true);
    }

    const slots = 9;
    for (let s = 0; s < slots; s++) {
      for (let age = 0; age < 4; age++) {
        const born = tick - age;
        const h = mix(born, s, 11);
        if (h > (.3 + intensity * .08) / (1 + s * .1)) continue;
        const life = 1 + Math.floor(mix(born, s, 12) * 3);
        if (age >= life) continue;
        if (age > 0 && mix(tick, s + age * 5, 13) < .35) continue;
        const rand = rng(born * 31 + s * 7919 + 5);
        const strong = mix(born, s, 14) < .18;
        const a = Math.min(1, (strong ? .95 : .7) * (1 - age * .18) * (.5 + intensity * .5));
        let ox, oy, angle;
        const useTip = mix(born, s, 15) < .45;
        if (useTip) {
          const tip = tips[Math.floor(mix(born, s, 16) * 4)];
          ox = tip[0]; oy = tip[1];
          angle = (tip[1] < 450 / 1536 * rows ? -.5 : .4) + (rand() - .5) * 1.6 + (tip[0] < cols * .22 ? Math.PI : 0);
          if (tip[0] > cols * .3) angle = (rand() - .5) * 2.2;
        } else {
          const cell = electric[Math.floor(mix(born, s, 17) * electric.length)];
          ox = cell % cols; oy = Math.floor(cell / cols);
          angle = (rand() - .5) * 2.6 + (mix(born, s, 18) < .3 ? Math.PI : 0);
        }
        bolt(rand, ox, oy, angle, strong ? 50 + rand() * 40 : 14 + rand() * 24, 0, a, strong);
        if (strong) {
          for (let k = 0; k < 7; k++) {
            jolt(ox + Math.round((rand() - .5) * 16), oy + Math.round((rand() - .5) * 10), "*.+'`,"[k % 6], "#8a8a8a", a * .7);
          }
        }
      }
    }

    for (let pair = 0; pair < 2; pair++) {
      const g = mix(tick, pair, 21);
      if (g > .09 * (.5 + intensity)) continue;
      const a = tips[pair * 2], b = tips[pair * 2 + 1];
      const rand = rng(tick * 13 + pair * 101);
      let x = a[0], y = a[1];
      const parts = 3 + Math.floor(rand() * 3);
      for (let k = 1; k <= parts; k++) {
        const f = k / parts;
        const nx = Math.round(a[0] + (b[0] - a[0]) * f + (k === parts ? 0 : (rand() - .5) * 9));
        const ny = Math.round(a[1] + (b[1] - a[1]) * f + (k === parts ? 0 : (rand() - .5) * 3));
        run(x, y, nx, ny, .9, true);
        x = nx; y = ny;
      }
    }

    for (let i = 0; i < tips.length; i++) {
      if (mix(tick, i, 22) > .12 * (.5 + intensity)) continue;
      const rand = rng(tick * 7 + i);
      for (let k = 0; k < 3; k++) {
        jolt(tips[i][0] + Math.round((rand() - .5) * 7), tips[i][1] + Math.round((rand() - .5) * 5), "*+/\\"[Math.floor(rand() * 4)], "#9a9a9a", .85);
      }
    }
    ctx.globalAlpha = 1;
  }
  function blinkAmount(t) {
    let start = 5, cycle = 0;
    while (t > start + .38) {
      cycle++;
      start += 4 + ((Math.sin(cycle * 91.7) + 1) * 2.5) + (cycle % 7 === 0 ? 6 : 0);
    }
    const elapsed = t - start;
    if (elapsed < 0 || elapsed > .38) return 0;
    if (elapsed < .12) return elapsed / .12;
    if (elapsed < .20) return 1;
    return 1 - (elapsed - .20) / .18;
  }
  function drawEye(t) {
    const blink = inputs.blink.checked ? blinkAmount(t) : 0;
    const sx = width / 1024, sy = height / 1536;
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(165 * sx, 252 * sy);
    ctx.bezierCurveTo(180 * sx, 234 * sy, 225 * sx, 232 * sy, 251 * sx, 251 * sy);
    ctx.bezierCurveTo(229 * sx, 273 * sy, 184 * sx, 274 * sy, 165 * sx, 252 * sy);
    ctx.closePath();
    ctx.clip();
    ctx.fillStyle = "#101112";
    ctx.font = 'bold 9px Consolas, "Courier New", monospace';
    const gaze = Math.sin(t * .55) * .6;
    for (let i = 0; i < 32; i++) {
      const angle = i * Math.PI * 2 / 32;
      ctx.fillText(".", (205 + gaze + Math.cos(angle) * 11) * sx,
        (251 + Math.sin(angle) * 10) * sy);
    }
    for (let px = -3; px <= 3; px += 2) for (let py = -3; py <= 3; py += 2)
      ctx.fillText(":", (205 + gaze + px) * sx, (248 + py) * sy);
    ctx.restore();
    if (blink > 0) {
      const x = 164 * sx, y = 232 * sy, w = 88 * sx, h = 43 * sy;
      ctx.save();
      ctx.beginPath();
      ctx.moveTo(165 * sx, 252 * sy);
      ctx.bezierCurveTo(180 * sx, 234 * sy, 225 * sx, 232 * sy, 251 * sx, 251 * sy);
      ctx.bezierCurveTo(229 * sx, 273 * sy, 184 * sx, 274 * sy, 165 * sx, 252 * sy);
      ctx.closePath();
      ctx.clip();
      ctx.save();
      ctx.translate(frame.eye.x * cellW, frame.eye.y * cellH);
      ctx.fillStyle = ctx.createPattern(eyePaper, "repeat");
      ctx.fillRect(x - frame.eye.x * cellW, y - frame.eye.y * cellH, w, h);
      ctx.restore();
      ctx.save();
      ctx.beginPath();
      ctx.moveTo(165 * sx, 252 * sy);
      ctx.bezierCurveTo(180 * sx, (234 + 34 * blink) * sy,
        225 * sx, (232 + 34 * blink) * sy, 251 * sx, 251 * sy);
      ctx.bezierCurveTo(229 * sx, 273 * sy, 184 * sx, 274 * sy, 165 * sx, 252 * sy);
      ctx.closePath();
      ctx.clip();
      ctx.drawImage(staticCanvas, x, y, w, h, x, y, w, h);
      ctx.restore();
      ctx.fillStyle = "#101112";
      ctx.font = 'bold 10px Consolas, "Courier New", monospace';
      for (let sourceX = 168; sourceX <= 247; sourceX += 2.5) {
        const u = (sourceX - 165) / 86;
        const lidY = 252 - 21 * 4 * u * (1 - u) + 32 * blink * 4 * u * (1 - u);
        ctx.fillText("_", sourceX * sx, lidY * sy);
      }
      ctx.restore();
    } else {
      return;
    }
  }
  function render(t) {
    ctx.drawImage(staticCanvas, 0, 0);
    drawFlow(groups.hair, t, "hair");
    drawCloth(t);
    drawEnergy(t, Number(inputs.lightning.value));
    drawEye(t);
    present();
    art.dataset.time = t.toFixed(3);
    art.dataset.blink = blinkAmount(t).toFixed(2);
  }
  function loop(now) {
    requestAnimationFrame(loop);
    if (paused || document.hidden) { last = null; return; }
    if (last === null) last = now;
    time += Math.min(1, (now - last) / 1000) * Number(inputs.speed.value);
    last = now;
    if (now - lastRender >= 1000 / Number(inputs.performance.value)) { render(time); lastRender = now; }
  }
  render(0);
  requestAnimationFrame(loop);

  pauseButton.addEventListener("click", () => { paused = !paused; if (!paused) inputs.reduced.checked = false; last = null; syncPause(); });
  inputs.reduced.addEventListener("change", () => { paused = inputs.reduced.checked; last = null; syncPause(); if (paused) render(time); });
  inputs.density.addEventListener("input", () => { $("densityValue").textContent = `${Math.round(Number(inputs.density.value) * 100)}%`; rebuild(); render(time); });
  inputs.speed.addEventListener("input", () => { $("speedValue").textContent = `${Number(inputs.speed.value)}×`; });
  for (const input of [inputs.wind, inputs.lightning, inputs.blink]) input.addEventListener("input", () => render(time));
  $("glow").addEventListener("click", event => {
    glow = !glow;
    display.style.filter = glow ? "drop-shadow(0 0 2px #cbd4dd55)" : "none";
    event.currentTarget.textContent = `glow: ${glow ? "on" : "off"}`;
    event.currentTarget.setAttribute("aria-pressed", String(glow));
  });
  if (phone.matches) { glow = false; $("glow").textContent = "glow: off"; $("glow").setAttribute("aria-pressed", "false"); }
  else display.style.filter = "drop-shadow(0 0 2px #cbd4dd55)";
  function resizeArt(zoomed) {
    for (const canvas of [display, maskCanvas].filter(Boolean)) {
      canvas.classList.toggle("zoomed", zoomed);
      canvas.style.width = zoomed ? "min(1500px, 190%)" : "100%";
      canvas.style.height = zoomed ? "auto" : "100%";
    }
    present();
  }
  $("fit").addEventListener("click", () => { resizeArt(false); viewport.scrollTo(0, 0); });
  $("zoom").addEventListener("click", () => resizeArt(!display.classList.contains("zoomed")));
  const resizeObserver = new ResizeObserver(present);
  resizeObserver.observe(viewport);
  resizeObserver.observe(display);
  $("full").addEventListener("click", async () => {
    try { if (!document.fullscreenElement) await viewport.requestFullscreen(); else await document.exitFullscreen(); }
    catch (cause) { error.hidden = false; error.textContent = `Fullscreen unavailable: ${cause.message}`; }
  });
  function exportPNG(scale, name) {
    const output = createCanvas(width * scale, height * scale);
    const outputCtx = output.getContext("2d", { alpha: false });
    outputCtx.imageSmoothingEnabled = false;
    outputCtx.drawImage(art, 0, 0, output.width, output.height);
    output.toBlob(blob => {
      if (!blob) { error.hidden = false; error.textContent = "PNG export failed."; return; }
      const url = URL.createObjectURL(blob), link = document.createElement("a");
      link.href = url; link.download = name; link.click();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    }, "image/png");
  }
  $("screenshot").addEventListener("click", () => exportPNG(1, "antagonist-ascii-screenshot.png"));
  $("export").addEventListener("click", () => exportPNG(2, "antagonist-ascii-high-resolution.png"));
  if (debug) window.artDebug = { render, blinkAmount, masks: frame.masks, groups };
})();
