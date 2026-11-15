import { addVelocityChange, getProjectedVelocity } from './velocity.js';
import { aimToward } from './aim.js';

// A limited-use bounce item. It floats on Dan's aim line like the
// dynamite; when its tip touches a solid tile it launches Dan the opposite
// way along the stick. Point it down to hop up, down-left to hop up-right,
// sideways into a wall to kick off it.

export const POGO_CHARGES = 999; // bounces per level

const LENGTH = 46; // Dan's centre to the rubber tip, px (feet are at 24)
const BOUNCE_SPEED = 10.5; // meters/second along the stick (a jump is 9.5)
const COOLDOWN_SECONDS = 0.15; // stops one landing counting as two bounces
const FRAME_SECONDS = 1 / 60;

export function createPogo() {
  return {
    charges: POGO_CHARGES,
    aimAngle: 90, // pointing down
    touching: false,
    cooldown: 0
  };
}

export function updatePogo(pogo, player, active) {
  if (!pogo || !player) {
    return;
  }

  aimToward(pogo, player);

  pogo.cooldown = Math.max(0, pogo.cooldown - FRAME_SECONDS);

  if (!active || pogo.charges <= 0 || !player.inputEnabled) {
    pogo.touching = false;
    return;
  }

  const dirX = cos(pogo.aimAngle);
  const dirY = sin(pogo.aimAngle);

  const wasTouching = pogo.touching;
  pogo.touching = tipTouchesTile(player, dirX, dirY);

  // Bounce on first contact, not every frame the tip stays planted.
  if (pogo.touching && !wasTouching && pogo.cooldown <= 0) {
    bounce(pogo, player, -dirX, -dirY);
  }
}

function tipTouchesTile(player, dirX, dirY) {
  const hits = world.rayCastAll(
    { x: player.x, y: player.y },
    { x: player.x + dirX * LENGTH, y: player.y + dirY * LENGTH }
  );

  return hits.some((sprite) => sprite.isTile);
}

function bounce(pogo, player, pushX, pushY) {
  // Make Dan's speed along the push direction at least BOUNCE_SPEED.
  // Falling into the ground is cancelled out, and sideways speed is kept,
  // so chained hops carry momentum like a bunny hop.
  const projected = getProjectedVelocity(player);
  const along = projected.x * pushX + projected.y * pushY;

  if (along < BOUNCE_SPEED) {
    const change = BOUNCE_SPEED - along;
    addVelocityChange(player, pushX * change, pushY * change);
  }

  pogo.charges--;
  pogo.cooldown = COOLDOWN_SECONDS;
}

// Placeholder: the word "pogo" laid along the aim line, reaching out to
// where the tip is. Call with the camera on.
export function drawPogo(pogo, player, active) {
  if (!pogo || !player?.inputEnabled || !active || pogo.charges <= 0) {
    return;
  }

  // Keep the word upright-ish: flip it when aiming left.
  const angle = pogo.aimAngle;
  const flipped = cos(angle) < 0;

  push();
  translate(player.x, player.y);
  rotate(flipped ? angle + 180 : angle);
  textSize(10);
  textAlign(flipped ? RIGHT : LEFT, CENTER);
  stroke('#000000');
  strokeWeight(2);
  fill(pogo.touching ? '#ff7050' : '#ffffff');
  text('pogo', flipped ? -(LENGTH - 22) : LENGTH - 22, 0);
  pop();
}
