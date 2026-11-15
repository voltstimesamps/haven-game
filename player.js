import {
  addVelocityChange,
  getProjectedVelocity,
  setVerticalVelocity,
  applyVelocityChange
} from './velocity.js';

// --- Movement tuning ---
// Velocities are Box2D meters/second (60px per meter), changes are per frame.
const RUN_SPEED = 3.2; // top running speed
const GROUND_ACCEL = 0.45; // speed gained per frame while running on ground
const AIR_ACCEL = 0.25; // weaker steering in the air
const GROUND_STOP = 0.3; // fraction of speed lost per frame with no input
const GROUND_SLIDE = 0.05; // gentler braking when sliding faster than a run (after a blast)
const AIR_DRAG = 0.015; // tiny, so blast launches carry their momentum
const JUMP_SPEED = 9.5; // ~90px (2.8 tiles) with gravity 30

// --- Health ---
const MAX_HEALTH = 100;
const REGEN_PER_SECOND = MAX_HEALTH / 2; // half -> full in 1 second
const HURT_SECONDS = 0.5;
const FRAME_SECONDS = 1 / 60;

export function createPlayer(playerSettings) {
  const sprite = new Sprite(
    playerSettings.x,
    playerSettings.y,
    32,
    48
  );

  sprite.addAni(
    'idle',
    ...playerSettings.idleFrames
  );

  // updatePlayer switches to 'run', so it has to exist on the sprite.
  // Sprite sheets need a frame count, or q5play crashes reading them.
  sprite.addAni('run', playerSettings.runImage, playerSettings.runFrames);
  sprite.addAni('hurt', playerSettings.hurtImage, playerSettings.hurtFrames);

  sprite.anis.run.frameDelay = 4;
  sprite.anis.hurt.frameDelay = 2;

  sprite.changeAni('idle');
  sprite.ani.frameDelay = 12;

  sprite.inputEnabled = playerSettings.inputEnabled;
  sprite.rotationLock = true;

  // No physics friction: it makes Dan stick to walls mid-air. Stopping on
  // the ground is handled in updatePlayer instead.
  sprite.friction = 0;
  sprite.bounciness = 0;

  sprite.facing = 1;
  sprite.health = MAX_HEALTH;
  sprite.maxHealth = MAX_HEALTH;
  sprite.hurtTimer = 0;

  return sprite;
}

export function updatePlayer(player) {
  if (!player || !player.inputEnabled) {
    return;
  }

  const onGround = isOnGround(player);
  const direction =
    (kb.pressing('right') ? 1 : 0) - (kb.pressing('left') ? 1 : 0);

  // Uses the projected velocity so blasts queued this frame are included.
  const velocityX = getProjectedVelocity(player).x;

  if (direction !== 0) {
    const accel = onGround ? GROUND_ACCEL : AIR_ACCEL;
    const speedInDirection = velocityX * direction;

    // Only speed up to RUN_SPEED; never slow down a faster blast launch.
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

  if ((kb.presses('space') || kb.presses('up')) && onGround) {
    setVerticalVelocity(player, -JUMP_SPEED);
  }

  applyVelocityChange(player);

  updateHealth(player);
  updateAnimation(player, direction, onGround);
}

function updateAnimation(player, direction, onGround) {
  // Flip every animation to face the way Dan last moved.
  player.anis.scale = { x: player.facing, y: 1 };

  if (player.hurtTimer > 0) {
    player.changeAni('hurt');
  } else if (direction !== 0 && onGround) {
    player.changeAni('run');
  } else {
    player.changeAni('idle');
  }
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

// Short rays down from Dan's feet (left, middle, right). More reliable
// than checking vel.y, which is also ~0 at the top of a jump.
function isOnGround(player) {
  if (getProjectedVelocity(player).y < -0.5) {
    return false; // moving up, e.g. the frame a jump or blast starts
  }

  const feetY = player.y + player.h / 2;
  const inset = player.w / 2 - 3;

  for (const offsetX of [-inset, 0, inset]) {
    const hits = world.rayCastAll(
      { x: player.x + offsetX, y: feetY - 4 },
      { x: player.x + offsetX, y: feetY + 4 }
    );

    if (hits.some((sprite) => sprite.isTile)) {
      return true;
    }
  }

  return false;
}
