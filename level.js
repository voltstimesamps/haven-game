import { createPlayer, updatePlayer, isDead } from './player.js';
import {
  createDynamite,
  updateDynamite,
  deleteDynamite,
  drawDynamite
} from './dynamite.js';
import { createPogo, updatePogo, drawPogo } from './pogo.js';
import {
  createChaser,
  updateChaser,
  deleteChaser,
  drawChaser
} from './chaser.js';
import { followCamera, snapCamera } from './camera.js';
import { playMusic } from './music.js';

const levels = {
  'menu/mainmenu': {
    id: 'menu/mainmenu',

    // Fallback colour behind the backdrop tiles.
    background: '#0a0605',

    // Darker, colour-varied copy of the tiles drawn behind the level.
    backdrop: {
      image: 'assets/TileSafe.png',
      margin: 8,
      // Dungeon: soot, dried rust, old blood, damp mossy stone.
      colors: ['#3a2a20', '#4a2a1a', '#3d1f1a', '#2c2a22', '#33302a'],
      brightness: [0.35, 0.7]
    },

    player: {
      // Inside the room, left of the platform; floor top is y = -16.
      x: -160,
      y: -48,
      inputEnabled: false,
      idleFrames: [
        'assets/Dan.png',
        'assets/DanBlink.png'
      ],

      runImage: 'assets/animations/DanRun.png',
      runFrames: 12,
      hurtImage: 'assets/animations/DanHurt.png',
      hurtFrames: 14
    },

    objects: {},

    tiles: {
      size: 32,
      originX: -320,
      originY: -160,

      definitions: {
        '#': {
          image: 'assets/TileSafe.png',
          solid: true,
          tint: ['#b07850', '#9a8a74', '#a8643c']
        },
        '=': {
          image: 'assets/TileSafe.png',
          solid: true,
          tint: ['#b8683a', '#9c5a36']
        }
      },

      map: `
####################
#                  #
#                  #
#        ===       #
#                  #
####################
`
    }
  },

  // Demo level. Tiles are 32px and the origin is (0, 0), so the tile at
  // (col, row) is centred on (col * 32, row * 32). The main floor's top
  // surface is y = 560, so a 48px-tall thing standing on it has y = 536.
  //
  // Route: hall (spawn + exit door) -> 2-tile step (jump) -> 6-tile wall
  // (blast jump) -> 12-wide, 6-deep pit (blast across, or blast back out)
  // -> shaft with platforms (blast up) -> upper corridor with the chase
  // trigger -> run back left along the corridor and drop into the hall.
  'campaign1/one': {
    id: 'campaign1/one',

    background: '#0a0605',

    backdrop: {
      image: 'assets/TileSafe.png',
      margin: 8,
      colors: ['#3a2a20', '#4a2a1a', '#3d1f1a', '#2c2a22', '#33302a'],
      brightness: [0.35, 0.7]
    },

    player: {
      x: 160,
      y: 530,
      inputEnabled: true,
      idleFrames: [
        'assets/Dan.png',
        'assets/DanBlink.png'
      ],

      runImage: 'assets/animations/DanRun.png',
      runFrames: 12,
      hurtImage: 'assets/animations/DanHurt.png',
      hurtFrames: 14
    },

    objects: {
      // On the upper corridor floor (top surface y = 176), above the shaft.
      chaseTrigger: {
        x: 1600,
        y: 152,
        width: 28,
        height: 48
      },

      // Where the chaser appears when the chase starts: the right end of the
      // upper corridor, behind you as you head left from the trigger.
      chaser: {
        x: 1950,
        y: 110,
        width: 40,
        height: 56
      },

      // In the hall, standing on the main floor.
      escapeDoor: {
        x: 96,
        y: 528,
        width: 32,
        height: 64
      }
    },

    // Hints drawn in the world.
    signs: [
      { x: 96, y: 476, text: 'EXIT' },
      { x: 300, y: 440, text: '\u2190 \u2192 move    SPACE jump' },
      { x: 600, y: 440, text: 'hop up' },
      { x: 760, y: 300, text: 'Too tall? Click to throw dynamite' },
      { x: 760, y: 316, text: 'at your feet and ride the blast' },
      { x: 1140, y: 440, text: 'Throw it behind you to launch across' },
      { x: 1140, y: 456, text: 'Fell in? Blast your way back out' },
      { x: 1800, y: 520, text: 'Blast your way up' },
      { x: 1600, y: 96, text: 'Touch the marker, then race back to the EXIT!' }
    ],

    tiles: {
      size: 32,
      originX: 0,
      originY: 0,

      definitions: {
        '#': {
          image: 'assets/TileSafe.png',
          solid: true,
          tint: ['#b07850', '#9a8a74', '#a8643c']
        },
        '=': {
          image: 'assets/TileSafe.png',
          solid: true,
          tint: ['#b8683a', '#9c5a36']
        }
      },

      map: `
#################################################################
#                                                               #
#                                                               #
#                                                               #
#                                                               #
#                                                               #
#             #########################################         #
#                                                               #
#                                                               #
#                                                          ===  #
#                                                               #
#                                                               #
#                        ###                        ===         #
#                        ###                                    #
#                        ###                                    #
#                        ###                             ===    #
#               ######   ###                                    #
#               ######   ###                                    #
##############################            #######################
##############################            #######################
                             #            #
                             #            #
                             #            #
                             #            #
                             ##############
`
    }
  }
};

export function loadLevel(levelId, game) {
  const level = levels[levelId];

  if (!level) {
    throw new Error(`Unknown level ID: ${levelId}`);
  }

  unloadLevel(game);

  game.activeLevel = level;
  game.activeLevelId = level.id;
  game.chaseStarted = false;

  background(level.background);

  game.backdrop = createBackdrop(level);
  game.tileGroups = createTileGroups(level);

  game.player = createPlayer(level.player);
  game.dynamite = createDynamite();
  game.pogo = createPogo();
  game.selectedItem = 'dynamite';
  game.killY = levelBottom(level) + 300;
  snapCamera();

  connectPlayerToSolidTiles(game);

  if (level.objects.chaseTrigger) {
    game.chaseTrigger = createChaseTrigger(level.objects.chaseTrigger);
  }

  if (level.objects.escapeDoor) {
    game.escapeDoor = createEscapeDoor(level.objects.escapeDoor);
  }
}

export function drawLevel(game) {
  if (!game.activeLevel) {
    return;
  }

  background(game.activeLevel.background);

  followCamera(game.player);

  // Visuals aren't auto-drawn like sprites, so draw the backdrop here,
  // through the camera. Sprites get drawn on top after q5.draw finishes.
  camera.on();

  if (game.backdrop) {
    imageMode(CENTER);
    drawVisibleVisuals(game.backdrop, game.activeLevel.tiles.size);
  }

  // Sensors don't draw their fill colour, so draw the trigger/door ourselves.
  drawMarker(game.chaseTrigger);
  drawMarker(game.escapeDoor);

  drawSigns(game.activeLevel.signs);

  camera.off();
}

// World-space things that must appear in front of sprites (held/thrown
// dynamite effects). Called from the HUD pass, which runs after sprites.
export function drawLevelOverlay(game) {
  if (!game.activeLevel) {
    return;
  }

  camera.on();
  drawDynamite(game.dynamite, game.player, game.selectedItem === 'dynamite');
  drawPogo(game.pogo, game.player, game.selectedItem === 'pogo');
  drawChaser(game.chaser, game.player);
  camera.off();
}

function drawSigns(signs = []) {
  push();
  textAlign(CENTER, CENTER);
  textSize(9);
  fill('#e8d6b8');
  stroke('#000000');
  strokeWeight(2);

  for (const sign of signs) {
    text(sign.text, sign.x, sign.y);
  }

  pop();
}

function levelBottom(level) {
  const rows = level.tiles.map.replace(/^\n|\n$/g, '').split('\n');
  return level.tiles.originY + rows.length * level.tiles.size;
}

// Visuals.draw() draws every visual, even off-screen ones. Only draw the
// ones inside the camera view (plus a one-tile pad).
function drawVisibleVisuals(visuals, pad) {
  const halfW = width / 2 / camera.zoom + pad;
  const halfH = height / 2 / camera.zoom + pad;

  for (const visual of visuals) {
    if (
      Math.abs(visual.x - camera.x) < halfW &&
      Math.abs(visual.y - camera.y) < halfH
    ) {
      visual.draw();
    }
  }
}

function drawMarker(sprite) {
  if (!sprite) {
    return;
  }

  push();
  rectMode(CENTER);
  noStroke();
  opacity(sprite.opacity ?? 1);
  fill(sprite.color);
  rect(sprite.x, sprite.y, sprite.w, sprite.h);
  pop();
}

export function unloadLevel(game) {
  if (game.player) {
    game.player.delete();
    game.player = null;
  }

  if (game.chaseTrigger) {
    game.chaseTrigger.delete();
    game.chaseTrigger = null;
  }

  if (game.escapeDoor) {
    game.escapeDoor.delete();
    game.escapeDoor = null;
  }

  deleteDynamite(game.dynamite);
  game.dynamite = null;
  game.pogo = null;

  deleteChaser(game.chaser);
  game.chaser = null;

  for (const group of game.tileGroups) {
    group.deleteAll();
  }

  game.tileGroups = [];
  game.backdrop = null;
  game.activeLevel = null;
  game.activeLevelId = null;
  game.chaseStarted = false;
}

export function updateLevel(game) {
  if (!game.player) {
    return 'continue';
  }

  updateItemSelection(game);

  // Items first: blasts and bounces queue velocity changes that
  // updatePlayer then applies.
  updateDynamite(game.dynamite, game.player, game.selectedItem === 'dynamite');
  updatePogo(game.pogo, game.player, game.selectedItem === 'pogo');
  updatePlayer(game.player);

  const caught = updateChaser(game.chaser, game.player);

  if (
    game.player.inputEnabled &&
    (caught || isDead(game.player) || game.player.y > game.killY)
  ) {
    return 'dead';
  }

  if (
    game.chaseTrigger &&
    !game.chaseStarted &&
    game.player.overlaps(game.chaseTrigger)
  ) {
    startChase(game);
  }

  if (
    game.escapeDoor &&
    game.chaseStarted &&
    game.player.overlaps(game.escapeDoor)
  ) {
    return 'complete';
  }

  return 'continue';
}

function createTileGroups(level) {
  const groups = [];

  for (const [character, definition] of Object.entries(
    level.tiles.definitions
  )) {
    const group = new Group();

    group.tile = character;
    group.w = level.tiles.size;
    group.h = level.tiles.size;
    group.solid = definition.solid === true;

    // Level geometry never moves. q5play v4 uses `physics`, not `collider`.
    group.physics = 'static';

    // q5 already draws images at half size (defaultImageScale 0.5),
    // so the 64px tile art fills a 32px tile with no extra scaling.
    group.img = definition.image;

    group.addTiles(
      level.tiles.map,
      level.tiles.originX,
      level.tiles.originY,
      level.tiles.size,
      level.tiles.size
    );

    if (definition.tint) {
      // `tint` can be one colour or a list to pick from per tile.
      const palette = [definition.tint].flat();

      for (const tile of group) {
        const col = tileCell(tile.x, level.tiles.originX, level.tiles.size);
        const row = tileCell(tile.y, level.tiles.originY, level.tiles.size);
        const base = palette[Math.floor(hash(col, row, 7) * palette.length)];
        const shade = pickShade(base, col, row, [0.7, 1]);

        tile.img = shadedImage(definition.image, shade);
        tile.tint = shade;
      }
    }

    // Ground checks and the pogo only count real level geometry.
    for (const tile of group) {
      tile.isTile = true;
    }

    groups.push(group);
  }

  return groups;
}

// A grid of darker, colour-varied tiles covering the level and a margin
// around it. Uses Visuals (no physics bodies) since it's purely decoration.
function createBackdrop(level) {
  const settings = level.backdrop;

  if (!settings) {
    return null;
  }

  const { size, originX, originY } = level.tiles;
  const rows = level.tiles.map.replace(/^\n|\n$/g, '').split('\n');
  const cols = Math.max(...rows.map((row) => row.length));
  const margin = settings.margin ?? 8;

  const backdrop = new Visuals();
  backdrop.img = settings.image;

  for (let row = -margin; row < rows.length + margin; row++) {
    for (let col = -margin; col < cols + margin; col++) {
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

function tileCell(position, origin, size) {
  return Math.round((position - origin) / size);
}

// Stable pseudo-random 0..1 per grid cell, so tiles keep the same
// colour every time the level loads.
function hash(x, y, seed = 0) {
  let h = Math.imul(x, 374761393) ^ Math.imul(y, 668265263) ^ Math.imul(seed, 2246822519);
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
}

// How many different shades each base tint colour gets.
const SHADES_PER_COLOR = 6;

// Picks one of a few fixed shades of `hex` for this grid cell. Keeping the
// number of distinct shades small matters for performance, see shadedImage.
function pickShade(hex, col, row, range) {
  const variant = Math.floor(hash(col, row, 1) * SHADES_PER_COLOR);
  return varyColor(hex, variant, range);
}

// Darkens a hex colour within [min, max] and nudges each channel slightly
// so neighbouring tiles don't look identical. Same variant = same colour.
function varyColor(hex, variant, [min, max]) {
  const brightness = min + (variant / (SHADES_PER_COLOR - 1)) * (max - min);
  const value = parseInt(hex.slice(1), 16);
  const channels = [(value >> 16) & 255, (value >> 8) & 255, value & 255];

  const varied = channels.map((channel, i) => {
    const jitter = 0.92 + hash(variant, i, 2) * 0.16;
    const result = Math.round(channel * brightness * jitter);
    return Math.max(0, Math.min(255, result));
  });

  return '#' + varied.map((c) => c.toString(16).padStart(2, '0')).join('');
}

// Without WebGPU, q5 tints by re-rendering the image whenever it's drawn
// with a different tint than last time. If every tile shares one image with
// its own tint, that happens hundreds of times per frame (slideshow FPS).
// Giving each shade its own image object means each one is tinted once and
// then cached for good.
const shadedImages = new Map();

function shadedImage(path, shade) {
  const key = path + '|' + shade;

  if (!shadedImages.has(key)) {
    shadedImages.set(key, loadImage(path));
  }

  return shadedImages.get(key);
}

function connectPlayerToSolidTiles(game) {
  for (const group of game.tileGroups) {
    if (group.solid) {
      game.player.collides(group);
    }
  }
}

function createChaseTrigger(settings) {
  // Static sensor: stays put and detects overlaps without pushing anything.
  const trigger = Sprite.withSensor(
    settings.x,
    settings.y,
    settings.width,
    settings.height,
    'static'
  );

  trigger.color = 'yellow';
  trigger.opacity = 0.5;
  trigger.debug = true;
  trigger.ignoreRays = true;

  return trigger;
}

function createEscapeDoor(settings) {
  // Static sensor too: the player spawns on top of the door, so a solid door
  // would shove them out violently. updateLevel only counts the overlap
  // once the chase has started.
  const door = Sprite.withSensor(
    settings.x,
    settings.y,
    settings.width,
    settings.height,
    'static'
  );

  door.color = 'red';
  door.debug = true;
  door.ignoreRays = true;

  return door;
}

function startChase(game) {
  game.chaseStarted = true;

  // Plays until the level ends; the menu/next level switches back to chill.
  playMusic('chase');

  if (game.chaseTrigger) {
    game.chaseTrigger.delete();
    game.chaseTrigger = null;
  }

  if (game.escapeDoor) {
    game.escapeDoor.color = 'green';
  }

  const spawn = game.activeLevel.objects.chaser;

  if (spawn) {
    game.chaser = createChaser(spawn);
  }
}

// 1 = dynamite, 2 = pogo, Q = swap. Falls back to dynamite when the pogo
// runs out of bounces.
function updateItemSelection(game) {
  if (!game.player?.inputEnabled) {
    return;
  }

  const pogoReady = game.pogo && game.pogo.charges > 0;

  if (kb.presses('1')) {
    game.selectedItem = 'dynamite';
  } else if (kb.presses('2') && pogoReady) {
    game.selectedItem = 'pogo';
  } else if (kb.presses('q')) {
    game.selectedItem =
      game.selectedItem === 'dynamite' && pogoReady ? 'pogo' : 'dynamite';
  }

  if (game.selectedItem === 'pogo' && !pogoReady) {
    game.selectedItem = 'dynamite';
  }
}