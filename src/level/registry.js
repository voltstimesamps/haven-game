// what is level? why is level? how is level? registry knows
// todo convert levels to json
//   for (const id of LEVEL_IDS) {
//     registerLevel(await (await fetch(`levels/${id}.json`)).json());
//   }

import { levels as builtInLevels } from '../maps/levels.js';
import { getMapRows } from './grid.js';

const registry = new Map();

const EMPTY_TILE_CHARACTERS = new Set([' ', '.']);

export function registerLevel(level) {
  validateLevel(level);

  registry.set(level.id, {
    objects: {},
    signs: [],
    intro: null,
    irisIn: false,
    ...level
  });
}

export function getLevel(id) {
  const level = registry.get(id);

  if (!level) {
    throw new Error(`Unknown level ID: ${id}`);
  }

  return level;
}

export function listLevelIds() {
  return [...registry.keys()];
}

// check if levels were written correctly (headache saver 3000)
function validateLevel(level) {
  const name = level?.id ?? '(no id)';
  const fail = (message) => {
    throw new Error(`Level "${name}": ${message}`);
  };

  if (!level || typeof level.id !== 'string') fail('missing string "id".');
  if (!level.tiles) fail('missing "tiles".');
  if (!(level.tiles.size > 0)) fail('tiles.size must be a positive number.');
  if (typeof level.tiles.map !== 'string') fail('tiles.map must be a string.');
  if (!level.tiles.definitions) fail('missing tiles.definitions.');
  if (!level.player?.tile) fail('missing player.tile.');

  const rows = getMapRows(level);

  rows.forEach((row, rowIndex) => {
    [...row].forEach((character, colIndex) => {
      if (
        !EMPTY_TILE_CHARACTERS.has(character) &&
        !(character in level.tiles.definitions)
      ) {
        fail(
          `map has "${character}" at row ${rowIndex}, col ${colIndex} ` +
          'but tiles.definitions has no entry for it.'
        );
      }
    });
  });

  if (level.intro === 'door' && !level.objects?.escapeDoor) {
    fail('intro "door" needs objects.escapeDoor.');
  }
}

for (const level of Object.values(builtInLevels)) {
  registerLevel(level);
}