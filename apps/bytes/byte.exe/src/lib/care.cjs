'use strict';
const INITIAL = Object.freeze({ happiness: 78, fullness: 75, energy: 87, friendship: 10 });
const SAYINGS = Object.freeze([
  'you make this place feel like home ♡',
  'a tiny star told me you are doing okay ✧',
  'shall we chase a little starlight?',
  'I saved my softest purr for you ♡',
  'one small pause. one cozy moment.',
  'the best spot? right here with you ✦'
]);
const EVENTS = Object.freeze({
  hello: ['A new little chapter for Byte.', 'Your little companion is home.'],
  pet: ['A few pets, a little closer.', 'Byte is purring up a tiny storm.'],
  feed: ['A little snack for a little star.', 'Byte enjoyed a bowl of something lovely.'],
  play: ['A sparkle worth chasing.', 'One tiny adventure, together.'],
  nap: ['Daydreams are loading…', 'Byte is taking a cozy little nap.'],
  wake: ['Hello again, sleepy star.', 'Byte is ready for your company.'],
  talk: ['A little thought from Byte.', 'A few soft words, just for you.'],
  dance: ['A tiny happy dance.', 'Every little star has a little wiggle.'],
  'catch-star': ['A star caught, a wish kept.', 'Byte tucked another sparkle into his collection.']
});
function normalizeCare(value) {
  const stats = {};
  for (const key of Object.keys(INITIAL)) stats[key] = Number.isFinite(value?.stats?.[key])
    ? Math.max(0, Math.min(100, Math.round(value.stats[key]))) : INITIAL[key];
  const activity = Array.isArray(value?.activity) ? value.activity
    .filter(item => item && Object.hasOwn(EVENTS, item.type) && Number.isFinite(item.at) && item.at >= 0)
    .slice(0, 8).map(item => ({ type: item.type, at: item.at })) : [{ type: 'hello', at: 0 }];
  const count = value => Number.isSafeInteger(value) ? Math.max(0, Math.min(1000000, value)) : 0;
  return { stats, activity, starsCaught: count(value?.starsCaught), talks: count(value?.talks) };
}
function careAction(care, action, now = Date.now()) {
  const next = normalizeCare(care);
  const delta = { pet: { happiness: 8, friendship: 3 }, feed: { fullness: 12, happiness: 2 },
    play: { happiness: 10, friendship: 5 }, nap: { energy: 12 },
    talk: { friendship: 1 }, dance: { happiness: 4 }, 'catch-star': { happiness: 3, friendship: 1 } }[action] || {};
  for (const [key, value] of Object.entries(delta)) next.stats[key] = Math.min(100, next.stats[key] + value);
  if (Object.hasOwn(EVENTS, action)) next.activity = [{ type: action, at: now }, ...next.activity].slice(0, 8);
  if (action === 'catch-star') next.starsCaught = Math.min(1000000, next.starsCaught + 1);
  if (action === 'talk') next.talks = Math.min(1000000, next.talks + 1);
  return next;
}
module.exports = { INITIAL, EVENTS, SAYINGS, normalizeCare, careAction };
