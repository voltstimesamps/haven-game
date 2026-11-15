const maxPlayerSpeedX = 16;
const maxPlayerFallSpeed = 15;

const pendingChanges = new WeakMap();

function getPendingChange(player) {
  if (!pendingChanges.has(player)) {
    pendingChanges.set(player, {
      x: 0,
      y: 0
    });
  }

  return pendingChanges.get(player);
}

export function addVelocityChange(player, changeX = 0, changeY = 0) {
  const pending = getPendingChange(player);

  pending.x += changeX;
  pending.y += changeY;
}

export function getProjectedVelocity(player) {
  const pending = getPendingChange(player);

  return {
    x: player.vel.x + pending.x,
    y: player.vel.y + pending.y
  };
}

export function applyVelocityChange(player) {
  const projected = getProjectedVelocity(player);

  player.vel.x = constrain(
    projected.x,
    -maxPlayerSpeedX,
    maxPlayerSpeedX
  );

  player.vel.y = Math.min(
    projected.y,
    maxPlayerFallSpeed
  );

  pendingChanges.delete(player);
}

export function setHorizontalVelocity(player, velocityX) {
  const pending = getPendingChange(player);

  pending.x += velocityX - player.vel.x;
}

export function setVerticalVelocity(player, velocityY) {
  const pending = getPendingChange(player);

  pending.y += velocityY - player.vel.y;
}