import { explode, standardDynamite } from './explode.js';
import { damagePlayer } from './player.js';
import {
  initHeldItem,
  updateHeldItem,
  getHeldRenderAngle,
  destroyHeldItem,
  mouseAngleFrom
} from './heldItem.js';
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
const STICK_LENGTH = 16;
const STICK_THICKNESS = 4;

const BOOM_FRAME_DELAY = 4; // frames per explosion animation frame
const BOOM_SCALE = 3; // range of affect as a multiple of sprite size

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

  group.draw = function () {
    push();
    rotate(ART_ANGLE_OFFSET);
    animation(this.ani, 0, 0);
    pop();
  };

  return initHeldItem(
    {
      group,
      explosions: [],
      heldX: 0,
      heldY: 0,
      cooldown: 0
    },
    {
      initialAngle: 0,
      hitbox: {
        length: HOLD_DISTANCE + STICK_LENGTH * 0.5,
        thickness: STICK_THICKNESS,
        startOffset: HOLD_DISTANCE - STICK_LENGTH * 0.5
      }
    }
  );
}

export function deleteDynamite(dynamite) {
  if (dynamite) {
    dynamite.group.deleteAll();
    destroyHeldItem(dynamite);
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

  if (dynamite.cooldown > 0) {
    dynamite.cooldown -= FRAME_SECONDS;
  }

  updateHeldItem(dynamite, player, active);

  dynamite.heldX = dynamite.worldX;
  dynamite.heldY = dynamite.worldY;

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

  const safeDist = Math.min(12, Math.max(4, (dynamite.clampedLength ?? 12) - 8));
  const spawnX = player.x + dirX * safeDist;
  const spawnY = player.y + dirY * safeDist;

  const stick = new dynamite.group.Sprite(
    spawnX,
    spawnY,
    STICK_LENGTH,
    STICK_THICKNESS
  );

  stick.collider = 'dynamic';
  stick.isDynamite = true;
  stick.fuse = FUSE_SECONDS;
  stick.ani.playing = false;
  stick.ani.frame = 0;
  stick.bounciness = 0.25;
  stick.friction = 0.8;
  stick.angularDrag = 2.5;
  stick.rotation = angle;

  stick.vel.x = dirX * speed + player.vel.x * 0.5;
  stick.vel.y = dirY * speed + player.vel.y * 0.5;

  stick.passes(player);
  stick.passes(dynamite.group);

  if (dynamite.hitbox) {
    stick.passes(dynamite.hitbox);
  }

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

  // ignore item hitboxes so it doesn't stop explosion effect rays
  const ignore = [dynamite.group];
  if (dynamite.hitbox) {
    ignore.push(dynamite.hitbox);
  }

  const result = explode(player, x, y, standardDynamite, ignore);

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
    const renderAngle = getHeldRenderAngle(dynamite);

    push();
    translate(dynamite.heldX, dynamite.heldY);
    rotate(renderAngle + ART_ANGLE_OFFSET);
    animation(art.held, 0, 0);
    pop();
  }

  pop();
}
