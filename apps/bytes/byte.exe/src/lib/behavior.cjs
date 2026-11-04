'use strict';
const { clampPosition } = require('./state.cjs');

// All coordinates are Windows device-independent pixels, including negative monitor coordinates.
class Behavior {
  constructor(position, random = Math.random) {
    this.position = { ...position };
    this.random = random;
    this.mode = 'idle'; this.facing = 1; this.sleeping = false;
    this.until = 0; this.nextWander = 0; this.target = null;
  }
  action(action, now) {
    this.target = null;
    if (action === 'nap') {
      this.sleeping = !this.sleeping;
      this.mode = this.sleeping ? 'sleep' : 'idle';
      this.until = now + 1800;
    } else if (['pet', 'feed', 'play', 'talk', 'dance', 'catch-star'].includes(action)) {
      this.sleeping = false;
      this.mode = action === 'talk' ? 'pet' : ['dance', 'catch-star'].includes(action) ? 'play' : action;
      const duration = { feed: 2800, talk: 4500, dance: 3000, 'catch-star': 1800 }[action] || 1700;
      this.until = now + duration;
    }
    this.nextWander = now + 6000;
  }
  tick(now, dt, settings, area, size, cursor, paused = false) {
    if (this.sleeping) { this.mode = 'sleep'; return; }
    if (now < this.until) return;
    if (paused) { this.mode = 'idle'; this.target = null; return; }
    if (settings.reducedMotion) { this.mode = 'idle'; this.target = null; return; }
    if (settings.followCursor) {
      const center = { x: this.position.x + size.width / 2, y: this.position.y + size.height / 2 };
      // Stop shy of the pointer, so Byte doesn't sit under your clicks.
      const distance = Math.hypot(cursor.x - center.x, cursor.y - center.y);
      this.target = distance > 110 ? clampPosition({
        x: cursor.x - size.width / 2 - Math.sign(cursor.x - center.x) * 90,
        y: cursor.y - size.height / 2
      }, size, area) : null;
    } else if (settings.wander) {
      if (!this.target && now >= this.nextWander) {
        this.target = clampPosition({
          x: this.position.x + (this.random() < 0.5 ? -1 : 1) * (60 + this.random() * 130),
          y: this.position.y
        }, size, area);
        this.nextWander = now + 5500 + this.random() * 5500;
      }
    } else this.target = null;
    if (!this.target) { this.mode = 'idle'; return; }
    const dx = this.target.x - this.position.x, dy = this.target.y - this.position.y;
    const distance = Math.hypot(dx, dy);
    if (distance < 2) { this.target = null; this.mode = 'idle'; return; }
    const step = Math.min(distance, settings.speed * Math.min(dt, 0.1));
    this.position = { x: this.position.x + dx / distance * step, y: this.position.y + dy / distance * step };
    if (Math.abs(dx) > 0.5) this.facing = dx >= 0 ? 1 : -1;
    this.mode = 'walk';
  }
}
module.exports = { Behavior };
