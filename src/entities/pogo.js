import { addVelocityChange, getProjectedVelocity } from './velocity.js';
import {
  initHeldItem,
  updateHeldItem,
  getHeldRenderAngle,
  destroyHeldItem
} from './aim.js';

// launches dan in opposite direction it is facing when it touches the ground

const LENGTH = 46; // Dan's center to the bounce collider, px (feet are at 24)
const STICK_THICKNESS = 6;
const STICK_START = 16;
const BOUNCE_SPEED = 10.5; // minimum speed of a bounce in meters/s, jump is 9ish
const BOUNCE_RESTITUTION = 1.25; // what percent of velocity can pogo reflect
const COOLDOWN_SECONDS = 0.15; // stops one landing counting as two bounces
const FRAME_SECONDS = 1 / 60;

export function createPogo() {
  return initHeldItem(
    {
      touching: false,
      wasActive: false,
      cooldown: 0
    },
    {
      initialAngle: 90,
      hitbox: {
        length: LENGTH,
        thickness: STICK_THICKNESS,
        startOffset: STICK_START
      }
    }
  );
}

export function deletePogo(pogo) {
  destroyHeldItem(pogo);
}

export function updatePogo(pogo, player, active) {
  if (!pogo || !player) {
    return;
  }

  aimToward(pogo, player);

  pogo.cooldown = Math.max(0, pogo.cooldown - FRAME_SECONDS);

  if (!active || !player.inputEnabled) {
    pogo.touching = false;
    return;
  }

  const angle = getHeldRenderAngle(pogo);
  const dirX = cos(angle);
  const dirY = sin(angle);

  const wasTouching = pogo.touching;
  pogo.touching = tipTouchesTile(player, dirX, dirY);

  // bounce only on first contact, not every frame the tip stays planted.
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
  const projected = getProjectedVelocity(player);

  const along = projected.x * pushX + projected.y * pushY;

  if (along < BOUNCE_SPEED) {
    const reflectedSpeed = Math.max(BOUNCE_SPEED, -along * BOUNCE_RESTITUTION);

    const change = reflectedSpeed - along;
    addVelocityChange(player, pushX * change, pushY * change);
  }

  pogo.cooldown = COOLDOWN_SECONDS;
}

// placeholder for the art. we need to keep this around as an unlockable or something
export function drawPogo(pogo, player, active) {
  if (!pogo || !player?.inputEnabled || !active) {
    return;
  }

  const angle = getHeldRenderAngle(pogo);
  const flipped = cos(angle) < 0;

  push();
  translate(pogo.worldX, pogo.worldY);
  rotate(flipped ? angle + 180 : angle);
  textSize(10);
  textAlign(CENTER, CENTER);
  stroke('#000000');
  strokeWeight(2);
  fill(pogo.touching ? color(255, 112, 80) : color(255));
  text('pogo', 0, 0);
  pop();
}
