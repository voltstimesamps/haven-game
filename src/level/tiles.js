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
    group.solid = false;

    // level tiles are static (not simulated physics objects)
    group.physics = 'static';

    // note q5 draws stuff at half size
    group.img = definition.image;

    group.addTiles(map, originX, originY, size, size);

    if (definition.tint) {
      applyTint(group, definition, level);
    }

    // prevent level tile visuals from having individual colliders
    for (const tile of group) {
      tile.deleteColliders();
      tile.physicsEnabled = false;
    }

    groups.push(group);
  }

  const terrainGroup = buildUnifiedColliderSprite(level);
  if (terrainGroup) {
    groups.push(terrainGroup);
  }

  return groups;
}

// merge all tiles together into a single hitbox
function buildUnifiedColliderSprite(level) {
  const { size, originX, originY, definitions } = level.tiles;
  const rows = getMapRows(level);
  const rowCount = rows.length;
  const colCount = getMapColumns(level);

  const visited = Array.from({ length: rowCount }, () =>
    Array(colCount).fill(false)
  );

  const isSolidAt = (r, c) => {
    const ch = rows[r]?.[c];
    return ch && definitions[ch]?.solid === true;
  };

  const terrainGroup = new Group();
  terrainGroup.physics = 'static';
  terrainGroup.visible = false;
  terrainGroup.solid = true;

  const terrain = new terrainGroup.Sprite(originX, originY, size, size);
  terrain.deleteColliders();
  terrain.isTile = true;

  let hasColliders = false;

  for (let r = 0; r < rowCount; r++) {
    for (let c = 0; c < colCount; c++) {
      if (visited[r][c] || !isSolidAt(r, c)) continue;

      let w = 1;
      while (c + w < colCount && !visited[r][c + w] && isSolidAt(r, c + w)) {
        w++;
      }

      let h = 1;
      while (r + h < rowCount) {
        let rowMatches = true;
        for (let dx = 0; dx < w; dx++) {
          if (visited[r + h][c + dx] || !isSolidAt(r + h, c + dx)) {
            rowMatches = false;
            break;
          }
        }
        if (!rowMatches) break;
        h++;
      }

      for (let dy = 0; dy < h; dy++) {
        for (let dx = 0; dx < w; dx++) {
          visited[r + dy][c + dx] = true;
        }
      }

      const offsetX = (c + (w - 1) / 2) * size;
      const offsetY = (r + (h - 1) / 2) * size;
      terrain.addCollider(offsetX, offsetY, w * size, h * size);
      hasColliders = true;
    }
  }

  if (!hasColliders) {
    terrainGroup.deleteAll();
    return null;
  }

  return terrainGroup;
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