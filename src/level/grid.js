// levels are measured in tile coordinates

export function getMapRows(level) {
  return level.tiles.map.replace(/^\n|\n$/g, '').split('\n');
}

export function getMapColumns(level) {
  return Math.max(...getMapRows(level).map((row) => row.length));
}

// world y of the bottom edge of the tile map
export function levelBottom(level) {
  return level.tiles.originY + getMapRows(level).length * level.tiles.size;
}

export function toWorldPlacement(level, placement) {
  const size = level.tiles.size;
  const tile = placement.tile ?? { col: 0, row: 0 };

  return {
    ...placement,
    x: level.tiles.originX + tile.col * size,
    y: level.tiles.originY + tile.row * size,
    ...(placement.widthTiles !== undefined
      ? { width: placement.widthTiles * size }
      : {}),
    ...(placement.heightTiles !== undefined
      ? { height: placement.heightTiles * size }
      : {})
  };
}