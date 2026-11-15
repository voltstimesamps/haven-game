// Shared aiming for held items: swings `item.aimAngle` (degrees) smoothly
// toward the mouse, around the player.

const AIM_SMOOTHING = 0.35; // 0..1, how snappily it swings to the mouse

export function mouseAngleFrom(player) {
  return atan2(mouse.y - player.y, mouse.x - player.x);
}

export function aimToward(item, player) {
  const target = mouseAngleFrom(player);

  // Turn the shortest way round.
  let delta = target - item.aimAngle;
  delta = ((delta + 540) % 360) - 180;

  item.aimAngle += delta * AIM_SMOOTHING;
}
