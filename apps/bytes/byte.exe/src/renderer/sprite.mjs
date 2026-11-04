export class Sprite {
  constructor(canvas) {
    this.canvas = canvas; this.context = canvas.getContext('2d', { alpha: true });
    this.state = null; this.timer = null; this.ready = false; this.started = performance.now();
  }
  async load(manifest) {
    this.manifest = manifest;
    this.image = new Image(); this.image.src = `byte://app/assets/${manifest.image}`;
    await this.image.decode();
    const count = Math.max(...Object.values(manifest.animations).flatMap(a => a.frames)) + 1;
    this.columns = manifest.columns || count;
    if (this.image.naturalWidth < this.columns * manifest.frameWidth || this.image.naturalHeight < Math.ceil(count / this.columns) * manifest.frameHeight) throw new Error('Sprite sheet is too small for its manifest');
    this.ready = true;
  }
  update(state) {
    if (this.state?.mode !== state.mode) this.started = performance.now();
    this.state = state; this.canvas.dataset.mode = state.mode; this.draw();
  }
  draw() {
    clearTimeout(this.timer);
    if (!this.ready || !this.state) return;
    const { mode, facing, settings } = this.state;
    const { frameWidth: width, frameHeight: height, animations } = this.manifest;
    const animation = animations[mode] || animations.idle;
    const elapsed = performance.now() - this.started;
    const index = settings.reducedMotion ? 0 : Math.floor(elapsed / animation.frameMs) % animation.frames.length;
    const frame = animation.frames[index]; this.canvas.dataset.frame = String(frame);
    const ctx = this.context, size = this.canvas.width;
    ctx.clearRect(0, 0, size, this.canvas.height); ctx.imageSmoothingEnabled = false; ctx.save();
    const flip = (facing === -1) !== (this.manifest.facing === 'left');
    if (flip) { ctx.translate(size, 0); ctx.scale(-1, 1); }
    const scale = Math.min(size / width, this.canvas.height / height);
    const dw = Math.round(width * scale), dh = Math.round(height * scale);
    ctx.drawImage(this.image, (frame % this.columns) * width, Math.floor(frame / this.columns) * height, width, height, Math.floor((size - dw) / 2), Math.floor((this.canvas.height - dh) / 2), dw, dh);
    ctx.restore();
    if (!settings.reducedMotion) this.timer = setTimeout(() => this.draw(), animation.frameMs - elapsed % animation.frameMs + 2);
  }
  stop() { clearTimeout(this.timer); }
}
