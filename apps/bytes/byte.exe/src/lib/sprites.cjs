'use strict';
const STATES = ['idle', 'walk', 'sleep', 'pet', 'feed'];
function validateManifest(value) {
  if (!value || typeof value !== 'object') throw new Error('Missing sprite manifest');
  if (!/^[a-zA-Z0-9_-]+\.(png|webp|svg)$/.test(value.image)) throw new Error('Image must be a filename inside assets');
  const integer = (n, min, max) => Number.isInteger(n) && n >= min && n <= max;
  if (!integer(value.frameWidth, 8, 256) || !integer(value.frameHeight, 8, 256)) throw new Error('Invalid frame dimensions');
  if (value.columns !== undefined && !integer(value.columns, 1, 256)) throw new Error('Invalid atlas columns');
  for (const name of STATES) {
    const animation = value.animations?.[name];
    if (!animation || !integer(animation.frameMs, 60, 5000) || !Array.isArray(animation.frames) ||
        animation.frames.length < 1 || animation.frames.length > 32 ||
        animation.frames.some(n => !integer(n, 0, 255))) throw new Error(`Invalid animation: ${name}`);
  }
  if (value.animations.play) {
    const a = value.animations.play;
    if (!integer(a.frameMs, 60, 5000) || !Array.isArray(a.frames) || a.frames.length < 1 || a.frames.length > 32 || a.frames.some(n => !integer(n, 0, 255))) throw new Error('Invalid animation: play');
  }
  if (value.facing !== 'right' && value.facing !== 'left') throw new Error('Facing must be right or left');
  return value;
}
module.exports = { validateManifest, STATES };
