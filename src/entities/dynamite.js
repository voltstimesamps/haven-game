import { explode, standardDynamite } from './explode.js';
import { damagePlayer } from './player.js';
import { aimToward, mouseAngleFrom } from './aim.js';
import { knockbackChaser } from './chaser.js';
import { playSound } from '../core/sound.js';

// DynamiteExplode.png: spritesheet of 15 frames, 96x96 per frame
//   0-7  lit stick, fuse burning down
//   8-14 blast and smoke
const SHEET = 'assets/animations/DynamiteExplode.png';
const FRAME_SIZE = '96x96';
const FUSE_FRAMES = [0, 1, 2, 3, 4, 5, 6, 7];
const BOOM_FRAMES = [8, 9, 10, 11, 12, 13, 14];

const FRAME_SECONDS = 1 / 60;

const FUSE_SECONDS = 0.75;
// scale throw speed with mouse distance from player
const MIN_THROW_SPEED = 2;
const MAX_THROW_SPEED = 12;
const THROW_SPEED_PER_PIXEL = 1 / 12;
const THROW_COOLDOWN = 0.3;

const HOLD_DISTANCE = 26; // how far from Dan's centre the held stick floats

const BOOM_FRAME_DELAY = 4; // frames per explosion animation frame
const BOOM_SCALE = 3; // range of affect as a multple of sprite size

// account for angle of stick in the art
const ART_ANGLE_OFFSET = 45;

let art = null;

function getArt() {
  if (!art) {
    const held = new Visuals();
    held.addAni('held', SHEET, [0], FRAME_SIZE);
    held.ani.playing = false;

    const boom = new Visuals();
    boom.addAni('boom', SHEET, BOOM_FRAMES, FRAME_SIZE);
    boom.ani.playing = false;

    art = { held: held.ani, boom: boom.ani };
  }

  return art;
}

export function createDynamite() {
  getArt();

  const group = new Group();
  group.addAni('fuse', SHEET, FUSE_FRAMES, FRAME_SIZE);
  group.isDynamite = true;

  return {
    group,
    explosions: [],
    aimAngle: 0,
    heldX: 0,
    heldY: 0,
    cooldown: 0
  };
}

export function deleteDynamite(dynamite) {
  if (dynamite) {
    dynamite.group.deleteAll();
  }
}

// `active` = dynamite is the selected item (throwing and the held stick).
// sticks already thrown keep ticking either way.
export function updateDynamite(
  dynamite,
  player,
  active = true,
  chaser = null
) {
  if (!dynamite || !player) {
    return;
  }

  aimToward(dynamite, player);
  dynamite.heldX = player.x + cos(dynamite.aimAngle) * HOLD_DISTANCE;
  dynamite.heldY = player.y + sin(dynamite.aimAngle) * HOLD_DISTANCE;

  if (dynamite.cooldown > 0) {
    dynamite.cooldown -= FRAME_SECONDS;
  }

  if (
    active &&
    player.inputEnabled &&
    mouse.presses() &&
    dynamite.cooldown <= 0
  ) {
    throwStick(dynamite, player);
  }

  for (const stick of [...dynamite.group]) {
    stick.fuse -= FRAME_SECONDS;

    const progress = 1 - stick.fuse / FUSE_SECONDS;
    stick.ani.frame = Math.min(
      FUSE_FRAMES.length - 1,
      Math.floor(progress * FUSE_FRAMES.length)
    );

    if (stick.fuse <= 0) {
      detonate(dynamite, stick, player, chaser);
    }
  }

  for (const boom of dynamite.explosions) {
    boom.age++;
    boom.ani.frame = Math.min(
      BOOM_FRAMES.length - 1,
      Math.floor(boom.age / BOOM_FRAME_DELAY)
    );
  }

  dynamite.explosions = dynamite.explosions.filter(
    (boom) => boom.age < BOOM_FRAMES.length * BOOM_FRAME_DELAY
  );
}

function throwStick(dynamite, player) {
  // aim straight at the mouse, not the smoothed held angle.
  const angle = mouseAngleFrom(player);
  const dirX = cos(angle);
  const dirY = sin(angle);
  const mouseDistance = dist(player.x, player.y, mouse.x, mouse.y);
  const speed = constrain(
    mouseDistance * THROW_SPEED_PER_PIXEL,
    MIN_THROW_SPEED,
    MAX_THROW_SPEED
  );

  // spawn just outside Dan's centre rather than at the held position to avoid spawning sticks in walls
  const stick = new dynamite.group.Sprite(
    player.x + dirX * 8,
    player.y + dirY * 8,
    12
  );

  stick.isDynamite = true;
  stick.fuse = FUSE_SECONDS;
  stick.ani.playing = false;
  stick.ani.frame = 0;
  stick.bounciness = 0.25;
  stick.friction = 0.8;
  stick.rotation = angle + ART_ANGLE_OFFSET;

  stick.vel.x = dirX * speed + player.vel.x * 0.5;
  stick.vel.y = dirY * speed + player.vel.y * 0.5;

  stick.passes(player);
  stick.passes(dynamite.group);

  dynamite.cooldown = THROW_COOLDOWN;
  playSound('dynamiteThrow');
}

function detonate(dynamite, stick, player, chaser) {
  const x = stick.x;
  const y = stick.y;

  stick.delete();
  playSound('explosion');

  const boom = art.boom.clone();
  boom.playing = false;
  boom.frame = 0;
  dynamite.explosions.push({ x, y, ani: boom, age: 0 });

  if (!player.inputEnabled) {
    return;
  }

  // push and damage both scale with distance (and how exposed Dan is).
  const result = explode(player, x, y, standardDynamite, [dynamite.group]);

  if (result.hit) {
    damagePlayer(player, standardDynamite.damage * result.blastStrength);
  }

  knockbackChaser(chaser, x, y);
}

// make sure dynamite shows over map tiles and dan
export function drawDynamite(dynamite, player, active = true) {
  if (!dynamite) {
    return;
  }

  push();
  imageMode(CENTER);

  for (const boom of dynamite.explosions) {
    push();
    translate(boom.x, boom.y);
    scale(BOOM_SCALE);
    animation(boom.ani, 0, 0);
    pop();
  }

  // art.held.length is 0 until the sheet has loaded.
  if (
    active &&
    player?.inputEnabled &&
    dynamite.cooldown <= 0 &&
    art.held.length
  ) {
    push();
    translate(dynamite.heldX, dynamite.heldY);
    rotate(dynamite.aimAngle + ART_ANGLE_OFFSET);
    animation(art.held, 0, 0);
    pop();
  }

  pop();
}
