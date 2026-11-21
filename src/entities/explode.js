import {
  addVelocityChange,
  getProjectedVelocity
} from './velocity.js';

export const standardDynamite = {
  blastRadius: 250,
  force: 24, // tuned with gravity 30: a blast at your feet launches ~7 tiles
  damage: 40,
  upwardBias: 0.3
};

// how far apart the side rays are, as a fraction of the player's half-size.
const RAY_SPREAD = 0.8;

/**
 * applies an explosion at (blastX, blastY) to the player.
 *
 * proposes velocity change via addvelocitychange, velocity.js handles applying
 *
 * @param player the player sprite
 * @param blastX blast centre x
 * @param blastY blast centre y
 * @param config what kind of dynamite
 * @param ignore groups/sprites the line-of-sight rays pass through, so they offer no blast protection
 */
export function explode(player, blastX, blastY, config, ignore = []) {
  // how far
  const offsetX = player.x - blastX;
  const offsetY = player.y - blastY;
  const distanceToBlast = Math.sqrt(offsetX * offsetX + offsetY * offsetY);

  if (distanceToBlast > config.blastRadius) {
    return { hit: false };
  }

  // what direction from the player
  let lineX;
  let lineY;

  if (distanceToBlast < 1) {
    lineX = 0;
    lineY = -1;
  } else {
    lineX = offsetX / distanceToBlast;
    lineY = offsetY / distanceToBlast;
  }

  // check if player is exposed to blast via line of sight raycast
  const exposure = getExposure(player, blastX, blastY, lineX, lineY, ignore);

  if (exposure.fraction === 0) {
    return { hit: false, rays: exposure.rays };
  }

  // strength: quadratic falloff, scaled by how much of the player is exposed
  const proximity = 1 - distanceToBlast / config.blastRadius;
  const falloffStrength = proximity * proximity;
  const blastStrength = falloffStrength * exposure.fraction;

  // where are we going to push the player
  let pushX = lineX;
  let pushY = lineY - config.upwardBias;
  const pushLength = Math.sqrt(pushX * pushX + pushY * pushY);
  pushX /= pushLength;
  pushY /= pushLength;

  // cancel velocity that doesn't align with push direction so breaking your fall with dynamite will still launch you
  const projected = getProjectedVelocity(player);
  const along = projected.x * pushX + projected.y * pushY;

  let changeX = 0;
  let changeY = 0;

  if (along < 0) {
    changeX = -pushX * along;
    changeY = -pushY * along;
  }

  const impulse = config.force * blastStrength;
  changeX += pushX * impulse;
  changeY += pushY * impulse;

  // propose vel change
  addVelocityChange(player, changeX, changeY, "explosion");

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

// casts three rays from the blast to the player (centre and two sides,
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

    // could be useful for debug, keep around
    rays.push({ toX: target.x, toY: target.y, didHit });
  }

  return { fraction: hitCount / targets.length, rays };
}

// make sure we are finding the closest one (that isn't blast transparent)
function firstRayHit(fromX, fromY, toX, toY, ignore) {
  const hits = world.rayCastAll(
    { x: fromX, y: fromY },
    { x: toX, y: toY }
  );

  // if it is transparent to blast force ignore it
  return hits.find(
    (sprite) => !sprite.ignoreRays && !isIgnored(sprite, ignore)
  );
}

function isIgnored(sprite, ignore) {
  return ignore.some(
    (entry) => entry === sprite || (Array.isArray(entry) && entry.includes(sprite))
  );
}
