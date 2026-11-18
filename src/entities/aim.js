// logic for held items that aim around Dan and have hitboxes

const AIM_SMOOTHING = 0.35;
const SURFACE_PADDING = 6; // extra buffer to prevent 1-frame movement clipping

export function mouseAngleFrom(player) {
  return atan2(mouse.y - player.y, mouse.x - player.x);
}

export function initHeldItem(
  item,
  {
    initialAngle = 90,
    hitbox = null // e.g. { length: 46, thickness: 6, startOffset: 16 }
  } = {}
) {
  item.aimAngle = initialAngle;
  item.clampedLength = hitbox ? hitbox.length : 0;
  item.worldX = 0;
  item.worldY = 0;
  item.hitbox = null;
  item.hitboxConfig = hitbox;

  return item;
}

function createHitboxSprite(item, player) {
  if (!item.hitboxConfig) {
    return null;
  }

  const { length, thickness, startOffset } = item.hitboxConfig;
  const shaftLength = Math.max(4, length - startOffset);
  const sprite = new Sprite(player.x, player.y, shaftLength, thickness);

  sprite.collider = 'kinematic';
  sprite.mass = 0.001;
  sprite.gravityScale = 0;
  sprite.bounciness = 0;
  sprite.friction = 0;
  sprite.isHeldItemHitbox = true; // ignore held items in explosion.js los checks so they dont sheild dan from explosions
  sprite.visible = false; // set to true (along with debug = true) to see hitboxes
  sprite.autoDraw = false;
  sprite.passes(player);

  return sprite;
}

export function updateHeldItem(item, player, active = true) {
  if (!item || !player) {
    return;
  }

  if (!active || !player.inputEnabled) {
    destroyHeldItem(item);
    return;
  }

  if (item.hitboxConfig && !item.hitbox) {
    item.hitbox = createHitboxSprite(item, player);
  }

  aimTowardMouse(item, player);

  if (!item.hitboxConfig) {
    return;
  }

  const { length, thickness, startOffset } = item.hitboxConfig;
  const dirX = cos(item.aimAngle);
  const dirY = sin(item.aimAngle);

  const perpX = -dirY;
  const perpY = dirX;
  const halfThick = thickness * 0.5;

  const originX = player.x + (player.vel?.x ?? 0);
  const originY = player.y + (player.vel?.y ?? 0);

  const checkLength = length + SURFACE_PADDING;
  const offsets = [0, -halfThick, halfThick];

  let maxAllowedLength = length;

  for (const offset of offsets) {
    const startX = originX + perpX * offset;
    const startY = originY + perpY * offset;
    const endX = startX + dirX * checkLength;
    const endY = startY + dirY * checkLength;

    const hits = world.rayCastAll(
      { x: startX, y: startY },
      { x: endX, y: endY }
    );

    for (const hit of hits) {
      if (hit.isTile) {
        const hitDist = getRayTileDistance(
          startX,
          startY,
          dirX,
          dirY,
          checkLength,
          hit
        );
        const safeDist = Math.max(startOffset, hitDist - SURFACE_PADDING);
        if (safeDist < maxAllowedLength) {
          maxAllowedLength = safeDist;
        }
      }
    }
  }

  item.clampedLength = maxAllowedLength;

  const shaftSpan = Math.max(2, maxAllowedLength - startOffset);
  const centerDist = startOffset + shaftSpan * 0.5;

  item.worldX = player.x + dirX * centerDist;
  item.worldY = player.y + dirY * centerDist;

  if (item.hitbox) {
    item.hitbox.w = shaftSpan;
    item.hitbox.x = item.worldX;
    item.hitbox.y = item.worldY;
    item.hitbox.rotation = item.aimAngle;
  }
}

function getRayTileDistance(sx, sy, dirX, dirY, maxLen, tile) {
  let lo = 0;
  let hi = maxLen;
  const halfW = (tile.w ?? 16) * 0.5;
  const halfH = (tile.h ?? 16) * 0.5;
  const rot = -(tile.rotation ?? 0);
  const cosR = cos(rot);
  const sinR = sin(rot);

  for (let i = 0; i < 10; i++) {
    const mid = (lo + hi) * 0.5;
    const dx = sx + dirX * mid - tile.x;
    const dy = sy + dirY * mid - tile.y;

    const localX = dx * cosR - dy * sinR;
    const localY = dx * sinR + dy * cosR;

    if (Math.abs(localX) <= halfW && Math.abs(localY) <= halfH) {
      hi = mid;
    } else {
      lo = mid;
    }
  }

  return lo;
}

export function aimTowardMouse(item, player) {
  const target = mouseAngleFrom(player);

  let delta = target - item.aimAngle;
  delta = ((delta + 540) % 360) - 180;

  item.aimAngle += delta * AIM_SMOOTHING;
}

export function getHeldRenderAngle(item) {
  return item.aimAngle;
}

export function destroyHeldItem(item) {
  if (item?.hitbox) {
    item.hitbox.delete();
    item.hitbox = null;
  }
}
