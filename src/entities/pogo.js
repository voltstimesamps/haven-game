import { addVelocityChange, getProjectedVelocity } from './velocity.js';
import { aimToward } from './aim.js';

// launches dan in opposite direction it is facing when it touches the ground

const LENGTH = 46; // Dan's center to the bounce collider, px (feet are at 24)
const BOUNCE_SPEED = 10.5; // meters/second along the stick (a jump is 9.5)
const COOLDOWN_SECONDS = 0.15; // stops one landing counting as two bounces
const FRAME_SECONDS = 1 / 60;

export function createPogo() {
  return {
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

  if (!active || !player.inputEnabled) {
    pogo.touching = false;
    return;
  }

  const dirX = cos(pogo.aimAngle);
  const dirY = sin(pogo.aimAngle);

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
  // make sure that push doesn't get absorbed by falling speed while allowing for momentum building in x direction
  const projected = getProjectedVelocity(player);
  const along = projected.x * pushX + projected.y * pushY;

  if (along < BOUNCE_SPEED) {
    const change = BOUNCE_SPEED - along;
    addVelocityChange(player, pushX * change, pushY * change);
  }

  pogo.cooldown = COOLDOWN_SECONDS;
}

// placefolder for the art. we need to keep this around as an unlockable or something
export function drawPogo(pogo, player, active) {
  if (!pogo || !player?.inputEnabled || !active) {
    return;
  }

  // keep the word upright-ish by flipping it when aiming left.
  const angle = pogo.aimAngle;
  const flipped = cos(angle) < 0;

  push();
  translate(player.x, player.y);
  rotate(flipped ? angle + 180 : angle);
  textSize(10);
  textAlign(flipped ? RIGHT : LEFT, CENTER);
  stroke('#000000');
  strokeWeight(2);
  fill(pogo.touching ? color(255, 112, 80) : color(255));
  text('pogo', flipped ? -(LENGTH - 22) : LENGTH - 22, 0);
  pop();
}
