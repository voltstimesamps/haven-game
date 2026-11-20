import { createPlayer, updatePlayer, isDead } from '../entities/player.js';
import {
  createDynamite,
  updateDynamite,
  deleteDynamite,
  drawDynamite
} from '../entities/dynamite.js';
import { createPogo, updatePogo, drawPogo } from '../entities/pogo.js';
import {
  createChaser,
  updateChaser,
  deleteChaser,
  drawChaser
} from '../entities/chaser.js';
import {
  followChaseCamera,
  shakeCamera,
  snapCamera
} from '../core/camera.js';
import { playMusic, fadeOutMusic } from '../core/music.js';
import { playSound } from '../core/sound.js';
import { debugEnabled } from '../core/debug.js';
import { getLevel } from './registry.js';
import { toWorldPlacement } from './grid.js';

const doorImages = new Map();

export function loadLevel(levelId, game) {
  const level = getLevel(levelId);

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

  game.player = createPlayer(toWorldPlacement(level, level.player));
  game.dynamite = createDynamite();
  game.pogo = createPogo();
  game.selectedItem = 'dynamite';
  game.killY = levelBottom(level) + 300;
  snapCamera();

  connectPlayerToSolidTiles(game);

  if (level.objects.chaseTrigger) {
    game.chaseTrigger = createChaseTrigger(
      toWorldPlacement(level, level.objects.chaseTrigger)
    );
  }

  if (level.objects.escapeDoor) {
    game.escapeDoor = createEscapeDoor(
      toWorldPlacement(level, level.objects.escapeDoor)
    );
  }

  if (level.id === 'campaign1/one') {
    beginEntrance(game);
  }

  game.irisOpenProgress = 1;
}

export function drawLevel(game) {
  if (!game.activeLevel) {
    return;
  }

  background(game.activeLevel.background);

  followChaseCamera(game.player, game.chaser);

  // draw backdrop here as it isn't a sprite and therefore isn't auto drawn and we want to keep it below other stuff
  camera.on();

  if (game.backdrop) {
    imageMode(CENTER);
    drawVisibleVisuals(game.backdrop, game.activeLevel.tiles.size);
  }

  // sensors don't draw their fill colour, so draw the placeholder for the trigger/door manually.
  drawMarker(game.chaseTrigger);
  drawDoor(game.escapeDoor);

  drawSigns(game.activeLevel.signs, game.activeLevel);

  camera.off();
}

// stuff in worldspace (dynamite) that still needs to be above other things
export function drawLevelOverlay(game) {
  if (!game.activeLevel) {
    return;
  }

  camera.on();
  drawDynamite(game.dynamite, game.player, game.selectedItem === 'dynamite');
  drawPogo(game.pogo, game.player, game.selectedItem === 'pogo');
  drawChaser(game.chaser, game.player);
  camera.off();

  drawCutsceneOverlay(game);
}

function drawSigns(signs = [], level) {
  push();
  textAlign(CENTER, CENTER);
  textSize(9);
  fill(232, 214, 184);
  stroke(0);
  strokeWeight(2);

  for (const sign of signs) {
    const position = toWorldPlacement(level, sign);
    text(sign.text, position.x, position.y);
  }

  pop();
}

function levelBottom(level) {
  const rows = level.tiles.map.replace(/^\n|\n$/g, '').split('\n');
  return level.tiles.originY + rows.length * level.tiles.size;
}

// cull offscreen stuff
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

function drawDoor(door) {
  if (!door) {
    return;
  }

  const openProgress = door.openProgress ?? 0;
  const panelY = door.y - door.h * openProgress;
  const artPath = door.animation === 'close'
    ? door.closeImage
    : door.openImage;

  push();
  rectMode(CENTER);
  noStroke();
  fill('#080506');
  rect(door.x, door.y, door.w + 4, door.h + 4);

  if (artPath) {
    imageMode(CENTER);
    image(getDoorImage(artPath), door.x, panelY, door.w, door.h);
  } else if (openProgress < 1) {
    fill(door.color === 'green' ? '#2d080c' : '#55080c');
    rect(door.x, panelY, door.w, door.h);
    stroke('#96191e');
    strokeWeight(2);
    noFill();
    rect(door.x, panelY, door.w, door.h);
  }

  pop();
}

function getDoorImage(path) {
  if (!doorImages.has(path)) {
    doorImages.set(path, loadImage(path));
  }

  return doorImages.get(path);
}

function beginEntrance(game) {
  const player = game.player;
  const door = game.escapeDoor;

  player.x = door.x - door.w - 8;
  player.inputEnabled = false;
  player.autoDirection = 1; // walk right automatically
  game.entrance = {
    phase: 'walking',
    elapsed: 0,
    particles: []
  };
}

function updateEntrance(game) {
  const entrance = game.entrance;

  if (!entrance) {
    return false;
  }

  updateEntranceParticles(entrance);

  if (entrance.phase === 'done') {
    return false;
  }

  const player = game.player;
  const door = game.escapeDoor;

  if (entrance.phase === 'walking') {
    player.autoDirection = 1;
    updatePlayer(player);

    if (player.x >= door.x + door.w * 2) {
      player.autoDirection = 0; // stand still while door closes
      entrance.phase = 'closing';
      entrance.elapsed = 0;
    }

    return true;
  }

  player.autoDirection = 0;
  updatePlayer(player);

  entrance.elapsed += 1 / 60;
  const progress = constrain(entrance.elapsed / 0.45, 0, 1);
  door.openProgress = 1 - progress;
  door.animation = 'close';

  if (progress >= 1) {
    entrance.phase = 'done';
    player.autoDirection = null; // hand control back to keyboard
    player.inputEnabled = true;

    closeDoor(game, door);
    emitDoorParticles(entrance, door);
    playSound('doorClose');
    playMusic('chill');
    shakeCamera(0.7, 8);
  }

  return true;
}

function beginExit(game) {
  if (game.exit) {
    return;
  }

  const player = game.player;
  const door = game.escapeDoor;
  const tileSize = game.activeLevel.tiles.size;
  const targetX = door.x - tileSize * 3;
  const dir = targetX >= player.x ? 1 : -1;

  openDoor(door);

  player.inputEnabled = false;
  player.autoDirection = dir;

  deleteChaser(game.chaser);
  game.chaser = null;

  fadeOutMusic(1.2);

  game.exit = {
    phase: 'walking',
    dir,
    targetX,
    elapsed: 0,
    irisProgress: 0
  };
}

function updateExit(game) {
  const exit = game.exit;

  if (!exit) {
    return null;
  }

  const player = game.player;

  if (exit.phase === 'walking') {
    exit.elapsed += 1 / 60;
    player.autoDirection = exit.dir;
    updatePlayer(player);

    const reachedTarget = exit.dir === 1
      ? player.x >= exit.targetX
      : player.x <= exit.targetX;

    if (reachedTarget || exit.elapsed >= 1.5) {
      player.autoDirection = 0;
      player.vel.x = 0;
      player.visible = false;
      exit.phase = 'iris';
      exit.elapsed = 0;
    }

    return 'continue';
  }

  if (exit.phase === 'iris') {
    exit.elapsed += 1 / 60;
    exit.irisProgress = constrain(exit.elapsed / 0.75, 0, 1);

    if (exit.irisProgress >= 1) {
      exit.phase = 'done';
      player.autoDirection = null;
      return 'complete';
    }
  }

  return 'continue';
}

function drawCutsceneOverlay(game) {
  if (!game.activeLevel || game.activeLevelId?.startsWith('menu/')) {
    game.exit = null;
    game.irisOpenProgress = 0;
    game.letterboxProgress = 0;
    return;
  }

  const entrance = game.entrance;
  const exit = game.exit;

  if (game.irisOpenProgress > 0) {
    game.irisOpenProgress = max(0, game.irisOpenProgress - (1 / 60) / 0.6);
  }

  const hasActiveIris =
    (exit && (exit.phase === 'iris' || exit.phase === 'done')) ||
    game.irisOpenProgress > 0;

  if (!entrance && !exit && !(game.letterboxProgress > 0) && !hasActiveIris) {
    return;
  }

  const cutsceneActive =
    (entrance && entrance.phase !== 'done') ||
    Boolean(exit && exit.phase !== 'done');

  const currentBar = game.letterboxProgress ?? 0;
  game.letterboxProgress = cutsceneActive
    ? min(1, currentBar + (1 / 60) / 0.25)
    : max(0, currentBar - (1 / 60) / 0.25);

  const viewW = width / camera.zoom;
  const viewH = height / camera.zoom;
  const left = camera.x - viewW / 2;
  const top = camera.y - viewH / 2;

  push();
  camera.on();
  rectMode(CORNER);

  // iris wipe
  const isExiting = exit && (exit.phase === 'iris' || exit.phase === 'done');
  const isOpening = !isExiting && game.irisOpenProgress > 0;

  if (isExiting || isOpening) {
    const progress = isExiting ? (exit.irisProgress ?? 0) : game.irisOpenProgress;
    const target = isExiting
      ? (game.escapeDoor ?? game.player)
      : (game.player ?? game.escapeDoor);

    if (target) {
      const maxRadius = dist(
        target.x,
        target.y,
        target.x < camera.x ? left + viewW : left,
        target.y < camera.y ? top + viewH : top
      );

      const holeRadius = max(0, maxRadius * (1 - progress));

      noFill();
      stroke(0);
      strokeWeight(maxRadius * 2);
      circle(target.x, target.y, holeRadius * 2 + maxRadius * 2);
    }
  }

  // letterbox bars
  if (game.letterboxProgress > 0) {
    const barHeight = viewH * 0.12 * game.letterboxProgress;
    noStroke();
    fill(0);
    rect(left, top, viewW, barHeight);
    rect(left, top + viewH - barHeight, viewW, barHeight);
  }

  camera.off();
  pop();
}

function emitDoorParticles(entrance, door) {
  for (let i = 0; i < 20; i++) {
    const particle = new Sprite(
      door.x + random(-door.w / 2, door.w / 2),
      door.y - door.h / 2,
      random(2, 5),
      'dynamic'
    );

    particle.color = random() > 0.5 ? '#8b5a3c' : '#b8734d';
    particle.opacity = random(0.5, 0.95);
    particle.gravityScale = 0.8;
    particle.friction = 0;
    particle.bounciness = 0.25;
    particle.rotationLock = true;
    particle.lifeRemaining = 1.1;
    particle.vel.x = random(-3, 3);
    particle.vel.y = random(-5, -1);
    entrance.particles.push(particle);
    door.passes(particle);
    door.solid?.passes(particle);
  }
}

function updateEntranceParticles(entrance) {
  for (const particle of entrance.particles) {
    particle.lifeRemaining -= 1 / 60;
  }

  for (const particle of entrance.particles.filter(
    (particle) => particle.lifeRemaining <= 0
  )) {
    particle.delete();
  }

  entrance.particles = entrance.particles.filter(
    (particle) => particle.lifeRemaining > 0
  );
}

function deleteEntrance(entrance) {
  for (const particle of entrance?.particles ?? []) {
    particle.delete();
  }
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
    game.escapeDoor.solid?.delete();
    game.escapeDoor.delete();
    game.escapeDoor = null;
  }

  deleteDynamite(game.dynamite);
  game.dynamite = null;
  game.pogo = null;

  deleteChaser(game.chaser);
  game.chaser = null;
  deleteEntrance(game.entrance);
  game.entrance = null;

  for (const group of game.tileGroups) {
    group.deleteAll();
  }
  
  deleteEntrance(game.entrance);
  game.entrance = null;
  game.exit = null;
  game.letterboxProgress = 0;

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

  if (updateEntrance(game)) {
    return 'continue';
  }

  const exitStatus = updateExit(game)
  if (exitStatus) {
    return exitStatus;
  }

  updateItemSelection(game);

  // update stuff that proposes velocity change before applying it
  updateDynamite(
    game.dynamite,
    game.player,
    game.selectedItem === 'dynamite',
    game.chaser
  );
  updatePlayer(game.player);
  updatePogo(game.pogo, game.player, game.selectedItem === 'pogo');

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
    game.chaseStarted &&
    game.escapeDoor &&
    !game.escapeDoor.isClosed &&
    game.player.overlapping(game.escapeDoor)
  ) {
    beginExit(game);
    return 'continue';
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

    // make level tiles not physics objects (those who know)
    group.physics = 'static';

    // note q5 draws stuff at half size
    group.img = definition.image;

    group.addTiles(
      level.tiles.map,
      level.tiles.originX,
      level.tiles.originY,
      level.tiles.size,
      level.tiles.size
    );

    if (definition.tint) {
      // tint can be one colour or a list to pick from per tile.
      const palette = [definition.tint].flat();
      // give tiles variance by changing their colors a bit
      for (const tile of group) {
        const col = tileCell(tile.x, level.tiles.originX, level.tiles.size);
        const row = tileCell(tile.y, level.tiles.originY, level.tiles.size);
        const base = palette[Math.floor(hash(col, row, 7) * palette.length)];
        const shade = pickShade(base, col, row, [0.7, 1]);

        tile.img = shadedImage(definition.image, shade);
        tile.tint = shade;
      }
    }

    // ground checks and the pogo only count level collisions.
    for (const tile of group) {
      tile.isTile = true;
    }

    groups.push(group);
  }

  return groups;
}

// draw backdrop with darker tiles
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

// use a randomness that we can control so tiles keep same color every time level loads
function hash(x, y, seed = 0) {
  let h = Math.imul(x, 374761393) ^ Math.imul(y, 668265263) ^ Math.imul(seed, 2246822519);
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
}

// how many different shades each base tint colour gets
const SHADES_PER_COLOR = 6;

// pick one of a couple shades, see shadedImage for why
function pickShade(hex, col, row, range) {
  const variant = Math.floor(hash(col, row, 1) * SHADES_PER_COLOR);
  return varyColor(hex, variant, range);
}

// darken color and vary the numbers a little so neighbor tiles can't look the same
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

// tinting was making q5 rerender stuff every time its drawn so it kills fps, avoid that by doing this
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
  // sensor with no collider or physics
  const trigger = Sprite.withSensor(
    settings.x,
    settings.y,
    settings.width,
    settings.height,
    'static'
  );

  trigger.color = 'yellow';
  trigger.opacity = 0.5;
  trigger.debug = debugEnabled('colliders');
  trigger.ignoreRays = true;

  return trigger;
}

function createEscapeDoor(settings) {
  // keep sensor apart from collider so dan can be detected even if door is closed
  const door = Sprite.withSensor(
    settings.x,
    settings.y,
    settings.width,
    settings.height,
    'static'
  );

  door.w = settings.width;
  door.h = settings.height;
  door.color = 'red';
  door.openProgress = 1;
  door.animation = 'open';
  door.openImage = settings.openImage;
  door.closeImage = settings.closeImage;
  door.solid = null;
  door.isClosed = false;
  door.visible = false;
  door.debug = debugEnabled('colliders');
  door.ignoreRays = true;

  return door;
}

function openDoor(door) {
  if (!door) {
    return;
  }

  door.solid?.delete();
  door.solid = null;
  door.isClosed = false;
  door.color = 'green';
  door.animation = 'open';
  door.openProgress = 1; // Or set to 0 if you want to animate it sliding open over time
}

function closeDoor(game, door) {
  if (door.isClosed) {
    return;
  }

  door.solid = new Sprite(door.x, door.y, door.w, door.h, 'static');
  door.solid.visible = false;
  door.solid.ignoreRays = false;
  door.isClosed = true;
  game.player.collides(door.solid);
}

function startChase(game) {
  game.chaseStarted = true;

  playMusic('chase');

  if (game.chaseTrigger) {
    game.chaseTrigger.delete();
    game.chaseTrigger = null;
  }

  if (game.escapeDoor) {
    openDoor(game.escapeDoor);
  }

  const spawn = game.activeLevel.objects.chaser;

  if (spawn) {
    game.chaser = createChaser(toWorldPlacement(game.activeLevel, spawn));
    playSound('chaserArrival');
    shakeCamera(1.5, 10);
  }
}

// 1 = dynamite, 2 = pogo, Q = swap
function updateItemSelection(game) {
  if (!game.player?.inputEnabled) {
    return;
  }

  if (kb.presses('1')) {
    game.selectedItem = 'dynamite';
  } else if (kb.presses('2')) {
    game.selectedItem = 'pogo';
  } else if (kb.presses('q')) {
    game.selectedItem =
      game.selectedItem === 'dynamite' ? 'pogo' : 'dynamite';
  }
}