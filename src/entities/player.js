import {
  addVelocityChange,
  getProjectedVelocity,
  setVerticalVelocity,
  applyVelocityChange
} from './velocity.js';
import { playSound } from '../core/sound.js';

// movement tuning (meters/second, 60px per meter, change per frame)
const RUN_SPEED = 3.2; // top running speed
const GROUND_ACCEL = 0.45; // speed gained per frame while running on ground
const AIR_ACCEL = 0.25; // weaker steering in the air
const GROUND_STOP = 0.3; // fraction of speed lost per frame with no input
const GROUND_SLIDE = 0.05; // gentler braking when sliding faster than a run (after a blast)
const AIR_DRAG = 0.015; // tiny, so blast launches carry their momentum
const JUMP_SPEED = 9.5; // ~90px (2.8 tiles) with gravity 30
const MANTLE_SPEED = 4.5;
const MANTLE_COOLDOWN = 0.18;
const MANTLE_FRONT_OFFSET = 3;
const MANTLE_MIN_HEIGHT = 10;
const MANTLE_MAX_HEIGHT = 30;
const PLAYER_CORNER_RADIUS = 8;
const GROUND_GRACE_SECONDS = 0.1;
const GROUND_CHECK_UP = 8;
const GROUND_CHECK_DOWN = 10;

// health
const MAX_HEALTH = 100;
const REGEN_PER_SECOND = MAX_HEALTH / 5; // full health in 5 seconds
const HURT_SECONDS = 0.5;
const FRAME_SECONDS = 1 / 60;

export function createPlayer(playerSettings) {
  const sprite = new Sprite(
    playerSettings.x,
    playerSettings.y,
    32,
    48,
    PLAYER_CORNER_RADIUS
  );

  sprite.addAni('run', playerSettings.runImage, playerSettings.runFrames);
  sprite.addAni('hurt', playerSettings.hurtImage, playerSettings.hurtFrames);

  sprite.anis.run.frameDelay = 4;
  sprite.anis.hurt.frameDelay = 2;

  sprite.addAni('idle', playerSettings.idleImage, playerSettings.idleFrames)
    .then(() => {
      sprite.idleReady = true;
      sprite.changeAni('idle');
      sprite.ani.frameDelay = 12;
    });

  sprite.idleReady = false;
  sprite.inputEnabled = playerSettings.inputEnabled;
  sprite.rotationLock = true;

  // note, no physics friction because it allows dan to stick to walls. ground friction handled in updatePlayer.
  sprite.friction = 0;
  sprite.bounciness = 0;

  sprite.facing = 1;
  sprite.health = MAX_HEALTH;
  sprite.maxHealth = MAX_HEALTH;
  sprite.hurtTimer = 0;
  sprite.mantleCooldown = 0;
  sprite.groundGrace = 0;

  return sprite;
}

export function updatePlayer(player) {
  if (!player || !player.inputEnabled) {
    return;
  }

  const onGround = isOnGround(player);
  player.groundGrace = onGround
    ? GROUND_GRACE_SECONDS
    : Math.max(0, player.groundGrace - FRAME_SECONDS);
  const canJump = onGround || player.groundGrace > 0;
  const direction =
    (kb.pressing('right') ? 1 : 0) - (kb.pressing('left') ? 1 : 0);
  player.mantleCooldown = Math.max(
    0,
    player.mantleCooldown - FRAME_SECONDS
  );

  // make sure we include all blasts
  const velocityX = getProjectedVelocity(player).x;

  if (direction !== 0) {
    const accel = onGround ? GROUND_ACCEL : AIR_ACCEL;
    const speedInDirection = velocityX * direction;

    if (speedInDirection < RUN_SPEED) {
      const gain = Math.min(accel, RUN_SPEED - speedInDirection);
      addVelocityChange(player, gain * direction, 0);
    }

    player.facing = direction;
  } else {
    let damping = AIR_DRAG;

    if (onGround) {
      damping = Math.abs(velocityX) > RUN_SPEED ? GROUND_SLIDE : GROUND_STOP;
    }

    addVelocityChange(player, -velocityX * damping, 0);
  }

  if ((kb.presses('space') || kb.presses('up')) && canJump) {
    addVelocityChange(player, 0, -JUMP_SPEED, "jump");
    player.groundGrace = 0;
    playSound('jump');
  }

  const mantling = tryMantle(player, direction, onGround);
  applyVelocityChange(player);

  updateHealth(player);
  updateAnimation(player, direction, mantling ? false : onGround);
}

function updateAnimation(player, direction, onGround) {
  if (!player.idleReady) {
    return;
  }

  player.anis.scale = { x: player.facing, y: 1 };

  if (player.hurtTimer > 0) {
    player.changeAni('hurt');
  } else if (direction !== 0 && onGround) {
    player.changeAni('run');
  } else {
    player.changeAni('idle');
  }
}

function tryMantle(player, direction, onGround) {
  if (
    !onGround ||
    direction === 0 ||
    player.mantleCooldown > 0 ||
    Math.abs(getProjectedVelocity(player).x) > 1.2
  ) {
    return false;
  }

  const frontX = player.x + direction * (player.w / 2 + MANTLE_FRONT_OFFSET);
  const feetY = player.y + player.h / 2;
  const lowY = feetY - MANTLE_MIN_HEIGHT;
  const highY = feetY - MANTLE_MAX_HEIGHT;
  const wallAtFeet = rayHitsTile(frontX, feetY, frontX, lowY);
  const headroom = !rayHitsTile(
    frontX,
    player.y - player.h / 2 + 2,
    frontX,
    highY
  );

  if (!wallAtFeet || !headroom) {
    return false;
  }

  setVerticalVelocity(player, -MANTLE_SPEED);
  addVelocityChange(player, direction * 0.35, 0);
  player.mantleCooldown = MANTLE_COOLDOWN;
  return true;
}

function rayHitsTile(fromX, fromY, toX, toY) {
  return world
    .rayCastAll({ x: fromX, y: fromY }, { x: toX, y: toY })
    .some((sprite) => sprite.isTile);
}

function updateHealth(player) {
  if (player.hurtTimer > 0) {
    player.hurtTimer -= FRAME_SECONDS;
  }

  player.health = Math.min(
    player.maxHealth,
    player.health + REGEN_PER_SECOND * FRAME_SECONDS
  );
}

export function damagePlayer(player, amount) {
  if (amount <= 0) {
    return;
  }

  player.health = Math.max(0, player.health - amount);
  player.hurtTimer = HURT_SECONDS;
  player.changeAni('hurt');
  player.ani.frame = 0;
}

export function isDead(player) {
  return player.health <= 0;
}

// use short raycast for ground detection as vel.y is also 0 at top of jump
function isOnGround(player) {
  if (getProjectedVelocity(player).y < -0.5) {
    return false; // moving up
  }

  const feetY = player.y + player.h / 2;
  const inset = player.w / 2 - 2;

  for (const offsetX of [-inset, 0, inset]) {
    const hits = world.rayCastAll(
      { x: player.x + offsetX, y: feetY - GROUND_CHECK_UP },
      { x: player.x + offsetX, y: feetY + GROUND_CHECK_DOWN }
    );

    if (hits.some((sprite) => sprite.isTile)) {
      return true;
    }
  }

  return false;
}
