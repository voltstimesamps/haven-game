// enable debug options via url variable setting. doesn't work right now.

const query = new URLSearchParams(globalThis.location?.search ?? '');
const choice = (query.get('debug') ?? query.get('option') ?? '').toLowerCase();

const DEBUG_OPTIONS = {
  colliders: choice === '' || choice === 'all' || choice === 'colliders',
  chaser: choice === '' || choice === 'all' || choice === 'chaser'
};

if (choice === 'off' || choice === 'none') {
  DEBUG_OPTIONS.colliders = false;
  DEBUG_OPTIONS.chaser = false;
}

export function debugEnabled(option) {
  return DEBUG_OPTIONS[option] === true;
}
