// aim held items towards mouse cursor in a circle around Dan

const AIM_SMOOTHING = 0.35; // how snappily it swings to the mouse

export function mouseAngleFrom(player) {
  return atan2(mouse.y - player.y, mouse.x - player.x);
}

export function aimToward(item, player) {
  const target = mouseAngleFrom(player);

  // turn the shortest way round.
  let delta = target - item.aimAngle;
  delta = ((delta + 540) % 360) - 180;

  item.aimAngle += delta * AIM_SMOOTHING;
}
