// builds the level's tile sprites and the darker decorative backdrop behind them.

import { getMapRows, getMapColumns } from './grid.js';
import { hash, tileCell, pickShade, shadedImage } from './shading.js';

export function createTileGroups(level) {
  const { size, originX, originY, definitions, map } = level.tiles;
  const groups = [];

  for (const [character, definition] of Object.entries(definitions)) {
    const group = new Group();

    group.tile = character;
    group.w = size;
    group.h = size;
    group.solid = definition.solid === true;

    // level tiles are static (not simulated physics objects)
    group.physics = 'static';

    // note q5 draws stuff at half size
    group.img = definition.image;

    group.addTiles(map, originX, originY, size, size);

    if (definition.tint) {
      applyTint(group, definition, level);
    }

    // ground checks and the pogo only count level collisions.
    for (const tile of group) {
      tile.isTile = true;
    }

    groups.push(group);
  }

  return groups;
}

// tint can be one colour or a list to pick from per tile.
function applyTint(group, definition, level) {
  const { size, originX, originY } = level.tiles;
  const palette = [definition.tint].flat();

  for (const tile of group) {
    const col = tileCell(tile.x, originX, size);
    const row = tileCell(tile.y, originY, size);
    const base = palette[Math.floor(hash(col, row, 7) * palette.length)];
    const shade = pickShade(base, col, row, [0.7, 1]);

    tile.img = shadedImage(definition.image, shade);
    tile.tint = shade;
  }
}

export function deleteTileGroups(groups) {
  for (const group of groups) {
    group.deleteAll();
  }
}

export function connectPlayerToSolidTiles(player, groups) {
  for (const group of groups) {
    if (group.solid) {
      player.collides(group);
    }
  }
}

// darker tiles drawn around and behind the playable area
export function createBackdrop(level) {
  const settings = level.backdrop;

  if (!settings) {
    return null;
  }

  const { size, originX, originY } = level.tiles;
  const rowCount = getMapRows(level).length;
  const colCount = getMapColumns(level);
  const margin = settings.margin ?? 8;

  const backdrop = new Visuals();
  backdrop.img = settings.image;

  for (let row = -margin; row < rowCount + margin; row++) {
    for (let col = -margin; col < colCount + margin; col++) {
      const visual = new backdrop.Visual(
        originX + col * size,
        originY + row * size
      );

      const palette = settings.colors;
      const pick = Math.floor(hash(col, row, 7) * palette.length);
      const shade = pickShade(palette[pick], col, row, settings.brightness);

      visual.img = shadedImage(settings.image, shade);
      visual.tint = color(shade);
    }
  }

  return backdrop;
}

// backdrop isn't a sprite so it isn't auto drawn; we draw it ourselves to keep it below everything.
// skips anything offscreen.
export function drawBackdrop(backdrop, pad) {
  if (!backdrop) {
    return;
  }

  imageMode(CENTER);

  const halfW = width / 2 / camera.zoom + pad;
  const halfH = height / 2 / camera.zoom + pad;

  for (const visual of backdrop) {
    if (
      Math.abs(visual.x - camera.x) < halfW &&
      Math.abs(visual.y - camera.y) < halfH
    ) {
      visual.draw();
    }
  }
}