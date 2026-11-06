export const rgb = hex => hex.slice(1, 7).match(/../g).map(n => parseInt(n, 16));
export const hex = values => '#' + values.map(v => Math.round(v).toString(16).padStart(2, '0')).join('').toUpperCase();
export const mix = (a, b, weight) => hex(rgb(a).map((v, i) => v * (1 - weight) + rgb(b)[i] * weight));
export function luminance(color) {
  const c = rgb(color).map(n => { const v = n / 255; return v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; });
  return c[0] * 0.2126 + c[1] * 0.7152 + c[2] * 0.0722;
}
export const contrast = (a, b) => (Math.max(luminance(a), luminance(b)) + 0.05) / (Math.min(luminance(a), luminance(b)) + 0.05);
export function readable(color, background, minimum = 4.5) {
  const target = luminance(background) > 0.45 ? '#000000' : '#FFFFFF';
  for (let step = 0; step <= 100; step++) {
    const candidate = mix(color, target, step / 100);
    if (contrast(candidate, background) >= minimum) return candidate;
  }
  return target;
}
export function safeSurface(base, tint, foregrounds, maximum = 1) {
  for (let step = Math.round(maximum * 100); step >= 0; step--) {
    const candidate = mix(base, tint, step / 100);
    if (foregrounds.every(fg => contrast(fg, candidate) >= 4.5)) return candidate;
  }
  return base;
}
