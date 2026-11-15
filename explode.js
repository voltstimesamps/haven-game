import {
  addVelocityChange,
  getProjectedVelocity
} from './velocity.js';

export const standardDynamite = {
  blastRadius: 150,
  force: 24, // tuned with gravity 30: a blast at your feet launches ~7 tiles
  damage: 40,
  upwardBias: 0.3
};

// How far apart the side rays are, as a fraction of the player's half-size.
const RAY_SPREAD = 0.8;

/**
 * Applies an explosion at (blastX, blastY) to the player.
 *
 * Doesn't touch velocity directly; it proposes a change through
 * addVelocityChange, which applyVelocityChange then clamps and applies.
 *
 * @param player the player sprite
 * @param blastX blast centre x
 * @param blastY blast centre y
 * @param config e.g. standardDynamite
 * @param ignore groups/sprites the line-of-sight rays pass through
 *               (e.g. [dynamiteGroup, coinsGroup])
 */
export function explode(player, blastX, blastY, config, ignore = []) {
  // 1. Range check
  const offsetX = player.x - blastX;
  const offsetY = player.y - blastY;
  const distanceToBlast = Math.sqrt(offsetX * offsetX + offsetY * offsetY);

  if (distanceToBlast > config.blastRadius) {
    return { hit: false };
  }

  // 2. Geometric direction (unit vector, no bias). If the blast is right
  //    on top of the player there's no direction, so push straight up.
  let lineX;
  let lineY;

  if (distanceToBlast < 1) {
    lineX = 0;
    lineY = -1;
  } else {
    lineX = offsetX / distanceToBlast;
    lineY = offsetY / distanceToBlast;
  }

  // 3. Line of sight
  const exposure = getExposure(player, blastX, blastY, lineX, lineY, ignore);

  if (exposure.fraction === 0) {
    return { hit: false, rays: exposure.rays };
  }

  // 4. Strength: quadratic falloff, scaled by how much of the player is exposed
  const proximity = 1 - distanceToBlast / config.blastRadius;
  const falloffStrength = proximity * proximity;
  const blastStrength = falloffStrength * exposure.fraction;

  // 5. Push direction (biased up, re-normalized). Negative y is up.
  let pushX = lineX;
  let pushY = lineY - config.upwardBias;
  const pushLength = Math.sqrt(pushX * pushX + pushY * pushY);
  pushX /= pushLength;
  pushY /= pushLength;

  // 6. Cancel the part of the projected velocity that opposes the push,
  //    so e.g. falling onto a blast doesn't swallow the launch.
  const projected = getProjectedVelocity(player);
  const along = projected.x * pushX + projected.y * pushY;

  let changeX = 0;
  let changeY = 0;

  if (along < 0) {
    changeX = -pushX * along;
    changeY = -pushY * along;
  }

  // 7. Impulse
  const impulse = config.force * blastStrength;
  changeX += pushX * impulse;
  changeY += pushY * impulse;

  // 8. Propose it
  addVelocityChange(player, changeX, changeY);

  return {
    hit: true,
    blastStrength,
    exposureFraction: exposure.fraction,
    pushX,
    pushY,
    changeX,
    changeY,
    rays: exposure.rays
  };
}

// Casts three rays from the blast to the player (centre and two sides,
// spread perpendicular to the blast line) and returns how many reach them.
function getExposure(player, blastX, blastY, lineX, lineY, ignore) {
  // 90° rotation, both computed from the original line values
  const perpX = -lineY;
  const perpY = lineX;
  const halfSpread = (Math.min(player.w, player.h) / 2) * RAY_SPREAD;

  const targets = [
    { x: player.x, y: player.y },
    { x: player.x + perpX * halfSpread, y: player.y + perpY * halfSpread },
    { x: player.x - perpX * halfSpread, y: player.y - perpY * halfSpread }
  ];

  const rays = [];
  let hitCount = 0;

  for (const target of targets) {
    const firstHit = firstRayHit(blastX, blastY, target.x, target.y, ignore);
    const didHit = firstHit === player;

    if (didHit) {
      hitCount++;
    }

    // Kept for debug drawing
    rays.push({ toX: target.x, toY: target.y, didHit });
  }

  return { fraction: hitCount / targets.length, rays };
}

// world.rayCast() stops at whichever hit Box2D reports first, which isn't
// necessarily the closest. rayCastAll() collects every hit sorted by
// distance, so take the nearest one that isn't ignored.
function firstRayHit(fromX, fromY, toX, toY, ignore) {
  const hits = world.rayCastAll(
    { x: fromX, y: fromY },
    { x: toX, y: toY }
  );

  // ignoreRays: sensors like the door, trigger and chaser never block.
  return hits.find(
    (sprite) => !sprite.ignoreRays && !isIgnored(sprite, ignore)
  );
}

function isIgnored(sprite, ignore) {
  return ignore.some(
    (entry) => entry === sprite || (Array.isArray(entry) && entry.includes(sprite))
  );
}
