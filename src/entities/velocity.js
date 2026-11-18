const maxPlayerSpeedX = 16;
const maxPlayerFallSpeed = 15;
let maxPlayerRiseSpeed = 16;

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

export function setMaxRiseSpeed(speed) {
  maxPlayerRiseSpeed = speed;
}

export function addVelocityChange(player, changeX = 0, changeY = 0, purpose) {
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

  player.vel.y = constrain(
    projected.y,
    -maxPlayerRiseSpeed,
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
